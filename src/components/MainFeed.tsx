"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "../../convex/_generated/api";
import { Header } from "./Header";
import { PlatformSwiper } from "./PlatformSwiper";
import { ContentFeed } from "./ContentFeed";
import { PostEditor } from "./PostEditor";
import { BottomNavigation } from "./BottomNavigation";
import { Platform, ViewType } from "@/types";

export function MainFeed() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const [currentView, setCurrentView] = useState<ViewType>("feed");
  const [editingPost, setEditingPost] = useState<string | null>(null);

  const user = useQuery(api.auth.loggedInUser);
  const posts = useQuery(api.posts.getUserPosts, {
    platform: selectedPlatform || undefined,
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      {user && <Header user={user} />}

      {/* Platform Swiper */}
      <div className="mx-auto mb-4 w-full max-w-[1000px] border-b border-neutral-900 py-3">
        <PlatformSwiper
          selectedPlatform={selectedPlatform}
          onPlatformSelect={setSelectedPlatform}
        />
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-[1000px] flex-1 overflow-y-auto pb-20">
        {editingPost ? (
          <PostEditor
            postId={editingPost}
            onClose={() => setEditingPost(null)}
          />
        ) : (
          <ContentFeed
            platform={selectedPlatform}
            posts={posts || []}
            selectedPlatform={selectedPlatform}
            onEditPost={setEditingPost}
            currentView={currentView}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreatePost={() => setEditingPost("new")}
      />
    </div>
  );
}
