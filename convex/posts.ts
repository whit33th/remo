import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
  internalQuery,
  internalAction,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { components } from "./_generated/api";

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
  handler: async (ctx, args) => {
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

    // Schedule notifications if enabled and post is scheduled
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

    // Reschedule notifications if settings changed
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

    // Получаем пост для проверки владельца и медиафайлов
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.userId !== userId) {
      throw new Error("Not authorized to delete this post");
    }

    // Удаляем медиафайлы из хранилища
    if (post.mediaIds && post.mediaIds.length > 0) {
      for (const mediaId of post.mediaIds) {
        try {
          await ctx.storage.delete(mediaId);
        } catch (error) {
          console.error("Error deleting media file:", error);
          // Продолжаем удаление поста даже если не удалось удалить медиафайл
        }
      }
    }

    // Удаляем пост
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
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
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
      publishedAt: v.optional(v.number()),
      hashtags: v.array(v.string()),
      links: v.array(v.string()),
      mentions: v.array(v.string()),
      mediaIds: v.array(v.id("_storage")),
      authorBio: v.optional(v.string()),
      userId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      enableNotifications: v.optional(v.boolean()),
      notificationTime: v.optional(v.string()),
      reminderHours: v.optional(v.number()),
      mediaUrls: v.array(v.union(v.string(), v.null())),
      mediaTypes: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
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
      posts.map(async (post) => {
        const mediaInfo = await Promise.all(
          post.mediaIds.map(async (mediaId) => {
            const url = await ctx.storage.getUrl(mediaId);
            const metadata = await ctx.db.system.get(mediaId);
            return {
              url,
              contentType: metadata?.contentType || "image/jpeg",
            };
          }),
        );

        return {
          ...post,
          mediaUrls: mediaInfo.map((info) => info.url),
          mediaTypes: mediaInfo.map((info) => info.contentType),
        };
      }),
    );
  },
});

export const getScheduledPosts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
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
      publishedAt: v.optional(v.number()),
      hashtags: v.array(v.string()),
      links: v.array(v.string()),
      mentions: v.array(v.string()),
      mediaIds: v.array(v.id("_storage")),
      authorBio: v.optional(v.string()),
      userId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      enableNotifications: v.optional(v.boolean()),
      notificationTime: v.optional(v.string()),
      reminderHours: v.optional(v.number()),
      mediaUrls: v.array(v.union(v.string(), v.null())),
      mediaTypes: v.array(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", "schedule"),
      )
      .collect();

    return Promise.all(
      posts.map(async (post) => {
        const mediaInfo = await Promise.all(
          post.mediaIds.map(async (mediaId) => {
            const url = await ctx.storage.getUrl(mediaId);
            const metadata = await ctx.db.system.get(mediaId);
            return {
              url,
              contentType: metadata?.contentType || "image/jpeg",
            };
          }),
        );

        return {
          ...post,
          mediaUrls: mediaInfo.map((info) => info.url),
          mediaTypes: mediaInfo.map((info) => info.contentType),
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

    const post = await ctx.runQuery(api.posts.getPostById, {
      id: args.postId,
    });
    if (!post || post.userId !== userId) {
      throw new Error("Post not found or unauthorized");
    }

    // Здесь будет логика публикации на конкретную платформу
    // Пока что просто обновляем статус на schedule
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
        optional: ["hashtags", "location", "story", "reels", "mediaIds"],
        maxContentLength: 2200,
        maxHashtags: 30,
        mediaTypes: ["image", "video"],
        maxMediaCount: 10,
      },
      X: {
        required: ["content"],
        optional: ["hashtags", "mentions", "poll", "thread", "mediaIds"],
        maxContentLength: 280,
        maxHashtags: 10,
        mediaTypes: ["image", "video"],
        maxMediaCount: 4,
      },
      youtube: {
        required: ["title", "content"],
        optional: [
          "hashtags",
          "category",
          "privacy",
          "thumbnail",
          "timestamps",
          "mediaIds",
        ],
        maxTitleLength: 100,
        maxContentLength: 5000,
        maxHashtags: 15,
        mediaTypes: ["video"],
        maxMediaCount: 1,
      },
      telegram: {
        required: ["content"],
        optional: ["hashtags", "mentions", "buttons", "poll", "mediaIds"],
        maxContentLength: 4096,
        maxHashtags: 20,
        mediaTypes: ["image", "video", "document"],
        maxMediaCount: 10,
      },
    };

    return fields[args.platform];
  },
});

export const getPostById = query({
  args: { id: v.id("posts") },
  returns: v.union(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
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
      publishedAt: v.optional(v.number()),
      hashtags: v.array(v.string()),
      links: v.array(v.string()),
      mentions: v.array(v.string()),
      mediaIds: v.array(v.id("_storage")),
      authorBio: v.optional(v.string()),
      userId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      enableNotifications: v.optional(v.boolean()),
      notificationTime: v.optional(v.string()),
      reminderHours: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
    postData: v.object({
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      platform: v.string(),
      status: v.string(),
      hashtags: v.optional(v.array(v.string())),
      mediaUrls: v.optional(v.array(v.string())),
    }),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Validate email
    if (!args.email || !args.email.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Get current user
    const userId = await getAuthUserId(ctx);
    let userEmail = "unknown@contentcreator.app";

    if (userId) {
      try {
        const user = await ctx.runQuery(internal.notifications.getUserById, {
          id: userId,
        });
        if (user?.email) {
          userEmail = user.email;
        }
      } catch (error) {
        console.log("Could not get user info:", error);
      }
    }

    // Вызываем централизованную функцию отправки email
    await ctx.runAction(internal.sendEmails.sendShareEmail, {
      email: args.email,
      postData: args.postData,
      userEmail,
    });

    console.log("Shared post email sent successfully");
    return { success: true };
  },
});
