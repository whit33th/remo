import { components, internal } from "./_generated/api";
import { Resend, EmailId } from "@convex-dev/resend";
import {
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { getPlatformName } from "./shared";
import { Doc } from "./_generated/dataModel";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

export const handleEmailEvent = resend.defineOnEmailEvent(async (ctx, args) => {
  if (args.event.type === "email.delivered") {
  } else if (args.event.type === "email.bounced") {
  } else if (args.event.type === "email.complained") {
  }
});

export const sendNotificationEmail = internalAction({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.runQuery(
      internal.sendEmails.getNotificationById,
      {
        id: args.notificationId,
      },
    );

    if (!notification || notification.sent) {
      return null;
    }

    const user = await ctx.runQuery(internal.shared.getUserById, {
      id: notification.userId,
    });

    if (!user?.email) {
      return null;
    }

    // Skip note lookup if noteId is undefined (for daily reminders)
    let note;
    let mediaUrls: string[] = [];

    if (notification.noteId) {
      note = await ctx.runQuery(internal.notes.getNoteById, {
        id: notification.noteId,
      });

      if (note && note.mediaIds.length > 0) {
        mediaUrls = await ctx.runQuery(internal.notes.getMediaUrls, {
          mediaIds: note.mediaIds,
        });
      }
    }

    try {
      await resend.sendEmail(ctx, {
        from: "Content Creator Assistant <notifications@resend.dev>",
        to: user.email,
        subject: getEmailSubject(notification.type),
        html: getEmailContent(notification, note, mediaUrls),
      });

      await ctx.runMutation(internal.sendEmails.markNotificationSent, {
        id: args.notificationId,
      });
    } catch (error) {}
    return null;
  },
});

export const sendDailyReminder = internalAction({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.shared.getUserById, {
      id: args.userId,
    });

    if (!user?.email) {
      return null;
    }

    const notes = await ctx.runQuery(internal.shared.getUserNotesForReminders, {
      userId: args.userId,
    });

    if (notes.length === 0) {
      return null;
    }

    try {
      await resend.sendEmail(ctx, {
        from: "Content Creator Assistant <notifications@resend.dev>",
        to: user.email,
        subject: "Daily Content Report",
        html: getDailyReminderContent(notes),
      });

      await ctx.runMutation(internal.sendEmails.markNotificationSent, {
        id: args.notificationId,
      });
    } catch (error) {}

    return null;
  },
});

export const sendShareEmail = internalAction({
  args: {
    email: v.string(),
    noteId: v.id("notes"),
    userEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const noteData = await ctx.runQuery(internal.notes.getNoteById, {
      id: args.noteId,
    });

    if (!noteData) {
      throw new Error("Note not found");
    }

    let mediaUrls: string[] = [];
    if (noteData.mediaIds && noteData.mediaIds.length > 0) {
      mediaUrls = await ctx.runQuery(internal.notes.getMediaUrls, {
        mediaIds: noteData.mediaIds,
      });
    }

    const html = createShareEmailContent(noteData, args.userEmail, mediaUrls);

    try {
      await resend.sendEmail(ctx, {
        from: "Content Creator Assistant <notifications@resend.dev>",
        to: args.email,
        subject: `Shared Note: ${noteData.title || "Content"}`,
        html,
      });
    } catch (error) {
      throw error;
    }

    return null;
  },
});

export const getNotificationById = internalQuery({
  args: { id: v.id("notifications") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<Doc<"notifications"> | null> => {
    return await ctx.db.get(args.id);
  },
});

export const markNotificationSent = internalMutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { sent: true });
    return null;
  },
});

function getPlatformColor(platform: string): string {
  const colors = {
    instagram: "from-purple-500 to-pink-500",
    X: "from-blue-400 to-blue-600",
    youtube: "from-red-500 to-red-600",
    telegram: "from-cyan-400 to-cyan-600",
  };
  return colors[platform as keyof typeof colors] || "from-gray-500 to-gray-600";
}

function getStatusInfo(status: string) {
  if (status === "idea") {
    return {
      text: "Idea",
      color: "bg-yellow-100 text-yellow-800",
      icon: "",
    };
  }
  return {
    text: "Schedule",
    color: "bg-green-100 text-green-800",
    icon: "",
  };
}

function getEmailSubject(type: string): string {
  switch (type) {
    case "deadline":
      return "Deadline approaching";
    case "reminder":
      return "Content publication reminder";
    case "overdue":
      return "Overdue content";
    case "published":
      return "Content published!";
    case "daily":
      return "Daily content report";
    default:
      return "Content Creator Notification";
  }
}

