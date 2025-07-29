import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const getUserById = internalQuery({
  args: { id: v.id("users") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db.get(args.id);
  },
});

export const getUserPostsForReminders = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.any()),
  handler: async (ctx, args): Promise<Doc<"posts">[]> => {
    return await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

export function getPlatformName(platform: string): string {
  const names = {
    instagram: "Instagram",
    X: "X",
    youtube: "YouTube",
    telegram: "Telegram",
  };
  return names[platform as keyof typeof names] || platform;
}
