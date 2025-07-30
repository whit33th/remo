import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { action, internalQuery, mutation, query } from "./_generated/server";

type NoteWithMedia = Doc<"notes"> & {
  mediaUrls: (string | null)[];
  mediaTypes: string[];
};

type CreateNoteArgs = {
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

export const createNote = mutation({
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
  returns: v.id("notes"),
  handler: async (ctx, args: CreateNoteArgs): Promise<Id<"notes">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const noteId = await ctx.db.insert("notes", {
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
        internal.notifications.scheduleNoteNotifications,
        {
          noteId,
          scheduledDate: args.scheduledDate,
          reminderHours: args.reminderHours || 24,
          notificationTime: args.notificationTime || "09:00",
        },
      );
    }

    return noteId;
  },
});

export const updateNote = mutation({
  args: {
    id: v.id("notes"),
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
    const note = await ctx.db.get(id);

    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
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
      const updatedNote = await ctx.db.get(id);
      if (
        updatedNote?.enableNotifications &&
        updatedNote.status === "schedule" &&
        updatedNote.scheduledDate
      ) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.scheduleNoteNotifications,
          {
            noteId: id,
            scheduledDate: updatedNote.scheduledDate,
            reminderHours: updatedNote.reminderHours || 24,
            notificationTime: updatedNote.notificationTime || "09:00",
          },
        );
      }
    }
    return null;
  },
});

export const deleteNote = mutation({
  args: {
    id: v.id("notes"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.id);
    if (!note) {
      throw new Error("Note not found");
    }

    if (note.userId !== userId) {
      throw new Error("Not authorized to delete this note");
    }

    if (note.mediaIds && note.mediaIds.length > 0) {
      for (const mediaId of note.mediaIds) {
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

export const getUserNotes = query({
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
  handler: async (ctx, args): Promise<NoteWithMedia[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.platform) {
      query = ctx.db
        .query("notes")
        .withIndex("by_user_and_platform", (q) =>
          q.eq("userId", userId).eq("platform", args.platform!),
        );
    }

    if (args.status) {
      query = ctx.db
        .query("notes")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!),
        );
    }

    const notes = await query.collect();

    return Promise.all(
      notes.map(async (note): Promise<NoteWithMedia> => {
        const mediaInfo = await ctx.runQuery(internal.notes.processMediaInfo, {
          mediaIds: note.mediaIds,
        });
        return {
          ...note,
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

export const publishNote = action({
  args: {
    noteId: v.id("notes"),
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

    const note = await ctx.runQuery(api.notes.getNote, {
      noteId: args.noteId,
    });
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.runMutation(api.notes.updateNoteStatus, {
      noteId: args.noteId,
      status: "schedule",
      publishedAt: Date.now(),
    });

    return { success: true, message: `Note scheduled for ${args.platform}` };
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

export const getNote = query({
  args: { noteId: v.id("notes") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<NoteWithMedia | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      return null;
    }

    const mediaInfo: { mediaUrls: (string | null)[]; mediaTypes: string[] } =
      await ctx.runQuery(internal.notes.processMediaInfo, {
        mediaIds: note.mediaIds,
      });

    return {
      ...note,
      ...mediaInfo,
    } as NoteWithMedia;
  },
});

export const updateNoteStatus = mutation({
  args: {
    noteId: v.id("notes"),
    status: v.union(v.literal("idea"), v.literal("schedule")),
    publishedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { noteId, ...updates } = args;
    await ctx.db.patch(noteId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const shareNote = action({
  args: {
    email: v.string(),
    noteId: v.id("notes"),
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
      noteId: args.noteId,
      userEmail,
    });

    console.log("Shared note email sent successfully");
    return { success: true };
  },
});

export const getNoteById = internalQuery({
  args: { id: v.id("notes") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<Doc<"notes"> | null> => {
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
        try {
          const url = await ctx.storage.getUrl(mediaId);
          const metadata = await ctx.db.system.get(mediaId);
          return {
            url: url || null,
            contentType: metadata?.contentType || "image/jpeg",
          };
        } catch (error) {
          console.error(`Error processing media ${mediaId}:`, error);
          return {
            url: null,
            contentType: "image/jpeg",
          };
        }
      }),
    );

    return {
      mediaUrls: mediaInfo.map((info) => info.url),
      mediaTypes: mediaInfo.map((info) => info.contentType),
    };
  },
});

export const migrateNotifications = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Get all notifications
    const notifications = await ctx.db.query("notifications").collect();

    let migratedCount = 0;

    for (const notification of notifications) {
      // Check if this notification has postId field (old format) but no noteId
      if ((notification as any).postId && !(notification as any).noteId) {
        try {
          // Create a new notification with the correct schema
          const newNotification = {
            userId: notification.userId,
            noteId: (notification as any).postId,
            type: notification.type,
            message: notification.message,
            sent: notification.sent,
            scheduledFor: notification.scheduledFor,
          };

          // Insert the new notification
          await ctx.db.insert("notifications", newNotification);

          // Delete the old notification
          await ctx.db.delete(notification._id);

          migratedCount++;
          console.log(`Migrated notification ${notification._id}`);
        } catch (error) {
          console.error(
            `Failed to migrate notification ${notification._id}:`,
            error,
          );
        }
      }
    }

    return migratedCount;
  },
});

export const cleanupOldNotificationFields = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Get all notifications that still have postId field
    const notifications = await ctx.db.query("notifications").collect();

    let cleanedCount = 0;

    for (const notification of notifications) {
      // Check if this notification still has postId field
      if ((notification as any).postId) {
        try {
          // Since we can't remove fields in Convex, we'll just count them
          // The migration function should have already handled the conversion
          console.log(
            `Found notification with old postId field: ${notification._id}`,
          );
          cleanedCount++;
        } catch (error) {
          console.error(
            `Failed to process notification ${notification._id}:`,
            error,
          );
        }
      }
    }

    return cleanedCount;
  },
});
