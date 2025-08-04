"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CardProps } from "./types";
import { SocialIcon } from "../../ui/SocialIcons";
import { ShareModal } from "../../ui/ShareModal";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Edit } from "lucide-react";

export function InstagramCard({ note, onEdit }: CardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const shareNote = useAction(api.notes.shareNote);

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

  return (
    <>
      <Link
        href={`/note/${note._id}`}
        prefetch={true}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-neutral-950/20 bg-black transition-transform"
      >
        {note.mediaUrls &&
          note.mediaUrls.filter((url) => url !== null).length > 0 && (
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <Image
                src={note.mediaUrls.filter((url) => url !== null)[0] || ""}
                alt="Note media"
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {note.mediaUrls.filter((url) => url !== null).length > 1 && (
                <div className="absolute right-2 top-2 rounded bg-black bg-opacity-50 px-2 py-1 text-xs text-white">
                  +{note.mediaUrls.filter((url) => url !== null).length - 1}
                </div>
              )}
            </div>
          )}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <SocialIcon platform="instagram" size={16} />
              </div>
              {note.title && (
                <span className="text-sm font-medium text-neutral-100">
                  {note.title}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(note._id);
              }}
              className="z-10 text-gray-400 transition-colors hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
          {note.content && (
            <p className="mb-2 line-clamp-2 flex-1 text-sm text-gray-600">
              {note.content}
            </p>
          )}
          <div className="mt-auto">
            {note.hashtags && note.hashtags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {note.hashtags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-xs text-blue-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {new Date(note._creationTime).toLocaleDateString("en-US")}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className="z-10 text-gray-400 transition-colors hover:text-gray-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        note={note}
        onShare={handleShare}
      />
    </>
  );
}
