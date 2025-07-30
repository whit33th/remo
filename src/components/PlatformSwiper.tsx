"use client";

import { Check } from "lucide-react";
import { PlatformIcon } from "./PlatformIcons";

interface PlatformSwiperProps {
  selectedPlatform: "instagram" | "X" | "youtube" | "telegram" | null;
  onPlatformSelect: (
    platform: "instagram" | "X" | "youtube" | "telegram" | null,
  ) => void;
}

export function PlatformSwiper({
  selectedPlatform,
  onPlatformSelect,
}: PlatformSwiperProps) {
  const platforms = [
    {
      id: null,
      name: "All",
      color: "bg-gray-100",
      textColor: "text-neutral-300",
    },
    {
      id: "instagram" as const,
      name: "Instagram",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      textColor: "text-white",
    },
    {
      id: "X" as const,
      name: "X",
      color: "bg-gradient-to-r from-blue-400 to-blue-600",
      textColor: "text-white",
    },
    {
      id: "youtube" as const,
      name: "YouTube",
      color: "bg-gradient-to-r from-red-500 to-red-600",
      textColor: "text-white",
    },
    {
      id: "telegram" as const,
      name: "Telegram",
      color: "bg-gradient-to-r from-cyan-400 to-cyan-600",
      textColor: "text-white",
    },
  ];

  return (
    <div className="scrollbar-hide flex space-x-3 overflow-x-auto px-3 lg:px-0">
      {platforms.map((platform) => (
        <button
          key={platform.id || "all"}
          onClick={() => onPlatformSelect(platform.id)}
          className={`flex flex-shrink-0 flex-col items-center space-y-1 rounded-xl p-3 transition-all ${
            selectedPlatform === platform.id
              ? "scale-105 bg-neutral-950"
              : "scale-100"
          }`}
        >
          <div
            className={`h-16 w-16 rounded-full ${platform.color} relative flex items-center justify-center ${platform.textColor} shadow-lg`}
          >
            <PlatformIcon
              platform={platform.id === null ? "all" : platform.id}
              size={28}
              className={`text-current transition-transform ${
                selectedPlatform === platform.id ? "scale-105" : "scale-100"
              }`}
            />
          </div>
          <span className="text-xs font-medium text-neutral-300">
            {platform.name}
          </span>
        </button>
      ))}
    </div>
  );
}
