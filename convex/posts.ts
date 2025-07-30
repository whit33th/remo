import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { action, internalQuery, mutation, query } from "./_generated/server";

type PostWithMedia = Doc<"posts"> & {
  mediaUrls: (string | null)[];
  mediaTypes: string[];
};

type CreatePostArgs = {
  title: string;
  content: string;
  platform: "instagram" | "X" | "youtube" | "telegram";
  status: "idea" | "schedule";
  scheduledDate?: number;
  hashtags: string[];
  links: string[];
  mentions: string[];
  mediaIds: Id<"_storage">[];
  authorBio?: string;
  enableNotifications?: boolean;
  notificationTime?: string;
  reminderHours?: number;
};

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("X"),
      v.literal("youtube"),
      v.literal("telegram"),
    ),
    status: v.union(v.literal("idea"), v.literal("schedule")),
    scheduledDate: v.optional(v.number()),
    hashtags: v.array(v.string()),
    links: v.array(v.string()),
    mentions: v.array(v.string()),
    mediaIds: v.array(v.id("_storage")),
    authorBio: v.optional(v.string()),
    enableNotifications: v.optional(v.boolean()),
    notificationTime: v.optional(v.string()),
    reminderHours: v.optional(v.number()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args: CreatePostArgs): Promise<Id<"posts">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      ...args,
      userId,
      createdAt: now,
      updatedAt: now,
      enableNotifications: args.enableNotifications || false,
      notificationTime: args.notificationTime || "09:00",
      reminderHours: args.reminderHours || 24,
    });

    if (
      args.enableNotifications &&
      args.status === "schedule" &&
      args.scheduledDate
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.schedulePostNotifications,
        {
          postId,
          scheduledDate: args.scheduledDate,
          reminderHours: args.reminderHours || 24,
          notificationTime: args.notificationTime || "09:00",
        },
      );
    }

    return postId;
  },
});

export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    platform: v.optional(
      v.union(
        v.literal("instagram"),
        v.literal("X"),
        v.literal("youtube"),
        v.literal("telegram"),
      ),
    ),
    status: v.optional(v.union(v.literal("idea"), v.literal("schedule"))),
    scheduledDate: v.optional(v.number()),
    hashtags: v.optional(v.array(v.string())),
    links: v.optional(v.array(v.string())),
    mentions: v.optional(v.array(v.string())),
    mediaIds: v.optional(v.array(v.id("_storage"))),
    authorBio: v.optional(v.string()),
    enableNotifications: v.optional(v.boolean()),
    notificationTime: v.optional(v.string()),
    reminderHours: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { id, ...updates } = args;
    const post = await ctx.db.get(id);

    if (!post || post.userId !== userId) {
      throw new Error("Post not found or unauthorized");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (
      updates.enableNotifications !== undefined ||
      updates.scheduledDate !== undefined ||
      updates.reminderHours !== undefined ||
      updates.notificationTime !== undefined ||
      updates.status !== undefined
    ) {
      const updatedPost = await ctx.db.get(id);
      if (
        updatedPost?.enableNotifications &&
        updatedPost.status === "schedule" &&
        updatedPost.scheduledDate
      ) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.schedulePostNotifications,
          {
            postId: id,
            scheduledDate: updatedPost.scheduledDate,
            reminderHours: updatedPost.reminderHours || 24,
            notificationTime: updatedPost.notificationTime || "09:00",
          },
        );
      }
    }
    return null;
  },
});

