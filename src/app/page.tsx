"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { BottomNavigation } from "@/components/containerts/BottomNavigation";
import { Calendar } from "@/components/containerts/Calendar";
import { Header } from "@/components/containerts/Header";
import { MainFeed } from "@/components/containerts/MainFeed";
import { NoteEditor } from "@/components/containerts/NoteEditor";
import { Profile } from "@/components/containerts/Profile";
import { SignInForm } from "@/components/containerts/SignInForm";
import { api } from "@/convex/_generated/api";
import { Platform, ViewType } from "@/types";
import { useQuery } from "convex-helpers/react/cache";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
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

  return (
    <div className="min-h-screen bg-black">
      <Authenticated>
        <Header user={user || {}} />
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
                <NoteEditor
                  noteId="new"
                  onClose={() => setCurrentView("feed")}
                />
              )}
            </>
          )}
        </main>

        <BottomNavigation
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </Authenticated>

      <Unauthenticated>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-900 bg-black/80 px-4 text-neutral-300 shadow-sm backdrop-blur-sm">
            <h2 className="text-xl">Tretch</h2>
          </header>
          <main className="flex flex-1 items-center justify-center p-8">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center">
                <h1 className="mb-4 text-4xl font-bold text-neutral-100">
                  Create & Share
                </h1>
                <p className="text-xl text-neutral-600">
                  Plan and manage your content across all platforms
                </p>
              </div>
              <SignInForm />
            </div>
          </main>
        </div>
      </Unauthenticated>
    </div>
  );
}

export default function Page() {
  return <AppLayout>{null}</AppLayout>;
}
