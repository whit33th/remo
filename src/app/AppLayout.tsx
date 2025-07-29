"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/Header";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PostEditor } from "@/components/PostEditor";
import { MainFeed } from "@/components/MainFeed";
import { Calendar } from "@/components/Calendar";
import { Analytics } from "@/components/Analytics";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const user = useQuery(api.auth.loggedInUser);
  const router = useRouter();
  const pathname = usePathname();

  const [selectedPlatform, setSelectedPlatform] = useState<
    "instagram" | "X" | "youtube" | "telegram" | null
  >(null);

  const [currentView, setCurrentView] = useState<
    "feed" | "calendar" | "create" | "profile"
  >("feed");

  const isPostPage = pathname.includes("/post/");

  const posts = useQuery(api.posts.getUserPosts, {
    platform: selectedPlatform || undefined,
  });

  const handleViewPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleViewChange = (
    view: "feed" | "calendar" | "create" | "profile",
  ) => {
    setCurrentView(view);
  };

  const handlePlatformChange = (
    platform: "instagram" | "X" | "youtube" | "telegram" | null,
  ) => {
    setSelectedPlatform(platform);
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header user={user} />
      <main className={"pb-20"}>
        {isPostPage ? (
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
                onEditPost={handleViewPost}
                onPlatformChange={handlePlatformChange}
              />
            )}

            {currentView === "profile" && <Analytics />}

            {currentView === "create" && (
              <PostEditor postId="new" onClose={() => setCurrentView("feed")} />
            )}
          </>
        )}
      </main>

      <BottomNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
        onCreatePost={() => setCurrentView("create")}
      />
    </div>
  );
}