function getEmailContent(
  notification: any,
  note?: any,
  mediaUrls: string[] = [],
): string {
  const baseStyle = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      <div style="background-color: #000000; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px; border: 1px solid #333;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Content Creator Assistant</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your content management assistant</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
        <p style="color: #999; font-size: 14px; margin: 0;">
          This is an automatic notification from Content Creator Assistant
        </p>
        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
          You received this email because you enabled notifications for your notes
        </p>
      </div>
    </div>
  `;

  let content = "";

  if (note) {
    const platformColor = getPlatformColor(note.platform);
    const statusInfo = getStatusInfo(note.status);

    content = `
      <div style="background: #000000; border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            
              <div style="font-weight: 600; color: #ffffff; font-size: 16px;">${note.title || "No title"}</div>
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 16px;">
          <div style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="display: inline-flex; align-items: center; gap: 4px; border-radius: 9999px; padding: 4px 10px; font-size: 12px; font-weight: 500; ${statusInfo.color}">
              ${statusInfo.icon} ${statusInfo.text}
            </span>
          </div>

          ${
            note.content
              ? `
            <p style="margin-bottom: 12px; line-height: 1.6; color: #ffffff; font-size: 14px;">
              ${note.content.substring(0, 200)}${note.content.length > 200 ? "..." : ""}
            </p>
          `
              : ""
          }

          ${
            note.hashtags && note.hashtags.length > 0
              ? `
            <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${note.hashtags
                .slice(0, 3)
                .map(
                  (tag: string) => `
                <span style="font-size: 12px; color: #999999;">#${tag}</span>
              `,
                )
                .join("")}
              ${
                note.hashtags.length > 3
                  ? `
                <span style="font-size: 12px; color: #666666;">+${note.hashtags.length - 3} more</span>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            mediaUrls && mediaUrls.length > 0
              ? `
            <div style="margin-bottom: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
              ${mediaUrls
                .slice(0, 4)
                .map(
                  (url: string) => `
                <img src="${url}" alt="Note media" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #333;" />
              `,
                )
                .join("")}
              ${
                mediaUrls.length > 4
                  ? `
                <div style="display: flex; align-items: center; justify-content: center; background: #1a1a1a; border-radius: 8px; border: 1px solid #333; color: #999; font-size: 12px;">
                  +${mediaUrls.length - 4} more
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; gap: 8px;">
            ${
              note.scheduledDate
                ? `
              <span style="font-size: 12px; color: #999999;">
                ${new Date(note.scheduledDate).toLocaleDateString("en-US")}
              </span>
            `
                : ""
            }
            <div style="display: flex; align-items: center; gap: 4px; color: #cccccc;">
              <span style="font-size: 12px;">${getPlatformName(note.platform)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return (
    baseStyle +
    `
    <div style="background: #000000; padding: 20px; border-radius: 10px; border: 1px solid #333;">
      <p style="font-size: 18px; color: #ffffff; margin: 0 0 20px 0; font-weight: 500;">${notification.message}</p>
      ${content}
    </div>
  ` +
    footerStyle
  );
}

function getDailyReminderContent(notes: any[]): string {
  const baseStyle = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      <div style="background-color: #000000; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px; border: 1px solid #333;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Daily Report</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your content plan for today</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
        <p style="color: #999; font-size: 14px; margin: 0;">
          Have a great day and productive work!
        </p>
      </div>
    </div>
  `;

  const scheduledNotes = notes.filter((n) => n.status === "schedule");
  const ideaNotes = notes.filter((n) => n.status === "idea");

  let content = `
    <div style="background: #000000; padding: 20px; border-radius: 10px; border: 1px solid #333;">
      <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Content Summary</h2>
      
      <div style="display: grid; gap: 12px; margin-bottom: 24px;">
        <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; border-left: 4px solid #4caf50;">
          <h4 style="margin: 0 0 4px 0; color: #4caf50; font-size: 14px; font-weight: 600;">Scheduled: ${scheduledNotes.length}</h4>
        </div>

        <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; border-left: 4px solid #9c27b0;">
          <h4 style="margin: 0 0 4px 0; color: #9c27b0; font-size: 14px; font-weight: 600;">Ideas: ${ideaNotes.length}</h4>
        </div>
      </div>
  `;

  if (scheduledNotes.length > 0) {
    content += `
      <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Today's publications:</h3>
      <div style="margin-bottom: 16px;">
    `;

    const today = new Date();
    const todaysNotes = scheduledNotes.filter((note) => {
      if (!note.scheduledDate) return false;
      const noteDate = new Date(note.scheduledDate);
      return noteDate.toDateString() === today.toDateString();
    });

    if (todaysNotes.length > 0) {
      todaysNotes.forEach((note) => {
        const platformColor = getPlatformColor(note.platform);
        const statusInfo = getStatusInfo(note.status);

        content += `
          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 12px;">
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                
                  <div style="font-weight: 600; color: #ffffff; font-size: 14px;">${note.title || "No title"}</div>
              </div>
            </div>

            <!-- Content -->
            <div style="padding: 12px;">
              <div style="margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: inline-flex; align-items: center; gap: 3px; border-radius: 9999px; padding: 3px 8px; font-size: 11px; font-weight: 500; ${statusInfo.color}">
                  ${statusInfo.icon} ${statusInfo.text}
                </span>
              </div>

              ${
                note.content
                  ? `
                <p style="margin-bottom: 8px; line-height: 1.5; color: #cccccc; font-size: 12px;">
                  ${note.content.substring(0, 80)}...
                </p>
              `
                  : ""
              }

              <!-- Footer -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px;">
                <span style="font-size: 11px; color: #999999;">
                   ${new Date(note.scheduledDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div style="display: flex; align-items: center; gap: 3px; color: #cccccc;">
                  <span style="font-size: 11px;">${getPlatformName(note.platform)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      content += `<p style="color: #999999; font-style: italic; font-size: 14px;">No publications scheduled for today</p>`;
    }

    content += `</div>`;
  }

  content += `</div>`;

  return baseStyle + content + footerStyle;
}

export function createShareEmailContent(
  noteData: any,
  userEmail: string,
  mediaUrls: string[] = [],
): string {
  const baseStyle = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      <div style="background-color: #000000; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px; border: 1px solid #333;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Content Creator Assistant</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">@${userEmail} shared this with you</p>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">What do you think about this?</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
        <p style="color: #999; font-size: 14px; margin: 0;">
          This is an automatic notification from Content Creator Assistant
        </p>
        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
          You received this email because you enabled notifications for your notes
        </p>
      </div>
    </div>
  `;

  let content = "";

  if (noteData) {
    const statusInfo = getStatusInfo(noteData.status);

    content = `
      <div style="background: #000000; border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            
            <div>
              <div style="font-weight: 600; color: #ffffff; font-size: 16px;">${noteData.title || "No title"}</div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 16px;">
          <div style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="display: inline-flex; align-items: center; gap: 4px; border-radius: 9999px; padding: 4px 10px; font-size: 12px; font-weight: 500; ${statusInfo.color}">
              ${statusInfo.icon} ${statusInfo.text}
            </span>
          </div>

          ${
            noteData.content
              ? `
            <p style="margin-bottom: 12px; line-height: 1.6; color: #ffffff; font-size: 14px;">
              ${noteData.content.substring(0, 200)}${noteData.content.length > 200 ? "..." : ""}
            </p>
          `
              : ""
          }

          ${
            noteData.hashtags && noteData.hashtags.length > 0
              ? `
            <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${noteData.hashtags
                .slice(0, 3)
                .map(
                  (tag: string) => `
                <span style="font-size: 12px; color: #999999;">#${tag}</span>
              `,
                )
                .join("")}
              ${
                noteData.hashtags.length > 3
                  ? `
                <span style="font-size: 12px; color: #666666;">+${noteData.hashtags.length - 3} more</span>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            noteData.mentions && noteData.mentions.length > 0
              ? `
            <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${noteData.mentions
                .slice(0, 3)
                .map(
                  (mention: string) => `
                <span style="font-size: 12px; color: #4a9eff;">@${mention}</span>
              `,
                )
                .join("")}
              ${
                noteData.mentions.length > 3
                  ? `
                <span style="font-size: 12px; color: #666666;">+${noteData.mentions.length - 3} more</span>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            noteData.links && noteData.links.length > 0
              ? `
            <div style="margin-bottom: 8px;">
              ${noteData.links
                .slice(0, 2)
                .map(
                  (link: string) => `
                <a href="${link}" style="font-size: 12px; color: #4a9eff; text-decoration: none; word-break: break-all; display: block; margin-bottom: 2px;">${link}</a>
              `,
                )
                .join("")}
              ${
                noteData.links.length > 2
                  ? `
                <span style="font-size: 12px; color: #666666;">+${noteData.links.length - 2} more links</span>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            mediaUrls && mediaUrls.length > 0
              ? `
            <div style="margin-bottom: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
              ${mediaUrls
                .slice(0, 4)
                .map(
                  (url: string) => `
                <img src="${url}" alt="Note media" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #333;" />
              `,
                )
                .join("")}
              ${
                mediaUrls.length > 4
                  ? `
                <div style="display: flex; align-items: center; justify-content: center; background: #1a1a1a; border-radius: 8px; border: 1px solid #333; color: #999; font-size: 12px;">
                  +${mediaUrls.length - 4} more
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; gap: 8px;">
            ${
              noteData.scheduledDate
                ? `
              <span style="font-size: 12px; color: #999999;">
                ${new Date(noteData.scheduledDate).toLocaleDateString("en-US")}
              </span>
            `
                : ""
            }
            <div style="display: flex; align-items: center; gap: 4px; color: #cccccc;">
              <span style="font-size: 12px;">${getPlatformName(noteData.platform)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return (
    baseStyle +
    `
    <div style="background: #000000; padding: 20px; border-radius: 10px; border: 1px solid #333;">
      <p style="font-size: 18px; color: #ffffff; margin: 0 0 20px 0; font-weight: 500;">Idea shared with you:</p>
      ${content}
    </div>
  ` +
    footerStyle
  );
}
