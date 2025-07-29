"use client";

import { Edit } from "lucide-react";
import { GRID_LAYOUTS } from "../constants";
import { ContentFeedProps, Id } from "../types";
import { Analytics } from "./Analytics";
import { Calendar } from "./Calendar";
import {
  InstagramCard,
  TelegramCard,
  XCard,
  YouTubeCard,
} from "./containerts/Cards";
import { PostCard } from "./PostCard";

export function ContentFeed({
  platform,
  posts,
  selectedPlatform,
  onEditPost,
  currentView,
}: ContentFeedProps) {
  if (currentView === "calendar") {
    return (
      <Calendar
        posts={posts}
        selectedPlatform={selectedPlatform}
        onEditPost={(postId: string) => onEditPost(postId as Id<"posts">)}
      />
    );
  }

  if (currentView === "profile") {
    return <Analytics />;
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.scheduledDate && !b.scheduledDate) return -1;
    if (!a.scheduledDate && b.scheduledDate) return 1;

    if (a.scheduledDate && b.scheduledDate) {
      return a.scheduledDate - b.scheduledDate;
    }

    return b._creationTime - a._creationTime;
  });

  const renderPlatformSpecificFeed = () => {
    switch (platform) {
      case "instagram":
        return (
          <div className={GRID_LAYOUTS.instagram}>
            {sortedPosts.map((post) => (
              <div key={post._id} className="h-full">
                <InstagramCard post={post} onEdit={onEditPost} />
              </div>
            ))}
          </div>
        );

      case "X":
        return (
          <div className={GRID_LAYOUTS.X}>
            {sortedPosts.map((post) => (
              <XCard key={post._id} post={post} onEdit={onEditPost} />
            ))}
          </div>
        );

      case "youtube":
        return (
          <div className={GRID_LAYOUTS.youtube}>
            {sortedPosts.map((post) => (
              <YouTubeCard key={post._id} post={post} onEdit={onEditPost} />
            ))}
          </div>
        );

      case "telegram":
        return (
          <div className={GRID_LAYOUTS.telegram}>
            {sortedPosts.map((post) => (
              <TelegramCard key={post._id} post={post} onEdit={onEditPost} />
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-0">
            {sortedPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onEdit={() => onEditPost(post._id)}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <section className="w-full">
      {/* Posts Feed */}
      <div className="space-y-0 overflow-hidden">
        {sortedPosts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">
              <Edit className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-neutral-100">
              No content yet
            </h3>
            <p className="mb-6 text-gray-600">Create your first post or idea</p>
            <button
              onClick={() => onEditPost("new")}
              className="rounded-full bg-neutral-100 px-6 py-3 font-semibold text-black transition-colors hover:bg-neutral-300"
            >
              Create Post
            </button>
          </div>
        ) : (
          renderPlatformSpecificFeed()
        )}
      </div>
    </section>
  );
}
