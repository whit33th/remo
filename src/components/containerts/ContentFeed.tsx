"use client";

import { Edit } from "lucide-react";
import { GRID_LAYOUTS } from "../../constants";
import { ContentFeedProps } from "../../types";
import { InstagramCard, TelegramCard, XCard, YouTubeCard } from "./Cards";
import { NoteCard } from "./NoteCard";

export function ContentFeed({ platform, notes, onEditNote }: ContentFeedProps) {
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.scheduledDate && !b.scheduledDate) return -1;
    if (!a.scheduledDate && b.scheduledDate) return 1;

    if (a.scheduledDate && b.scheduledDate) {
      return a.scheduledDate - b.scheduledDate;
    }

    return b._creationTime - a._creationTime;
  });

  const renderPlatformSpecificFeed = () => {
    switch (platform) {
      case "instagram":
        return (
          <div className={GRID_LAYOUTS.instagram}>
            {sortedNotes.map((note) => (
              <div key={note._id} className="h-full">
                <InstagramCard note={note} onEdit={onEditNote} />
              </div>
            ))}
          </div>
        );

      case "X":
        return (
          <div className={GRID_LAYOUTS.X}>
            {sortedNotes.map((note) => (
              <XCard key={note._id} note={note} onEdit={onEditNote} />
            ))}
          </div>
        );

      case "youtube":
        return (
          <div className={GRID_LAYOUTS.youtube}>
            {sortedNotes.map((note) => (
              <YouTubeCard key={note._id} note={note} onEdit={onEditNote} />
            ))}
          </div>
        );

      case "telegram":
        return (
          <div className={GRID_LAYOUTS.telegram}>
            {sortedNotes.map((note) => (
              <TelegramCard key={note._id} note={note} onEdit={onEditNote} />
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-0">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onEdit={() => onEditNote(note._id)}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <section className="w-full">
      {}
      <div className="space-y-0 overflow-hidden">
        {sortedNotes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">
              <Edit className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-neutral-100">
              No content yet
            </h3>
            <p className="mb-6 text-gray-600">Create your first note or idea</p>
          </div>
        ) : (
          renderPlatformSpecificFeed()
        )}
      </div>
    </section>
  );
}
