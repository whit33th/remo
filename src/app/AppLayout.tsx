"use client";

import { BottomNavigation } from "@/components/BottomNavigation";
import { Calendar } from "@/components/Calendar";
import { Header } from "@/components/Header";
import { MainFeed } from "@/components/MainFeed";
import { NoteEditor } from "@/components/NoteEditor";
import { Profile } from "@/components/Profile";
import { api } from "@/convex/_generated/api";
import { Platform, ViewType } from "@/types";
import { useQuery } from "convex/react";
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

  const posts = useQuery(api.posts.getUserPosts, {
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
                posts={posts || []}
                selectedPlatform={selectedPlatform}
                onEditPost={handleViewNote}
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
