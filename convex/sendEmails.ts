import { components, internal } from "./_generated/api";
import { Resend, EmailId } from "@convex-dev/resend";
import {
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

// Обработчик событий email
export const handleEmailEvent = resend.defineOnEmailEvent(async (ctx, args) => {
  if (args.event.type === "email.delivered") {
    // Email delivered successfully
  } else if (args.event.type === "email.bounced") {
    // Email bounced
  } else if (args.event.type === "email.complained") {
    // Email complained
  }
});

// Функция для отправки уведомлений о постах
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

    const user = await ctx.runQuery(internal.sendEmails.getUserById, {
      id: notification.userId,
    });

    if (!user?.email) {
      return null;
    }

    const post = await ctx.runQuery(internal.sendEmails.getPostById, {
      id: notification.postId,
    });

    try {
      await resend.sendEmail(ctx, {
        from: "Content Creator Assistant <notifications@notification.whit33th.com>",
        to: user.email,
        subject: getEmailSubject(notification.type),
        html: getEmailContent(notification, post),
      });

      await ctx.runMutation(internal.sendEmails.markNotificationSent, {
        id: args.notificationId,
      });
    } catch (error) {
      // Failed to send notification email
    }
    return null;
  },
});

// Функция для отправки ежедневных напоминаний
export const sendDailyReminder = internalAction({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.sendEmails.getUserById, {
      id: args.userId,
    });

    if (!user?.email) {
      return null;
    }

    const posts = await ctx.runQuery(
      internal.sendEmails.getUserPostsForReminders,
      {
        userId: args.userId,
      },
    );

    if (posts.length === 0) {
      return null;
    }

    try {
      await resend.sendEmail(ctx, {
        from: "Content Creator Assistant <notifications@notification.whit33th.com>",
        to: user.email,
        subject: "📋 Ежедневный отчет по контенту",
        html: getDailyReminderContent(posts),
      });

      await ctx.runMutation(internal.sendEmails.markNotificationSent, {
        id: args.notificationId,
      });
    } catch (error) {
      // Failed to send daily reminder
    }

    return null;
  },
});

export const sendShareEmail = internalAction({
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
    userEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const html = createShareEmailContent(args.postData, args.userEmail);

    try {
      await resend.sendEmail(ctx, {
        from: "Content Creator Assistant <notifications@notification.whit33th.com>",
        to: args.email,
        subject: `Shared Post: ${args.postData.title || "Content"}`,
        html,
      });
    } catch (error) {
      throw error;
    }

    return null;
  },
});

// Функция для проверки статуса письма
export const checkEmailStatus = internalAction({
  args: { emailId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      const emailId = args.emailId as EmailId;
      const status = await resend.status(ctx, emailId);
      return status;
    } catch (error) {
      throw error;
    }
  },
});

// Вспомогательные функции для получения данных
export const getNotificationById = internalQuery({
  args: { id: v.id("notifications") },
  returns: v.union(
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

export const markNotificationSent = internalMutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { sent: true });
    return null;
  },
});

