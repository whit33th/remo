"use client";

import { useState } from "react";
import Image from "next/image";
import { CardProps } from "./types";
import { SocialIcon } from "../../../ui/SocialIcons";
import { ShareModal } from "../../ShareModal";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function TelegramCard({ post, onEdit }: CardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const sharePost = useAction(api.posts.sharePost);

  const handleShare = async (email: string) => {
    try {
      await sharePost({
        email,
        postData: {
          title: post.title,
          content: post.content,
          platform: post.platform,
          status: post.status,
          hashtags: post.hashtags?.filter((tag): tag is string => tag !== null),
          mediaUrls: post.mediaUrls?.filter(
            (url): url is string => url !== null,
          ),
        },
      });

      // Success is handled by the modal
    } catch (error) {
      console.error("Error sharing post:", error);
      throw error; // Let the modal handle the error
    }
  };

  return (
    <div className="rounded-lg border border-neutral-950 bg-black p-4 transition-colors hover:bg-neutral-950">
      <div className="flex items-start space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-white">
          <SocialIcon platform="telegram" size={20} />
        </div>
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-neutral-100">Channel Name</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(post._id);
                }}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mb-2">
            {post.content && (
              <p className="leading-relaxed text-neutral-100">{post.content}</p>
            )}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-xs text-blue-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="relative mb-3 aspect-video overflow-hidden rounded-lg">
              <Image
                src={post.mediaUrls[0] || ""}
                alt="Post media"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">
              {new Date(post._creationTime).toLocaleDateString("ru-RU")}
            </span>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-gray-400 transition-colors hover:text-gray-600"
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
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
        onShare={handleShare}
      />
    </div>
  );
}
