import { cronJobs } from "convex/server";
import { internal, components } from "./_generated/api";
import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";

const crons = cronJobs();

crons.interval(
  "check overdue notes",
  {
    hours: 24,
  },
  internal.crons.checkOverdueNotes,
  {},
);

crons.cron(
  "daily reminders",
  "0 9 * * *",
  internal.crons.sendDailyReminders,
  {},
);

crons.interval(
  "Remove old emails from the resend component",
  { hours: 1 },
  internal.crons.cleanupResend,
);

export const checkOverdueNotes = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const overdueNotes = await ctx.runQuery(internal.crons.getOverdueNotes, {
      now,
    });

    for (const note of overdueNotes) {
      const notificationId = await ctx.runMutation(
        internal.notifications.createInternalNotification,
        {
          userId: note.userId,
          noteId: note._id,
          type: "overdue",
          message: `🚨 Note "${note.title}" is overdue! Scheduled publication date: ${new Date(note.scheduledDate!).toLocaleDateString("en-US")}`,
          scheduledFor: now,
        },
      );

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
      const notificationTime = user.notificationTime || "09:00";

      await ctx.runMutation(internal.notifications.createInternalNotification, {
        userId: user._id,
        noteId: "daily" as any,
        type: "daily",
        message: "Daily reminder: check your scheduled notes and ideas",
        scheduledFor: Date.now(),
      });
    }
    return null;
  },
});

export const getOverdueNotes = internalQuery({
  args: { now: v.number() },
  returns: v.array(
    v.object({
      _id: v.id("notes"),
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
      .query("notes")
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
      notificationTime: v.optional(v.string()),
      notificationsEnabled: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("notificationsEnabled"), true))
      .collect();

    return users;
  },
});

export const getUserNotesForDailyReport = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("notes"),
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
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    return await ctx.db
      .query("notes")
      .withIndex("by_user")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.or(
            q.eq(q.field("status"), "idea"),
            q.and(
              q.eq(q.field("status"), "schedule"),
              q.gte(q.field("scheduledDate"), now),
              q.lte(q.field("scheduledDate"), oneDayFromNow),
            ),
          ),
        ),
      )
      .collect();
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
      { olderThan: 4 * ONE_WEEK_MS },
    );
  },
});

export default crons;
