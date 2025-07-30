import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    notificationTime: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
  }).index("by_email", ["email"]),
  notes: defineTable({
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
  })
    .index("by_user", ["userId"])
    .index("by_user_and_platform", ["userId", "platform"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_scheduled_date", ["scheduledDate"]),

  notifications: defineTable({
    userId: v.id("users"),
    noteId: v.id("notes"),
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
  })
    .index("by_user", ["userId"])
    .index("by_note", ["noteId"])
    .index("by_scheduled", ["scheduledFor", "sent"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
