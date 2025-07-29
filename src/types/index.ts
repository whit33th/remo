import type { Doc, Id } from "../../convex/_generated/dataModel";

// Re-export Convex types
export type { Doc, Id };

// Platform types
export type Platform = "instagram" | "X" | "youtube" | "telegram";

// Status types
export type PostStatus = "idea" | "schedule";

// View types
export type ViewType = "feed" | "calendar" | "create" | "profile";

// Post type using Convex Doc
export type Post = Doc<"posts">;

// Notification type using Convex Doc
export type Notification = Doc<"notifications">;

// Extended Post type with computed fields
export interface PostWithMediaUrls extends Post {
  mediaUrls?: (string | null)[];
}

// Common props interfaces
export interface CardProps {
  post: PostWithMediaUrls;
  onEdit: (postId: Id<"posts">) => void;
}

export interface ContentFeedProps {
  platform: Platform | null;
  posts: PostWithMediaUrls[];
  selectedPlatform: Platform | null;
  onEditPost: (postId: Id<"posts"> | "new") => void;
  currentView: ViewType;
}

export interface PostCardProps {
  post: PostWithMediaUrls;
  onEdit: () => void;
}

export interface CalendarProps {
  posts: PostWithMediaUrls[];
  selectedPlatform: Platform | null;
  onEditPost: (postId: Id<"posts"> | "new") => void;
}

export interface PostEditorProps {
  postId: Id<"posts"> | "new";
  onClose: () => void;
}
