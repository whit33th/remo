"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CardProps } from "./types";
import { SocialIcon } from "../../../ui/SocialIcons";
import { ShareModal } from "../../ShareModal";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function YouTubeCard({ post, onEdit }: CardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const sharePost = useAction(api.posts.sharePost);

  const handleShare = async (email: string) => {
    try {
      await sharePost({
        email,
        postId: post._id,
      });
    } catch (error) {
      console.error("Error sharing post:", error);
      throw error;
    }
  };

  return (
    <>
      <Link
        href={`/post/${post._id}`}
        prefetch={true}
        className="cursor-pointer overflow-hidden rounded-lg bg-black transition-transform hover:scale-[1.02]"
      >
        {/* YouTube-style video thumbnail */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="relative">
            <div className="aspect-video bg-gray-100">
              <Image
                src={post.mediaUrls[0] || ""}
                alt="Video thumbnail"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-80 px-2 py-1 text-xs text-white">
              10:30
            </div>
          </div>
        )}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white">
                <SocialIcon platform="youtube" size={16} />
              </div>
              {post.title && (
                <h3 className="line-clamp-2 flex-1 font-semibold text-neutral-100">
                  {post.title}
                </h3>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(post._id);
              }}
              className="z-10 ml-2 flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          {post.content && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-600">
              {post.content}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Channel Name</span>
              <span className="text-xs text-gray-500">
                {new Date(post._creationTime).toLocaleDateString("ru-RU")}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              className="z-10 text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
      </Link>

      {/* Share Modal - rendered outside of Link */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
        onShare={handleShare}
      />
    </>
  );
}
