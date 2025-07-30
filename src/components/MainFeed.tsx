"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@/convex/_generated/api";
import { PlatformSwiper } from "./PlatformSwiper";
import { ContentFeed } from "./ContentFeed";
import { NoteEditor } from "./NoteEditor";
import { Platform, ViewType } from "@/types";

interface MainFeedProps {
  selectedPlatform?: Platform | null;
  onPlatformChange?: (platform: Platform | null) => void;
}

export function MainFeed({
  selectedPlatform: externalSelectedPlatform,
  onPlatformChange,
}: MainFeedProps) {
  const [internalSelectedPlatform, setInternalSelectedPlatform] =
    useState<Platform | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("feed");
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const selectedPlatform =
    externalSelectedPlatform !== undefined
      ? externalSelectedPlatform
      : internalSelectedPlatform;
  const setSelectedPlatform = onPlatformChange || setInternalSelectedPlatform;

  const notes = useQuery(api.notes.getUserNotes, {
    platform: selectedPlatform || undefined,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto mb-4 w-full max-w-[1000px] border-b border-neutral-900 py-3">
        <PlatformSwiper
          selectedPlatform={selectedPlatform}
          onPlatformSelect={setSelectedPlatform}
        />
      </div>

      <div className="mx-auto w-full max-w-[1000px] flex-1 overflow-y-auto">
        {editingNote ? (
          <NoteEditor
            noteId={editingNote}
            onClose={() => setEditingNote(null)}
          />
        ) : (
          <ContentFeed
            platform={selectedPlatform}
            notes={notes || []}
            selectedPlatform={selectedPlatform}
            onEditNote={(noteId) => {
              if (noteId === "new") {
                setEditingNote("new");
              } else {
                setEditingNote(noteId);
              }
            }}
            currentView={currentView}
          />
        )}
      </div>
    </div>
  );
}
