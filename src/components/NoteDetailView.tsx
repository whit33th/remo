"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Edit,
  Share2,
  Calendar,
  Clock,
  Hash,
  Link,
  AtSign,
  User,
  Bell,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PostWithMediaUrls } from "@/types";
import { SocialIcon } from "../ui/SocialIcons";
import { ShareModal } from "./ShareModal";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

interface NoteDetailViewProps {
  post: PostWithMediaUrls;
  onBack: () => void;
}

export function NoteDetailView({ post, onBack }: NoteDetailViewProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const sharePost = useAction(api.posts.sharePost);
  const router = useRouter();

  const validMediaUrls =
    post.mediaUrls?.filter((url): url is string => url !== null) || [];

  const openMediaModal = (index: number) => {
    setCurrentMediaIndex(index);
    setIsMediaModalOpen(true);
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % validMediaUrls.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex(
      (prev) => (prev - 1 + validMediaUrls.length) % validMediaUrls.length,
    );
  };

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

  const handleEdit = () => {
    router.push(`/note/${post._id}/edit`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "from-purple-500 to-pink-500";
      case "X":
        return "from-blue-400 to-blue-600";
      case "youtube":
        return "from-red-500 to-red-700";
      case "telegram":
        return "from-cyan-400 to-cyan-600";
      default:
        return "from-gray-500 to-gray-700";
    }
  };

  const renderPlatformSpecificContent = () => {
    switch (post.platform) {
      case "instagram":
        return (
          <div className="mx-auto max-w-2xl">
            {/* Instagram-style header */}
            <div className="mb-6 flex items-center space-x-3 rounded-lg border border-neutral-950/20 bg-black p-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${getPlatformColor(post.platform)} text-white`}
              >
                <SocialIcon platform={post.platform} size={24} />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-neutral-100">
                  Instagram Post
                </h1>
                <p className="text-sm text-neutral-400">@{post.platform}</p>
              </div>
            </div>

            {/* Media - all images in grid */}
            {validMediaUrls.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {validMediaUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105"
                      onClick={() => openMediaModal(index)}
                    >
                      <Image
                        src={url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity hover:bg-opacity-20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            {post.content && (
              <div className="mb-6 rounded-lg border border-neutral-950/20 bg-black p-4">
                <p className="whitespace-pre-wrap text-neutral-100">
                  {post.content}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mb-6 rounded-lg border border-neutral-950/20 bg-black p-4">
                <div className="mb-2 flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-300">
                    Hashtags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <span key={index} className="text-sm text-blue-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "X":
        return (
          <div className="mx-auto max-w-2xl">
            {/* X-style header */}
            <div className="mb-6 flex items-start space-x-3 rounded-lg border border-neutral-950 bg-black p-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${getPlatformColor(post.platform)} text-white`}
              >
                <SocialIcon platform={post.platform} size={24} />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center space-x-2">
                  <span className="font-semibold text-neutral-100">User</span>
                  <span className="text-sm text-neutral-400">
                    @{post.platform}
                  </span>
                </div>
                <h1 className="text-lg font-semibold text-neutral-100">
                  X Post
                </h1>
              </div>
            </div>

            {/* Content */}
            {post.content && (
              <div className="mb-6 rounded-lg border border-neutral-950 bg-black p-4">
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-neutral-100">
                  {post.content}
                </p>
              </div>
            )}

            {/* Media - all images in grid */}
            {validMediaUrls.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {validMediaUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-gray-900 transition-transform hover:scale-105"
                      onClick={() => openMediaModal(index)}
                    >
                      <Image
                        src={url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity hover:bg-opacity-20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mb-6 rounded-lg border border-neutral-950 bg-black p-4">
                <div className="mb-2 flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-300">
                    Hashtags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <span key={index} className="text-sm text-blue-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "youtube":
        return (
          <div className="mx-auto max-w-4xl">
            {/* YouTube-style header */}
            <div className="mb-6 flex items-center space-x-3 rounded-lg border border-neutral-950/20 bg-black p-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${getPlatformColor(post.platform)} text-white`}
              >
                <SocialIcon platform={post.platform} size={24} />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-neutral-100">
                  YouTube Video
                </h1>
                <p className="text-sm text-neutral-400">@{post.platform}</p>
              </div>
            </div>

            {/* Title */}
            {post.title && (
              <div className="mb-6 rounded-lg border border-neutral-950/20 bg-black p-4">
                <h2 className="text-xl font-bold text-neutral-100">
                  {post.title}
                </h2>
              </div>
            )}

            {/* Media - all images in grid */}
            {validMediaUrls.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {validMediaUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105"
                      onClick={() => openMediaModal(index)}
                    >
                      <Image
                        src={url}
                        alt={`Video thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />

                      <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity hover:bg-opacity-20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            {post.content && (
              <div className="mb-6 rounded-lg border border-neutral-950/20 bg-black p-4">
                <p className="whitespace-pre-wrap text-neutral-100">
                  {post.content}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mb-6 rounded-lg border border-neutral-950/20 bg-black p-4">
                <div className="mb-2 flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-300">
                    Hashtags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <span key={index} className="text-sm text-red-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "telegram":
        return (
          <div className="mx-auto max-w-2xl">
            {/* Telegram-style header */}
            <div className="mb-6 flex items-center space-x-3 rounded-lg border border-neutral-950 bg-black p-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${getPlatformColor(post.platform)} text-white`}
              >
                <SocialIcon platform={post.platform} size={24} />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-neutral-100">
                  Telegram Message
                </h1>
                <p className="text-sm text-neutral-400">@{post.platform}</p>
              </div>
            </div>

            {/* Content */}
            {post.content && (
              <div className="mb-6 rounded-lg border border-neutral-950 bg-black p-4">
                <p className="whitespace-pre-wrap text-neutral-100">
                  {post.content}
                </p>
              </div>
            )}

            {/* Media - all images in grid */}
            {validMediaUrls.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {validMediaUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105"
                      onClick={() => openMediaModal(index)}
                    >
                      <Image
                        src={url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity hover:bg-opacity-20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mb-6 rounded-lg border border-neutral-950 bg-black p-4">
                <div className="mb-2 flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-300">
                    Hashtags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <span key={index} className="text-sm text-blue-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-neutral-950/20 bg-black p-4">
              <p className="text-neutral-100">{post.content}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <div className="p-4">
        {/* Action Buttons */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-neutral-400 transition-colors hover:text-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center space-x-2 rounded-lg border border-neutral-950 bg-black px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-950"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
        {renderPlatformSpecificContent()}

        {/* Post Details */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="rounded-lg border border-neutral-950 bg-black shadow-sm">
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-neutral-100">
                Post Details
              </h3>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-4 w-4 rounded-full ${
                      post.status === "schedule"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-300">
                      Status:
                    </span>
                    <p className="text-sm capitalize text-neutral-100">
                      {post.status === "schedule" ? "Scheduled" : "Idea"}
                    </p>
                  </div>
                </div>

                {/* Platform */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r ${getPlatformColor(post.platform)}`}
                  >
                    <SocialIcon platform={post.platform} size={12} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-300">
                      Platform:
                    </span>
                    <p className="text-sm capitalize text-neutral-100">
                      {post.platform}
                    </p>
                  </div>
                </div>

                {/* Scheduled Date */}
                {post.scheduledDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-neutral-500" />
                    <div>
                      <span className="text-sm font-medium text-neutral-300">
                        Scheduled for:
                      </span>
                      <p className="text-sm text-neutral-100">
                        {formatDate(post.scheduledDate)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Published Date */}
                {post.publishedAt && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    <div>
                      <span className="text-sm font-medium text-neutral-300">
                        Published:
                      </span>
                      <p className="text-sm text-neutral-100">
                        {formatDate(post.publishedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-neutral-500" />
                  <div>
                    <span className="text-sm font-medium text-neutral-300">
                      Created:
                    </span>
                    <p className="text-sm text-neutral-100">
                      {formatDate(post._creationTime)}
                    </p>
                  </div>
                </div>

                {/* Updated Date */}
                {post.updatedAt !== post._creationTime && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    <div>
                      <span className="text-sm font-medium text-neutral-300">
                        Updated:
                      </span>
                      <p className="text-sm text-neutral-100">
                        {formatDate(post.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mentions */}
                {post.mentions && post.mentions.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <AtSign className="mt-0.5 h-4 w-4 text-neutral-500" />
                    <div>
                      <span className="text-sm font-medium text-neutral-300">
                        Mentions:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {post.mentions.map((mention, index) => (
                          <span key={index} className="text-sm text-blue-400">
                            @{mention}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Author Bio */}
                {post.authorBio && (
                  <div className="flex items-start space-x-3">
                    <User className="mt-0.5 h-4 w-4 text-neutral-500" />
                    <div>
                      <span className="text-sm font-medium text-neutral-300">
                        Author Bio:
                      </span>
                      <p className="mt-1 text-sm text-neutral-100">
                        {post.authorBio}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {post.enableNotifications && (
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-neutral-500" />
                    <div>
                      <span className="text-sm font-medium text-neutral-300">
                        Notifications:
                      </span>
                      <p className="text-sm text-neutral-100">
                        Enabled ({post.notificationTime}, {post.reminderHours}h
                        before)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Created and Updated dates - minimalistic grid */}
        <div className="mx-auto mt-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4 text-xs text-neutral-500">
            <div className="text-center">
              <span>Created: {formatDate(post._creationTime)}</span>
            </div>
            {post.updatedAt !== post._creationTime && (
              <div className="text-center">
                <span>Updated: {formatDate(post.updatedAt)}</span>
              </div>
            )}
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

      {/* Media Gallery Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative h-full w-full max-w-4xl">
            {/* Close button */}
            <button
              onClick={closeMediaModal}
              className="absolute right-4 top-4 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-70"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation buttons */}
            {validMediaUrls.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-70"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Current image */}
            <div className="flex h-full items-center justify-center p-4">
              <div className="relative max-h-full max-w-full">
                <Image
                  src={validMediaUrls[currentMediaIndex]}
                  alt={`Media ${currentMediaIndex + 1}`}
                  width={800}
                  height={600}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
            </div>

            {/* Image counter */}
            {validMediaUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black bg-opacity-50 px-3 py-1 text-sm text-white">
                {currentMediaIndex + 1} / {validMediaUrls.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