export const deletePost = mutation({
  args: {
    id: v.id("posts"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.userId !== userId) {
      throw new Error("Not authorized to delete this post");
    }

    if (post.mediaIds && post.mediaIds.length > 0) {
      for (const mediaId of post.mediaIds) {
        try {
          await ctx.storage.delete(mediaId);
        } catch (error) {
          console.error("Error deleting media file:", error);
        }
      }
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

export const getUserPosts = query({
  args: {
    platform: v.optional(
      v.union(
        v.literal("instagram"),
        v.literal("X"),
        v.literal("youtube"),
        v.literal("telegram"),
      ),
    ),
    status: v.optional(v.union(v.literal("idea"), v.literal("schedule"))),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args): Promise<PostWithMedia[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.platform) {
      query = ctx.db
        .query("posts")
        .withIndex("by_user_and_platform", (q) =>
          q.eq("userId", userId).eq("platform", args.platform!),
        );
    }

    if (args.status) {
      query = ctx.db
        .query("posts")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!),
        );
    }

    const posts = await query.collect();

    return Promise.all(
      posts.map(async (post): Promise<PostWithMedia> => {
        const mediaInfo = await ctx.runQuery(internal.posts.processMediaInfo, {
          mediaIds: post.mediaIds,
        });
        return {
          ...post,
          ...mediaInfo,
        };
      }),
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const publishPost = action({
  args: {
    postId: v.id("posts"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("X"),
      v.literal("youtube"),
      v.literal("telegram"),
    ),
    publishNow: v.boolean(),
  },
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const post = await ctx.runQuery(api.posts.getPost, {
      postId: args.postId,
    });
    if (!post || post.userId !== userId) {
      throw new Error("Post not found or unauthorized");
    }

    await ctx.runMutation(api.posts.updatePostStatus, {
      postId: args.postId,
      status: "schedule",
      publishedAt: Date.now(),
    });

    return { success: true, message: `Post scheduled for ${args.platform}` };
  },
});

export const getPlatformSpecificFields = query({
  args: {
    platform: v.union(
      v.literal("instagram"),
      v.literal("X"),
      v.literal("youtube"),
      v.literal("telegram"),
    ),
  },
  returns: v.object({
    required: v.array(v.string()),
    optional: v.array(v.string()),
    maxContentLength: v.number(),
    maxHashtags: v.number(),
    mediaTypes: v.array(v.string()),
    maxMediaCount: v.number(),
    maxTitleLength: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const fields = {
      instagram: {
        required: ["content"],
        optional: ["hashtags", "links", "mentions", "authorBio", "mediaIds"],
        maxContentLength: 2200,
        maxHashtags: 30,
        mediaTypes: ["image", "video"],
        maxMediaCount: 10,
      },
      X: {
        required: ["content"],
        optional: ["hashtags", "links", "mentions", "authorBio", "mediaIds"],
        maxContentLength: 280,
        maxHashtags: 10,
        mediaTypes: ["image", "video"],
        maxMediaCount: 4,
      },
      youtube: {
        required: ["title", "content"],
        optional: ["hashtags", "links", "mentions", "authorBio", "mediaIds"],
        maxTitleLength: 100,
        maxContentLength: 5000,
        maxHashtags: 15,
        mediaTypes: ["video"],
        maxMediaCount: 1,
      },
      telegram: {
        required: ["content"],
        optional: ["hashtags", "links", "mentions", "authorBio", "mediaIds"],
        maxContentLength: 4096,
        maxHashtags: 20,
        mediaTypes: ["image", "video", "document"],
        maxMediaCount: 10,
      },
    };

    return fields[args.platform];
  },
});

export const getPost = query({
  args: { postId: v.id("posts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<PostWithMedia | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const post = await ctx.db.get(args.postId);
    if (!post || post.userId !== userId) {
      return null;
    }

    const mediaInfo: { mediaUrls: (string | null)[]; mediaTypes: string[] } =
      await ctx.runQuery(internal.posts.processMediaInfo, {
        mediaIds: post.mediaIds,
      });

    return {
      ...post,
      ...mediaInfo,
    } as PostWithMedia;
  },
});

export const updatePostStatus = mutation({
  args: {
    postId: v.id("posts"),
    status: v.union(v.literal("idea"), v.literal("schedule")),
    publishedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { postId, ...updates } = args;
    await ctx.db.patch(postId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const sharePost = action({
  args: {
    email: v.string(),
    postId: v.id("posts"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    if (!args.email || !args.email.includes("@")) {
      throw new Error("Invalid email address");
    }

    const userId = await getAuthUserId(ctx);
    let userEmail = "unknown@contentcreator.app";

    if (userId) {
      try {
        const user = await ctx.runQuery(internal.shared.getUserById, {
          id: userId,
        });
        if (user?.email) {
          userEmail = user.email;
        }
      } catch (error) {
        console.log("Could not get user info:", error);
      }
    }

    await ctx.runAction(internal.sendEmails.sendShareEmail, {
      email: args.email,
      postId: args.postId,
      userEmail,
    });

    console.log("Shared post email sent successfully");
    return { success: true };
  },
});

export const getPostById = internalQuery({
  args: { id: v.id("posts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<Doc<"posts"> | null> => {
    return await ctx.db.get(args.id);
  },
});

export const getMediaUrls = internalQuery({
  args: { mediaIds: v.array(v.id("_storage")) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const urls = [];
    for (const mediaId of args.mediaIds) {
      const url = await ctx.storage.getUrl(mediaId);
      if (url) {
        urls.push(url);
      }
    }
    return urls;
  },
});

export const processMediaInfo = internalQuery({
  args: { mediaIds: v.array(v.id("_storage")) },
  returns: v.object({
    mediaUrls: v.array(v.union(v.string(), v.null())),
    mediaTypes: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const mediaInfo = await Promise.all(
      args.mediaIds.map(async (mediaId) => {
        const url = await ctx.storage.getUrl(mediaId);
        const metadata = await ctx.db.system.get(mediaId);
        return {
          url,
          contentType: metadata?.contentType || "image/jpeg",
        };
      }),
    );

    return {
      mediaUrls: mediaInfo.map((info) => info.url),
      mediaTypes: mediaInfo.map((info) => info.contentType),
    };
  },
});
