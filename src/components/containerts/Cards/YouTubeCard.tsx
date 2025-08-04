"use client";

import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { Edit, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShareModal } from "../../ui/ShareModal";
import { SocialIcon } from "../../ui/SocialIcons";
import { CardProps } from "./types";

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
              <Edit className="h-4 w-4" />
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
              <Share2 className="h-4 w-4" />
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
