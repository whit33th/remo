import type { Doc, Id } from "../../convex/_generated/dataModel";

export type { Doc, Id };

export type Platform = "instagram" | "X" | "youtube" | "telegram";

export type PostStatus = "idea" | "schedule";

export type ViewType = "feed" | "calendar" | "create" | "profile";

export type Post = Doc<"posts">;

export type Notification = Doc<"notifications">;

export interface PostWithMediaUrls extends Post {
  mediaUrls?: (string | null)[];
}

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
