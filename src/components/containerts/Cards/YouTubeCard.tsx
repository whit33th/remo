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

export function YouTubeCard({ note, onEdit }: CardProps) {
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
        className="cursor-pointer overflow-hidden bg-black transition-transform hover:scale-[1.02]"
      >
        {note.mediaUrls &&
          note.mediaUrls.filter((url) => url !== null).length > 0 && (
            <div className="relative">
              <div className="aspect-video bg-gray-100">
                <Image
                  src={note.mediaUrls.filter((url) => url !== null)[0] || ""}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white">
                <SocialIcon platform="youtube" size={16} />
              </div>
              {note.title && (
                <h3 className="line-clamp-2 flex-1 font-semibold text-neutral-100">
                  {note.title}
                </h3>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(note._id);
              }}
              className="z-10 ml-2 flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          {note.content && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-600">
              {note.content}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Channel Name</span>
              <span className="text-xs text-gray-500">
                {new Date(note._creationTime).toLocaleDateString("en-US")}
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
              <Edit className="h-4 w-4" />
            </button>
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
