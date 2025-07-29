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
import { internal } from "./_generated/api";
import { Resend } from "resend";

export const createNotification = mutation({
  args: {
    postId: v.id("posts"),
    type: v.union(
      v.literal("deadline"),
      v.literal("reminder"),
      v.literal("overdue"),
      v.literal("published"),
      v.literal("daily"),
    ),
    message: v.string(),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("notifications", {
      userId,
      ...args,
      sent: false,
    });
  },
});

export const getUserNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const schedulePostNotifications = internalAction({
  args: {
    postId: v.id("posts"),
    scheduledDate: v.number(),
    reminderHours: v.number(),
    notificationTime: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.runQuery(internal.notifications.getPostById, {
      id: args.postId,
    });

    if (!post) {
      return;
    }

    const user = await ctx.runQuery(internal.notifications.getUserById, {
      id: post.userId,
    });

    if (!user?.email) {
      return;
    }

    // Clear existing notifications for this post
    await ctx.runMutation(internal.notifications.clearPostNotifications, {
      postId: args.postId,
    });

    const scheduledDate = new Date(args.scheduledDate);
    const reminderTime = new Date(
      args.scheduledDate - args.reminderHours * 60 * 60 * 1000,
    );
    const now = new Date();

    // Schedule reminder notification
    if (reminderTime > now) {
      const reminderNotificationId = await ctx.runMutation(
        internal.notifications.createInternalNotification,
        {
          userId: post.userId,
          postId: args.postId,
          type: "reminder",
          message: `Напоминание: "${post.title}" запланирован к публикации ${scheduledDate.toLocaleDateString("ru-RU")} в ${scheduledDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} на ${getPlatformName(post.platform)}`,
          scheduledFor: reminderTime.getTime(),
        },
      );

      await ctx.scheduler.runAt(
        reminderTime.getTime(),
        internal.notifications.sendNotificationEmail,
        {
          notificationId: reminderNotificationId,
        },
      );
    }

    // Schedule publication notification
    const publicationNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: post.userId,
        postId: args.postId,
        type: "published",
        message: `🎉 Ваш пост "${post.title}" опубликован на ${getPlatformName(post.platform)}!`,
        scheduledFor: args.scheduledDate,
      },
    );

    await ctx.scheduler.runAt(
      args.scheduledDate,
      internal.notifications.sendNotificationEmail,
      {
        notificationId: publicationNotificationId,
      },
    );

    // Schedule daily reminders if enabled
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.scheduleDailyReminders,
      {
        userId: post.userId,
        notificationTime: args.notificationTime,
      },
    );
  },
});

export const scheduleDailyReminders = internalAction({
  args: {
    userId: v.id("users"),
    notificationTime: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.notifications.getUserById, {
      id: args.userId,
    });

    if (!user?.email) {
      return;
    }

    // Get user's posts that need daily reminders
    const posts = await ctx.runQuery(
      internal.notifications.getUserPostsForReminders,
      {
        userId: args.userId,
      },
    );

    if (posts.length === 0) {
      return;
    }

    // Calculate next reminder time
    const now = new Date();
    const [hours, minutes] = args.notificationTime.split(":").map(Number);
    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const dailyNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: args.userId,
        postId: posts[0]._id, // Use first post as reference
        type: "daily",
        message: `📋 Ежедневный отчет: У вас ${posts.length} активных постов в работе`,
        scheduledFor: nextReminder.getTime(),
      },
    );

    await ctx.scheduler.runAt(
      nextReminder.getTime(),
      internal.notifications.sendDailyReminder,
      {
        notificationId: dailyNotificationId,
        userId: args.userId,
      },
    );
  },
});

export const sendDailyReminder = internalAction({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.notifications.getUserById, {
      id: args.userId,
    });

    if (!user?.email) {
      return;
    }

    const posts = await ctx.runQuery(
      internal.notifications.getUserPostsForReminders,
      {
        userId: args.userId,
      },
    );

    const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);

    try {
      await resend.emails.send({
        from: "Content Creator Assistant <notifications@contentcreator.app>",
        to: user.email,
        subject: "📋 Ежедневный отчет по контенту",
        html: getDailyReminderContent(posts),
      });

      await ctx.runMutation(internal.notifications.markNotificationSent, {
        id: args.notificationId,
      });

      // Schedule next daily reminder
      await ctx.runAction(internal.notifications.scheduleDailyReminders, {
        userId: args.userId,
        notificationTime: "09:00", // Default time, should be user preference
      });
    } catch (error) {
      console.error("Failed to send daily reminder:", error);
    }
  },
});

