import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

// Add auth routes
auth.addHttpRoutes(http);

// Webhook endpoint for handling scheduled post notifications
http.route({
  path: "/webhook/notifications",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();

      // Process notification webhook
      if (body.type === "scheduled_post_reminder") {
        await ctx.runAction(internal.notifications.sendNotificationEmail, {
          notificationId: body.notificationId,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
