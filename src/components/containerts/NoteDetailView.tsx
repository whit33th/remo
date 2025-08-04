"use client";

import { api } from "@/convex/_generated/api";
import { NoteWithMediaUrls } from "@/types";
import { useAction } from "convex/react";
import {
  ArrowLeft,
  AtSign,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Link,
  Share2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SocialIcon } from "../ui/SocialIcons";
import { ShareModal } from "../ui/ShareModal";

interface NoteDetailViewProps {
  note: NoteWithMediaUrls;
  onBack: () => void;
}

export function NoteDetailView({ note, onBack }: NoteDetailViewProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const shareNote = useAction(api.notes.shareNote);
  const router = useRouter();

  const validMediaUrls =
    note.mediaUrls?.filter((url): url is string => url !== null) || [];

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
      await shareNote({
        email,
        noteId: note._id,
      });
    } catch (error) {
      console.error("Error sharing note:", error);
      throw error;
    }
  };

  const handleEdit = () => {
    router.push(`/note/${note._id}/edit`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ru-RU", {
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

  const renderNoteContent = () => {
    const getPlatformDisplayName = (platform: string) => {
      switch (platform) {
        case "instagram":
          return "Instagram Note";
        case "X":
          return "X Note";
        case "youtube":
          return "YouTube Video";
        case "telegram":
          return "Telegram Message";
        default:
          return note.title || "Note";
      }
    };

    return (
      <div className="rounded-lg border border-neutral-800 p-6">
        <div className="mb-4 flex items-center space-x-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${getPlatformColor(note.platform)} text-white`}
          >
            <SocialIcon platform={note.platform} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-100">
              {note.title || getPlatformDisplayName(note.platform)}
            </h3>
            <p className="text-sm text-neutral-400">@{note.platform}</p>
          </div>
        </div>

        {note.mediaUrls && note.mediaUrls.length > 0 && (
          <div className="mb-4 grid grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-2">
            {note.mediaUrls
              .filter((url): url is string => url !== null)
              .map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => openMediaModal(index)}
                >
                  <Image
                    src={url}
                    alt={`Media ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
          </div>
        )}

        {note.title && note.platform === "youtube" && (
          <div className="mb-4">
            <h4 className="text-xl font-semibold text-neutral-100">
              {note.title}
            </h4>
          </div>
        )}

        {note.content && (
          <div className="mb-4">
            <p className="text-neutral-200">{note.content}</p>
          </div>
        )}

        {note.hashtags && note.hashtags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {note.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-neutral-300">
      <div className="sticky top-0 flex items-center justify-between border-b border-neutral-950 bg-black/90 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 transition hover:text-neutral-500"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center space-x-2 rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-neutral-300 transition-colors hover:bg-neutral-900"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 rounded-lg bg-neutral-100 px-3 py-2 font-medium text-black transition-colors hover:bg-neutral-300"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
        {renderNoteContent()}

        <div className="rounded-lg border border-neutral-800 p-6">
          <h3 className="mb-4 text-lg font-semibold text-neutral-100">
            Note Details
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-400">Created:</span>
                <span className="text-sm text-neutral-200">
                  {formatDate(note.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-400">Updated:</span>
                <span className="text-sm text-neutral-200">
                  {formatDate(note.updatedAt)}
                </span>
              </div>
              {note.scheduledDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-400">Scheduled:</span>
                  <span className="text-sm text-neutral-200">
                    {formatDate(note.scheduledDate)}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-400">Status:</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    note.status === "idea"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {note.status === "idea" ? "Idea" : "Scheduled"}
                </span>
              </div>
              {note.enableNotifications && (
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-400">
                    Notifications: Enabled
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {(note.hashtags?.length > 0 ||
          note.links?.length > 0 ||
          note.mentions?.length > 0) && (
          <div className="rounded-lg border border-neutral-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-100">
              Additional Information
            </h3>
            <div className="space-y-4">
              {note.links && note.links.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center space-x-2">
                    <Link className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-400">
                      Links
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {note.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {note.mentions && note.mentions.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center space-x-2">
                    <AtSign className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-400">
                      Mentions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {note.mentions.map((mention, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300"
                      >
                        @{mention}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isMediaModalOpen && validMediaUrls.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={closeMediaModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative">
              <Image
                src={validMediaUrls[currentMediaIndex]}
                alt={`Media ${currentMediaIndex + 1}`}
                width={800}
                height={600}
                className="max-h-[80vh] max-w-full object-contain"
              />
              {validMediaUrls.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black bg-opacity-50 px-3 py-1 text-sm text-white">
                    {currentMediaIndex + 1} / {validMediaUrls.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        note={note}
        onShare={handleShare}
      />
    </div>
  );
}
