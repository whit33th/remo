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
import { Doc } from "./_generated/dataModel";
import { getPlatformName } from "./shared";

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
  returns: v.array(v.any()),
  handler: async (ctx): Promise<Doc<"notifications">[]> => {
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
    const post = await ctx.runQuery(internal.posts.getPostById, {
      id: args.postId,
    });

    if (!post) {
      return null;
    }

    const user = await ctx.runQuery(internal.shared.getUserById, {
      id: post.userId,
    });

    if (!user?.email) {
      return null;
    }

    const deadlineNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: post.userId,
        postId: post._id,
        type: "deadline",
        message: `📅 Deadline approaching for post "${post.title}" on ${getPlatformName(post.platform)}`,
        scheduledFor: args.scheduledDate,
      },
    );

    await ctx.scheduler.runAt(
      args.scheduledDate,
      internal.sendEmails.sendNotificationEmail,
      {
        notificationId: deadlineNotificationId,
      },
    );

    const reminderTime =
      args.scheduledDate - args.reminderHours * 60 * 60 * 1000;
    if (reminderTime > Date.now()) {
      const reminderNotificationId = await ctx.runMutation(
        internal.notifications.createInternalNotification,
        {
          userId: post.userId,
          postId: post._id,
          type: "reminder",
          message: `⏰ Reminder: post "${post.title}" needs to be published in ${args.reminderHours} hours on ${getPlatformName(post.platform)}`,
          scheduledFor: reminderTime,
        },
      );

      await ctx.scheduler.runAt(
        reminderTime,
        internal.sendEmails.sendNotificationEmail,
        {
          notificationId: reminderNotificationId,
        },
      );
    }

    const publicationNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: post.userId,
        postId: post._id,
        type: "published",
        message: `🎉 Post "${post.title}" successfully published on ${getPlatformName(post.platform)}!`,
        scheduledFor: args.scheduledDate + 5 * 60 * 1000,
      },
    );

    await ctx.scheduler.runAt(
      args.scheduledDate + 5 * 60 * 1000,
      internal.sendEmails.sendNotificationEmail,
      {
        notificationId: publicationNotificationId,
      },
    );

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
    const user = await ctx.runQuery(internal.shared.getUserById, {
      id: args.userId,
    });

    if (!user?.email) {
      return null;
    }

    const posts = await ctx.runQuery(internal.shared.getUserPostsForReminders, {
      userId: args.userId,
    });

    if (posts.length === 0) {
      return null;
    }

    const now = new Date();
    const [hours, minutes] = args.notificationTime.split(":").map(Number);
    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const dailyNotificationId = await ctx.runMutation(
      internal.notifications.createInternalNotification,
      {
        userId: args.userId,
        postId: posts[0]._id,
        type: "daily",
        message: `📋 Daily report: You have ${posts.length} active posts in progress`,
        scheduledFor: nextReminder.getTime(),
      },
    );

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
