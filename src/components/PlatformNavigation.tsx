import { SocialIcon } from "../ui/SocialIcons";

interface PlatformNavigationProps {
  selectedPlatform: "instagram" | "X" | "youtube" | "telegram" | null;
  onPlatformSelect: (
    platform: "instagram" | "X" | "youtube" | "telegram" | null,
  ) => void;
}

export function PlatformNavigation({
  selectedPlatform,
  onPlatformSelect,
}: PlatformNavigationProps) {
  const platforms = [
    {
      id: "instagram" as const,
      name: "Instagram",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "X" as const,
      name: "X",
      color: "from-blue-400 to-blue-600",
    },
    {
      id: "youtube" as const,
      name: "YouTube",
      color: "from-red-500 to-red-600",
    },
    {
      id: "telegram" as const,
      name: "Telegram",
      color: "from-cyan-400 to-cyan-600",
    },
  ];

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-200">
        Platforms
      </h3>
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={() => onPlatformSelect(null)}
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
            selectedPlatform === null
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          🌐
        </button>
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onPlatformSelect(platform.id)}
            className={`h-12 w-12 rounded-full bg-gradient-to-r ${platform.color} flex items-center justify-center text-lg text-white transition-all ${
              selectedPlatform === platform.id
                ? "scale-110 ring-4 ring-blue-200"
                : "hover:scale-105"
            }`}
            title={platform.name}
          >
            <SocialIcon platform={platform.id} size={20} />
          </button>
        ))}
      </div>
      {selectedPlatform && (
        <div className="mb-4 text-sm text-gray-600">
          Focus: {platforms.find((p) => p.id === selectedPlatform)?.name}
        </div>
      )}
    </div>
  );
}
