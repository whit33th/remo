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
  returns: v.id("notifications"),
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
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
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
      sent: v.boolean(),
      scheduledFor: v.number(),
    }),
  ),
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.runQuery(internal.notifications.getPostById, {
      id: args.postId,
    });

    if (!post) {
      return null;
    }

    const user = await ctx.runQuery(internal.notifications.getUserById, {
      id: post.userId,
    });

    if (!user?.email) {
      return null;
    }

    // Создаем уведомление о дедлайне
    const deadlineNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: post.userId,
        postId: post._id,
        type: "deadline",
        message: `📅 Приближается дедлайн публикации поста "${post.title}" на ${getPlatformName(post.platform)}`,
        scheduledFor: args.scheduledDate,
      },
    );

    // Планируем отправку email о дедлайне
    await ctx.scheduler.runAt(
      args.scheduledDate,
      internal.sendEmails.sendNotificationEmail,
      {
        notificationId: deadlineNotificationId,
      },
    );

    // Создаем уведомление-напоминание
    const reminderTime =
      args.scheduledDate - args.reminderHours * 60 * 60 * 1000;
    if (reminderTime > Date.now()) {
      const reminderNotificationId = await ctx.runMutation(
        internal.notifications.createInternalNotification,
        {
          userId: post.userId,
          postId: post._id,
          type: "reminder",
          message: `⏰ Напоминание: через ${args.reminderHours} часов нужно опубликовать пост "${post.title}" на ${getPlatformName(post.platform)}`,
          scheduledFor: reminderTime,
        },
      );

      // Планируем отправку email-напоминания
      await ctx.scheduler.runAt(
        reminderTime,
        internal.sendEmails.sendNotificationEmail,
        {
          notificationId: reminderNotificationId,
        },
      );
    }

    // Создаем уведомление о публикации
    const publicationNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: post.userId,
        postId: post._id,
        type: "published",
        message: `🎉 Пост "${post.title}" успешно опубликован на ${getPlatformName(post.platform)}!`,
        scheduledFor: args.scheduledDate + 5 * 60 * 1000, // +5 минут после публикации
      },
    );

    // Планируем отправку email о публикации
    await ctx.scheduler.runAt(
      args.scheduledDate + 5 * 60 * 1000,
      internal.sendEmails.sendNotificationEmail,
      {
        notificationId: publicationNotificationId,
      },
    );

    // Планируем ежедневные напоминания
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.scheduleDailyReminders,
      {
        userId: post.userId,
        notificationTime: args.notificationTime,
      },
    );

    return null;
  },
});

export const scheduleDailyReminders = internalAction({
  args: {
    userId: v.id("users"),
    notificationTime: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.notifications.getUserById, {
      id: args.userId,
    });

    if (!user?.email) {
      return null;
    }

    // Получаем посты пользователя для напоминаний
    const posts = await ctx.runQuery(
      internal.notifications.getUserPostsForReminders,
      {
        userId: args.userId,
      },
    );

    if (posts.length === 0) {
      return null;
    }

    // Вычисляем время следующего напоминания
    const now = new Date();
    const [hours, minutes] = args.notificationTime.split(":").map(Number);
    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    // Если время уже прошло сегодня, планируем на завтра
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const dailyNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: args.userId,
        postId: posts[0]._id, // Используем первый пост как референс
        type: "daily",
        message: `📋 Ежедневный отчет: У вас ${posts.length} активных постов в работе`,
        scheduledFor: nextReminder.getTime(),
      },
    );

    // Планируем отправку ежедневного напоминания
    await ctx.scheduler.runAt(
      nextReminder.getTime(),
      internal.sendEmails.sendDailyReminder,
      {
        notificationId: dailyNotificationId,
        userId: args.userId,
      },
    );

    return null;
  },
});

// Вспомогательные функции
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
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      sent: false,
    });
  },
});

export const getPostById = internalQuery({
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

export const getUserById = internalQuery({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      image: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserPostsForReminders = internalQuery({
  args: { userId: v.id("users") },
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
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
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
