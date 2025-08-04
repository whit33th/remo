"use client";

import { ViewType } from "@/types";
import { Calendar, Home, Plus, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface BottomNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function BottomNavigation({
  currentView,
  onViewChange,
}: BottomNavigationProps) {
  const navItems = [
    {
      id: "feed" as ViewType,
      icon: <Home />,
      label: "Feed",
    },
    {
      id: "calendar" as ViewType,
      icon: <Calendar />,
      label: "Calendar",
    },
    {
      id: "create" as ViewType,
      icon: <Plus />,
      label: "New Note",
    },
    {
      id: "profile" as ViewType,
      icon: <User />,
      label: "Profile",
    },
  ];
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (id: ViewType) => {
    if (pathname !== "/") {
      router.push("/");
    }
    onViewChange(id);
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
