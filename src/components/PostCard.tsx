"use client";

import { useAction } from "convex/react";
import { Calendar, Lightbulb } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { PLATFORM_COLORS, STATUS_CONFIG } from "../constants";
import { PostCardProps } from "../types";
import { PlatformIcon } from "./PlatformIcons";
import { ShareModal } from "./ShareModal";

export function PostCard({ post, onEdit }: PostCardProps) {
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
  const status = {
    idea: {
      text: STATUS_CONFIG.idea.text,
      icon: <Lightbulb className="h-4 w-4" />,
      color: STATUS_CONFIG.idea.color,
    },
    schedule: {
      text: STATUS_CONFIG.schedule.text,
      icon: <Calendar className="h-4 w-4" />,
      color: STATUS_CONFIG.schedule.color,
    },
  };

  const getStatusInfo = (statusKey: string) => {
    if (statusKey === "idea" || statusKey === "schedule") {
      return status[statusKey as keyof typeof status];
    }
    if (
      statusKey === "draft" ||
      statusKey === "scheduled" ||
      statusKey === "published"
    ) {
      return status.schedule;
    }
    return status.idea;
  };

  return (
    <>
      <Link
        href={`/post/${post._id}`}
        prefetch={true}
        className="cursor-pointer bg-black transition-transform hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div
              className={`h-10 w-10 rounded-full bg-gradient-to-r ${PLATFORM_COLORS[post.platform]} flex items-center justify-center text-white`}
            >
              <PlatformIcon
                platform={post.platform}
                size={20}
                className="text-white"
              />
            </div>
            <div>
              {post.title ? (
                <div className="font-semibold text-neutral-100">
                  {post.title}
                </div>
              ) : (
                <div className="font-semibold text-neutral-100">No title</div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="z-10 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="aspect-square w-full overflow-hidden bg-gray-100">
            {post.mediaUrls[0] && (
              <Image
                width={400}
                height={400}
                src={post.mediaUrls[0]}
                alt="Post media"
                className="h-full w-full object-cover"
              />
            )}
            {post.mediaUrls.length > 1 && (
              <div className="absolute right-2 top-2 rounded bg-black bg-opacity-50 px-2 py-1 text-xs text-white">
                +{post.mediaUrls.length - 1}
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusInfo(post.status).color}`}
            >
              {getStatusInfo(post.status).icon}{" "}
              {getStatusInfo(post.status).text}
            </span>
          </div>

          {post.content && (
            <p className="mb-3 leading-relaxed text-neutral-100">
              {post.content}
            </p>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {post.hashtags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-sm text-neutral-700">
                  #{tag}
                </span>
              ))}
              {post.hashtags.length > 3 && (
                <span className="text-sm text-neutral-600">
                  +{post.hashtags.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            {post.scheduledDate && (
              <span className="text-xs text-neutral-700">
                {new Date(post.scheduledDate).toLocaleDateString("ru-RU")}
              </span>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              className="z-10 flex items-center space-x-1 text-neutral-200 transition-colors hover:text-neutral-300"
            >
              <svg
                className="h-5 w-5"
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
        onShare={handleShare}
      />
    </>
  );
}
