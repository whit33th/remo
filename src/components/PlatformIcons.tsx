import React from "react";
import {
  InstagramIcon as UIInstagramIcon,
  XIcon as UIXIcon,
  YouTubeIcon as UIYouTubeIcon,
  TelegramIcon as UITelegramIcon,
} from "../ui/SocialIcons";

interface IconProps {
  className?: string;
  size?: number;
}

// Реэкспорт иконок из UI для обратной совместимости
export const InstagramIcon: React.FC<IconProps> = (props) => (
  <UIInstagramIcon {...props} />
);

export const XIcon: React.FC<IconProps> = (props) => <UIXIcon {...props} />;

export const YouTubeIcon: React.FC<IconProps> = (props) => (
  <UIYouTubeIcon {...props} />
);

export const TelegramIcon: React.FC<IconProps> = (props) => (
  <UITelegramIcon {...props} />
);

export const AllPlatformsIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

interface PlatformIconProps {
  platform: "instagram" | "X" | "youtube" | "telegram" | "all";
  className?: string;
  size?: number;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  className = "",
  size = 24,
}) => {
  switch (platform) {
    case "instagram":
      return <InstagramIcon className={className} size={size} />;
    case "X":
      return <XIcon className={className} size={size} />;
    case "youtube":
      return <YouTubeIcon className={className} size={size} />;
    case "telegram":
      return <TelegramIcon className={className} size={size} />;
    case "all":
      return <AllPlatformsIcon className={className} size={size} />;
    default:
      return <AllPlatformsIcon className={className} size={size} />;
  }
};
