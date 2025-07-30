"use client";

import { useAction } from "convex/react";
import { Calendar, Lightbulb } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { PLATFORM_COLORS, STATUS_CONFIG } from "../constants";
import { NoteCardProps } from "../types";
import { PlatformIcon } from "./PlatformIcons";
import { ShareModal } from "./ShareModal";

export function NoteCard({ note, onEdit }: NoteCardProps) {
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
        href={`/note/${note._id}`}
        prefetch={true}
        className="cursor-pointer bg-black transition-transform hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div
              className={`h-10 w-10 rounded-full bg-gradient-to-r ${PLATFORM_COLORS[note.platform]} flex items-center justify-center text-white`}
            >
              <PlatformIcon
                platform={note.platform}
                size={20}
                className="text-white"
              />
            </div>
            <div>
              {note.title ? (
                <div className="font-semibold text-neutral-100">
                  {note.title}
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

        {note.mediaUrls &&
          note.mediaUrls.filter((url) => url !== null).length > 0 && (
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
              {note.mediaUrls.filter((url) => url !== null)[0] && (
                <Image
                  src={note.mediaUrls.filter((url) => url !== null)[0]}
                  alt="Media"
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}

        <div className="p-4">
          <div className="mb-3">
            <p className="line-clamp-2 text-sm text-neutral-300">
              {note.content}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusInfo(note.status).color}`}
              >
                {getStatusInfo(note.status).icon}
                <span>{getStatusInfo(note.status).text}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className="rounded-full bg-neutral-800 p-2 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
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

          {note.hashtags && note.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {note.hashtags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400"
                >
                  #{tag}
                </span>
              ))}
              {note.hashtags.length > 3 && (
                <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400">
                  +{note.hashtags.length - 3}
                </span>
              )}
            </div>
          )}
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
