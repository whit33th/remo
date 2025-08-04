"use client";

import { BottomNavigation } from "@/components/containerts/BottomNavigation";
import { Calendar } from "@/components/containerts/Calendar";
import { Header } from "@/components/containerts/Header";
import { MainFeed } from "@/components/containerts/MainFeed";
import { NoteEditor } from "@/components/containerts/NoteEditor";
import { Profile } from "@/components/containerts/Profile";
import { api } from "@/convex/_generated/api";
import { Platform, ViewType } from "@/types";
import { useQuery } from "convex-helpers/react/cache";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const user = useQuery(api.auth.loggedInUser);
  const router = useRouter();
  const pathname = usePathname();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );

  const [currentView, setCurrentView] = useState<ViewType>("feed");

  const isNotePage = pathname.includes("/note/");

  const notes = useQuery(api.notes.getUserNotes, {
    platform: selectedPlatform || undefined,
  });

  const handleViewNote = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handlePlatformChange = (platform: Platform | null) => {
    setSelectedPlatform(platform);
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header user={user} />
      <main className={"pb-20"}>
        {isNotePage ? (
          children
        ) : (
          <>
            {currentView === "feed" && (
              <MainFeed
                selectedPlatform={selectedPlatform}
                onPlatformChange={handlePlatformChange}
              />
            )}

            {currentView === "calendar" && (
              <Calendar
                notes={notes || []}
                selectedPlatform={selectedPlatform}
                onEditNote={handleViewNote}
                onPlatformChange={handlePlatformChange}
              />
            )}

            {currentView === "profile" && <Profile />}

            {currentView === "create" && (
              <NoteEditor noteId="new" onClose={() => setCurrentView("feed")} />
            )}
          </>
        )}
      </main>

      <BottomNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
      />
    </div>
  );
}
