"use client";

import { Calendar, Home, Plus, User } from "lucide-react";

interface BottomNavigationProps {
  currentView: "feed" | "calendar" | "create" | "profile";
  onViewChange: (view: "feed" | "calendar" | "create" | "profile") => void;
  onCreatePost: () => void;
}

export function BottomNavigation({
  currentView,
  onViewChange,
  onCreatePost,
}: BottomNavigationProps) {
  const navItems = [
    {
      id: "feed" as const,
      icon: <Home />,
      label: "Feed",
    },
    {
      id: "calendar" as const,
      icon: <Calendar />,
      label: "Calendar",
    },
    {
      id: "create" as const,
      icon: <Plus />,
      label: "Create",
    },
    {
      id: "profile" as const,
      icon: <User />,
      label: "Profile",
    },
  ];

  const handleNavClick = (id: string) => {
    onViewChange(id as "feed" | "calendar" | "create" | "profile");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-900 bg-black px-4 py-2">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center space-y-1 rounded-lg p-2 transition-colors ${
              currentView === item.id
                ? "text-blue-600"
                : "text-neutral-200 hover:text-neutral-300"
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
