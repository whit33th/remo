import {
  Calendar,
  Camera,
  Lightbulb,
  LucideIcon,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import type { Platform } from "../types";

// Platform colors for gradients
export const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "from-purple-500 to-pink-500",
  X: "from-blue-400 to-blue-600",
  youtube: "from-red-500 to-red-600",
  telegram: "from-cyan-400 to-cyan-600",
};

// Platform icons - теперь используются SVG иконки из lucide-react
export const PLATFORM_ICONS: Record<Platform, LucideIcon> = {
  instagram: Camera,
  X: Twitter,
  youtube: Youtube,
  telegram: Send,
};

// Status configurations
export const STATUS_CONFIG = {
  idea: {
    text: "Idea",
    color: "bg-yellow-100 text-yellow-800",
    icon: Lightbulb,
  },
  schedule: {
    text: "Schedule",
    color: "bg-green-100 text-green-800",
    icon: Calendar,
  },
} as const;

// Platform-specific field requirements
export const PLATFORM_FIELDS = {
  instagram: {
    contentLimit: 2200,
    hashtagLimit: 30,
    mediaLimit: 10,
    required: ["content"],
  },
  X: {
    contentLimit: 280,
    hashtagLimit: 10,
    mediaLimit: 4,
    required: ["content"],
  },
  youtube: {
    contentLimit: 5000,
    hashtagLimit: 15,
    mediaLimit: 1,
    required: ["title", "content"],
  },
  telegram: {
    contentLimit: 4096,
    hashtagLimit: 20,
    mediaLimit: 10,
    required: ["content"],
  },
} as const;

// Grid layouts for different platforms
export const GRID_LAYOUTS = {
  instagram: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  youtube: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  X: "space-y-4",
  telegram: "space-y-3 mx-auto",
} as const;
