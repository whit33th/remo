import type { Doc, Id } from "../../convex/_generated/dataModel";

export type { Doc, Id };

export type Platform = "instagram" | "X" | "youtube" | "telegram";

export type NoteStatus = "idea" | "schedule";

export type ViewType = "feed" | "calendar" | "create" | "profile";

export type Note = Doc<"notes">;

export type Notification = Doc<"notifications">;

export interface NoteWithMediaUrls extends Note {
  mediaUrls?: (string | null)[];
}

export interface CardProps {
  note: NoteWithMediaUrls;
  onEdit: (noteId: Id<"notes">) => void;
}

export interface ContentFeedProps {
  platform: Platform | null;
  notes: NoteWithMediaUrls[];
  selectedPlatform: Platform | null;
  onEditNote: (noteId: Id<"notes"> | "new") => void;
  currentView: ViewType;
}

export interface NoteCardProps {
  note: NoteWithMediaUrls;
  onEdit: () => void;
}

export interface CalendarProps {
  notes: NoteWithMediaUrls[];
  selectedPlatform: Platform | null;
  onEditNote: (noteId: Id<"notes"> | "new") => void;
}

export interface NoteEditorProps {
  noteId: Id<"notes"> | "new";
  onClose: () => void;
}
