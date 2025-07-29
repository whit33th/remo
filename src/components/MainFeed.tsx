"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@/convex/_generated/api";
import { PlatformSwiper } from "./PlatformSwiper";
import { ContentFeed } from "./ContentFeed";
import { PostEditor } from "./PostEditor";
import { Platform, ViewType } from "@/types";

interface MainFeedProps {
  selectedPlatform?: Platform | null;
  onPlatformChange?: (platform: Platform | null) => void;
}

export function MainFeed({
  selectedPlatform: externalSelectedPlatform,
  onPlatformChange,
}: MainFeedProps) {
  const [internalSelectedPlatform, setInternalSelectedPlatform] =
    useState<Platform | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("feed");
  const [editingPost, setEditingPost] = useState<string | null>(null);

  const selectedPlatform =
    externalSelectedPlatform !== undefined
      ? externalSelectedPlatform
      : internalSelectedPlatform;
  const setSelectedPlatform = onPlatformChange || setInternalSelectedPlatform;

  const posts = useQuery(api.posts.getUserPosts, {
    platform: selectedPlatform || undefined,
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Platform Swiper */}
      <div className="mx-auto mb-4 w-full max-w-[1000px] border-b border-neutral-900 py-3">
        <PlatformSwiper
          selectedPlatform={selectedPlatform}
          onPlatformSelect={setSelectedPlatform}
        />
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-[1000px] flex-1 overflow-y-auto">
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
    </div>
  );
}
