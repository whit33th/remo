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

export function XCard({ note, onEdit }: CardProps) {
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
        className="cursor-pointer rounded-lg p-4"
      >
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white">
            <SocialIcon platform="X" size={20} />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-neutral-100">
                  {note.title}
                </span>
                <span className="space-x-1 text-sm text-gray-600">
                  {note.mentions?.slice(0, 5).map((p, index) => (
                    <span key={index}>@{p}</span>
                  ))}
                </span>
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
              <p className="mb-2 leading-relaxed text-neutral-100">
                {note.content}
              </p>
            )}
            {note.mediaUrls &&
              note.mediaUrls.filter((url) => url !== null).length > 0 && (
                <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg">
                  <Image
                    src={note.mediaUrls.filter((url) => url !== null)[0] || ""}
                    alt="Note media"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span>
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