export const sendNotificationEmail = internalAction({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.runQuery(
      internal.notifications.getNotificationById,
      {
        id: args.notificationId,
      },
    );

    if (!notification || notification.sent) {
      return;
    }

    const user = await ctx.runQuery(internal.notifications.getUserById, {
      id: notification.userId,
    });

    if (!user?.email) {
      return;
    }

    const post = await ctx.runQuery(internal.notifications.getPostById, {
      id: notification.postId,
    });

    const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);

    try {
      await resend.emails.send({
        from: "Content Creator Assistant <notifications@contentcreator.app>",
        to: user.email,
        subject: getEmailSubject(notification.type),
        html: getEmailContent(notification, post),
      });

      await ctx.runMutation(internal.notifications.markNotificationSent, {
        id: args.notificationId,
      });
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  },
});

export const getNotificationById = internalQuery({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPostById = internalQuery({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserById = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserPostsForReminders = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("enableNotifications"), true),
          q.or(
            q.eq(q.field("status"), "schedule"),
            q.eq(q.field("status"), "idea"),
          ),
        ),
      )
      .collect();
  },
});

export const createInternalNotification = internalMutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
    type: v.union(
      v.literal("deadline"),
      v.literal("reminder"),
      v.literal("overdue"),
      v.literal("published"),
      v.literal("daily"),
    ),
    message: v.string(),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      sent: false,
    });
  },
});

export const clearPostNotifications = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("sent"), false))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
  },
});

export const markNotificationSent = internalMutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { sent: true });
  },
});

function getPlatformName(platform: string): string {
  const names = {
    instagram: "Instagram",
    X: "X",
    youtube: "YouTube",
    telegram: "Telegram",
  };
  return names[platform as keyof typeof names] || platform;
}

function getEmailSubject(type: string): string {
  switch (type) {
    case "deadline":
      return "📅 Приближается дедлайн публикации";
    case "reminder":
      return "⏰ Напоминание о публикации контента";
    case "overdue":
      return "🚨 Просроченный контент";
    case "published":
      return "🎉 Контент опубликован!";
    case "daily":
      return "📋 Ежедневный отчет по контенту";
    default:
      return "Content Creator Notification";
  }
}

function getEmailContent(notification: any, post?: any): string {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Content Creator Assistant</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Ваш помощник по управлению контентом</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          Это автоматическое уведомление от Content Creator Assistant
        </p>
        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
          Вы получили это письмо, потому что включили уведомления для своих постов
        </p>
      </div>
    </div>
  `;

  let content = "";

  if (post) {
    content = `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${post.title}</h3>
        <p style="margin: 0 0 10px 0; color: #666;">${post.content.substring(0, 150)}${post.content.length > 150 ? "..." : ""}</p>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${getPlatformName(post.platform)}
          </span>
          ${
            post.scheduledDate
              ? `
            <span style="color: #666; font-size: 12px;">
              📅 ${new Date(post.scheduledDate).toLocaleDateString("ru-RU")} в ${new Date(post.scheduledDate).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  return (
    baseStyle +
    `
    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">${notification.message}</p>
      ${content}
    </div>
  ` +
    footerStyle
  );
}

function getDailyReminderContent(posts: any[]): string {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Ежедневный отчет</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Ваш контент-план на сегодня</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          Удачного дня и продуктивной работы! 🚀
        </p>
      </div>
    </div>
  `;

  const scheduledPosts = posts.filter((p) => p.status === "schedule");
  const ideaPosts = posts.filter((p) => p.status === "idea");

  let content = `
    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h2 style="color: #333; margin: 0 0 20px 0;">Сводка по контенту</h2>
      
      <div style="display: grid; gap: 15px; margin-bottom: 30px;">
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
          <h4 style="margin: 0 0 5px 0; color: #2e7d32;">⏰ Запланировано: ${scheduledPosts.length}</h4>
        </div>

        <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #9c27b0;">
          <h4 style="margin: 0 0 5px 0; color: #7b1fa2;">💡 Идей: ${ideaPosts.length}</h4>
        </div>
      </div>
  `;

  if (scheduledPosts.length > 0) {
    content += `
      <h3 style="color: #333; margin: 0 0 15px 0;">Сегодня к публикации:</h3>
      <div style="margin-bottom: 20px;">
    `;

    const today = new Date();
    const todaysPosts = scheduledPosts.filter((post) => {
      if (!post.scheduledDate) return false;
      const postDate = new Date(post.scheduledDate);
      return postDate.toDateString() === today.toDateString();
    });

    if (todaysPosts.length > 0) {
      todaysPosts.forEach((post) => {
        content += `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <h4 style="margin: 0 0 5px 0; color: #333;">${post.title}</h4>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${post.content.substring(0, 100)}...</p>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${getPlatformName(post.platform)}
              </span>
              <span style="color: #666; font-size: 12px;">
                🕐 ${new Date(post.scheduledDate).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        `;
      });
    } else {
      content += `<p style="color: #666; font-style: italic;">На сегодня публикаций не запланировано</p>`;
    }

    content += `</div>`;
  }

  content += `</div>`;

  return baseStyle + content + footerStyle;
}
