import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
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

export const checkOverduePosts = internalAction({
  args: {},
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

      // Send email notification
      await ctx.runAction(internal.notifications.sendNotificationEmail, {
        notificationId,
      });
    }
  },
});

export const sendDailyReminders = internalAction({
  args: {},
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
  },
});

export const getOverduePosts = internalQuery({
  args: { now: v.number() },
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

export default crons;
