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
import { Resend } from "resend";

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

    // Check if Resend API key is available
    const resendApiKey = process.env.CONVEX_RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Create email content
    const emailContent = createShareEmailContent(args.postData, userEmail);

    // Log email details for debugging
    console.log("Sending email:", {
      to: args.email,
      from: "onboarding@resend.dev",
      subject: `Shared Post: ${args.postData.title || "Content"}`,
      userEmail,
      postData: {
        title: args.postData.title,
        platform: args.postData.platform,
        status: args.postData.status,
        hasContent: !!args.postData.content,
        hasMedia: args.postData.mediaUrls && args.postData.mediaUrls.length > 0,
        hashtagsCount: args.postData.hashtags
          ? args.postData.hashtags.length
          : 0,
      },
    });

    // Send email using Resend
    const result = await resend.emails.send({
      from: "onboarding@resend.dev", // Use Resend's default domain for testing
      to: args.email,
      subject: `Shared Post: ${args.postData.title || "Content"}`,
      html: emailContent,
    });

    console.log("Email sent successfully:", result);
    return { success: true };
  },
});

function createShareEmailContent(postData: any, userEmail: string): string {
  const platformNames = {
    instagram: "Instagram",
    X: "X (Twitter)",
    youtube: "YouTube",
    telegram: "Telegram",
  };

  const platformName =
    platformNames[postData.platform as keyof typeof platformNames] ||
    postData.platform;

  const statusText = {
    idea: "Idea",
    schedule: "Schedule",
  };

  const statusColor = {
    idea: "#9C27B0",
    schedule: "#FF9800",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shared Content</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">Content Shared</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 16px; font-weight: 300;">Someone shared interesting content with you</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <!-- Platform Info -->
          <div style="display: flex; align-items: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border-left: 4px solid ${statusColor[postData.status as keyof typeof statusColor] || "#667eea"}">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; margin-right: 20px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              <span style="color: white; font-size: 24px; font-weight: bold;">${platformName.charAt(0)}</span>
            </div>
            <div>
              <h2 style="margin: 0; color: #2c3e50; font-size: 20px; font-weight: 600;">${platformName}</h2>
              <p style="margin: 8px 0 0 0; color: #7f8c8d; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${statusText[postData.status as keyof typeof statusText] || "Unknown"}</p>
            </div>
          </div>

          <!-- Title -->
          ${postData.title ? `<h3 style="margin: 0 0 25px 0; color: #2c3e50; font-size: 24px; font-weight: 600; line-height: 1.3;">${postData.title}</h3>` : ""}

          <!-- Content -->
          ${postData.content ? `<div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #667eea;"><p style="margin: 0; color: #34495e; line-height: 1.7; font-size: 16px; font-weight: 400;">${postData.content}</p></div>` : ""}

          <!-- Media Files -->
          ${
            postData.mediaUrls && postData.mediaUrls.length > 0
              ? `
            <div style="margin-bottom: 30px;">
              <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px; font-weight: 600;">Media Files (${postData.mediaUrls.length})</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                ${postData.mediaUrls
                  .slice(0, 6)
                  .map(
                    (url: string, index: number) => `
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px; padding: 20px; text-align: center; border: 2px solid #e9ecef; transition: all 0.3s ease;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
                      <span style="color: white; font-size: 16px; font-weight: bold;">${index + 1}</span>
                    </div>
                    <p style="margin: 0; color: #7f8c8d; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Media File</p>
                  </div>
                `,
                  )
                  .join("")}
                ${
                  postData.mediaUrls.length > 6
                    ? `
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px; padding: 20px; text-align: center; border: 2px solid #e9ecef;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
                      <span style="color: white; font-size: 16px; font-weight: bold;">+</span>
                    </div>
                    <p style="margin: 0; color: #7f8c8d; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${postData.mediaUrls.length - 6} More</p>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
              : ""
          }

          <!-- Hashtags -->
          ${
            postData.hashtags && postData.hashtags.length > 0
              ? `
            <div style="margin-bottom: 30px;">
              <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px; font-weight: 600;">Hashtags</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${postData.hashtags
                  .map(
                    (tag: string) => `
                  <span style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); color: #1976d2; padding: 8px 16px; border-radius: 25px; font-size: 13px; font-weight: 600; border: 1px solid #e3f2fd; box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);">
                    #${tag}
                  </span>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <!-- Creation Date -->
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #7f8c8d; font-size: 14px; font-weight: 500;">
              <strong style="color: #2c3e50;">Created:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2c3e50; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="color: #bdc3c7; font-size: 14px; margin: 0 0 10px 0; font-weight: 300;">
            This email was sent via Content Creator Assistant
          </p>
          <p style="color: #95a5a6; font-size: 12px; margin: 0 0 10px 0; font-weight: 300;">
            Shared by: ${userEmail}
          </p>
          <p style="color: #95a5a6; font-size: 12px; margin: 0; font-weight: 300;">
            If you didn't expect this email, please ignore it
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