// Функции для генерации HTML контента email (стиль как в приложении - черный дизайн)
function getPlatformName(platform: string): string {
  const names = {
    instagram: "Instagram",
    X: "X",
    youtube: "YouTube",
    telegram: "Telegram",
  };
  return names[platform as keyof typeof names] || platform;
}

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
      icon: "💡",
    };
  }
  return {
    text: "Schedule",
    color: "bg-green-100 text-green-800",
    icon: "📅",
  };
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Content Creator Assistant</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Ваш помощник по управлению контентом</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
        <p style="color: #999; font-size: 14px; margin: 0;">
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
    const platformColor = getPlatformColor(post.platform);
    const statusInfo = getStatusInfo(post.status);

    content = `
      <div style="background: #000000; border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ${platformColor}); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              ${getPlatformName(post.platform).charAt(0)}
            </div>
            <div>
              <div style="font-weight: 600; color: #ffffff; font-size: 16px;">${post.title || "No title"}</div>
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
            post.content
              ? `
            <p style="margin-bottom: 12px; line-height: 1.6; color: #ffffff; font-size: 14px;">
              ${post.content.substring(0, 200)}${post.content.length > 200 ? "..." : ""}
            </p>
          `
              : ""
          }

          ${
            post.hashtags && post.hashtags.length > 0
              ? `
            <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${post.hashtags
                .slice(0, 3)
                .map(
                  (tag: string) => `
                <span style="font-size: 12px; color: #999999;">#${tag}</span>
              `,
                )
                .join("")}
              ${
                post.hashtags.length > 3
                  ? `
                <span style="font-size: 12px; color: #666666;">+${post.hashtags.length - 3} more</span>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
            ${
              post.scheduledDate
                ? `
              <span style="font-size: 12px; color: #999999;">
                ${new Date(post.scheduledDate).toLocaleDateString("ru-RU")}
              </span>
            `
                : ""
            }
            <div style="display: flex; align-items: center; gap: 4px; color: #cccccc;">
              <span style="font-size: 12px;">${getPlatformName(post.platform)}</span>
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

function getDailyReminderContent(posts: any[]): string {
  const baseStyle = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">📋 Ежедневный отчет</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Ваш контент-план на сегодня</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
        <p style="color: #999; font-size: 14px; margin: 0;">
          Удачного дня и продуктивной работы! 🚀
        </p>
      </div>
    </div>
  `;

  const scheduledPosts = posts.filter((p) => p.status === "schedule");
  const ideaPosts = posts.filter((p) => p.status === "idea");

  let content = `
    <div style="background: #000000; padding: 20px; border-radius: 10px; border: 1px solid #333;">
      <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Сводка по контенту</h2>
      
      <div style="display: grid; gap: 12px; margin-bottom: 24px;">
        <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; border-left: 4px solid #4caf50;">
          <h4 style="margin: 0 0 4px 0; color: #4caf50; font-size: 14px; font-weight: 600;">⏰ Запланировано: ${scheduledPosts.length}</h4>
        </div>

        <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; border-left: 4px solid #9c27b0;">
          <h4 style="margin: 0 0 4px 0; color: #9c27b0; font-size: 14px; font-weight: 600;">💡 Идей: ${ideaPosts.length}</h4>
        </div>
      </div>
  `;

  if (scheduledPosts.length > 0) {
    content += `
      <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Сегодня к публикации:</h3>
      <div style="margin-bottom: 16px;">
    `;

    const today = new Date();
    const todaysPosts = scheduledPosts.filter((post) => {
      if (!post.scheduledDate) return false;
      const postDate = new Date(post.scheduledDate);
      return postDate.toDateString() === today.toDateString();
    });

    if (todaysPosts.length > 0) {
      todaysPosts.forEach((post) => {
        const platformColor = getPlatformColor(post.platform);
        const statusInfo = getStatusInfo(post.status);

        content += `
          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 12px;">
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${platformColor}); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                  ${getPlatformName(post.platform).charAt(0)}
                </div>
                <div>
                  <div style="font-weight: 600; color: #ffffff; font-size: 14px;">${post.title || "No title"}</div>
                </div>
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
                post.content
                  ? `
                <p style="margin-bottom: 8px; line-height: 1.5; color: #cccccc; font-size: 12px;">
                  ${post.content.substring(0, 80)}...
                </p>
              `
                  : ""
              }

              <!-- Footer -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px;">
                <span style="font-size: 11px; color: #999999;">
                  🕐 ${new Date(post.scheduledDate).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div style="display: flex; align-items: center; gap: 3px; color: #cccccc;">
                  <span style="font-size: 11px;">${getPlatformName(post.platform)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      content += `<p style="color: #999999; font-style: italic; font-size: 14px;">На сегодня публикаций не запланировано</p>`;
    }

    content += `</div>`;
  }

  content += `</div>`;

  return baseStyle + content + footerStyle;
}

export function createShareEmailContent(
  postData: any,
  userEmail: string,
): string {
  const baseStyle = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Content Creator Assistant</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Ваш помощник по управлению контентом</p>
      </div>
  `;

  const footerStyle = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
        <p style="color: #999; font-size: 14px; margin: 0;">
          Это автоматическое уведомление от Content Creator Assistant
        </p>
        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
          Вы получили это письмо, потому что включили уведомления для своих постов
        </p>
      </div>
    </div>
  `;

  let content = "";

  if (postData) {
    const platformColor = getPlatformColor(postData.platform);
    const statusInfo = getStatusInfo(postData.status);

    content = `
      <div style="background: #000000; border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ${platformColor}); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              ${getPlatformName(postData.platform).charAt(0)}
            </div>
            <div>
              <div style="font-weight: 600; color: #ffffff; font-size: 16px;">${postData.title || "No title"}</div>
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
            postData.content
              ? `
            <p style="margin-bottom: 12px; line-height: 1.6; color: #ffffff; font-size: 14px;">
              ${postData.content.substring(0, 200)}${postData.content.length > 200 ? "..." : ""}
            </p>
          `
              : ""
          }

          ${
            postData.hashtags && postData.hashtags.length > 0
              ? `
            <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${postData.hashtags
                .slice(0, 3)
                .map(
                  (tag: string) => `
                <span style="font-size: 12px; color: #999999;">#${tag}</span>
              `,
                )
                .join("")}
              ${
                postData.hashtags.length > 3
                  ? `
                <span style="font-size: 12px; color: #666666;">+${postData.hashtags.length - 3} more</span>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
            ${
              postData.scheduledDate
                ? `
              <span style="font-size: 12px; color: #999999;">
                ${new Date(postData.scheduledDate).toLocaleDateString("ru-RU")}
              </span>
            `
                : ""
            }
            <div style="display: flex; align-items: center; gap: 4px; color: #cccccc;">
              <span style="font-size: 12px;">${getPlatformName(postData.platform)}</span>
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
      <p style="font-size: 18px; color: #ffffff; margin: 0 0 20px 0; font-weight: 500;">Пост поделен с вами</p>
      ${content}
    </div>
  ` +
    footerStyle
  );
}
