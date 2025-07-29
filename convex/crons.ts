import { cronJobs } from "convex/server";
import { internal, components } from "./_generated/api";
import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";

// Check for overdue posts every hour
const crons = cronJobs();

crons.interval(
  "check overdue posts",
  { minutes: 60 }, // Every hour
  internal.crons.checkOverduePosts,
  {},
);

// Send daily reminders at 9 AM
crons.cron(
  "daily reminders",
  "0 9 * * *", // Every day at 9 AM
  internal.crons.sendDailyReminders,
  {},
);

// Clean up old emails from resend component every hour
crons.interval(
  "Remove old emails from the resend component",
  { hours: 1 },
  internal.crons.cleanupResend,
);

export const checkOverduePosts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const overduePosts = await ctx.runQuery(internal.crons.getOverduePosts, {
      now,
    });

    for (const post of overduePosts) {
      // Create overdue notification
      const notificationId = await ctx.runMutation(
        internal.notifications.createInternalNotification,
        {
          userId: post.userId,
          postId: post._id,
          type: "overdue",
          message: `🚨 Пост "${post.title}" просрочен! Запланированная дата публикации: ${new Date(post.scheduledDate!).toLocaleDateString("ru-RU")}`,
          scheduledFor: now,
        },
      );

      // Send email notification using new sendEmails function
      await ctx.runAction(internal.sendEmails.sendNotificationEmail, {
        notificationId,
      });
    }
    return null;
  },
});

export const sendDailyReminders = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const usersWithNotifications = await ctx.runQuery(
      internal.crons.getUsersWithNotificationsEnabled,
      {},
    );

    for (const user of usersWithNotifications) {
      await ctx.runAction(internal.notifications.scheduleDailyReminders, {
        userId: user._id,
        notificationTime: "09:00",
      });
    }
    return null;
  },
});

export const getOverduePosts = internalQuery({
  args: { now: v.number() },
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
      .withIndex("by_scheduled_date")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "schedule"),
          q.lt(q.field("scheduledDate"), args.now),
          q.eq(q.field("enableNotifications"), true),
        ),
      )
      .collect();
  },
});

export const getUsersWithNotificationsEnabled = internalQuery({
  args: {},
  returns: v.array(
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
  ),
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("enableNotifications"), true))
      .collect();

    const userIds = [...new Set(posts.map((p) => p.userId))];
    const users = [];

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  },
});

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const cleanupResend = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      // These generally indicate a bug, so keep them around for longer.
      { olderThan: 4 * ONE_WEEK_MS },
    );
  },
});

export default crons;
