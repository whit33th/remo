"use client";

import { useParams, useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { NoteDetailView } from "../../../components/NoteDetailView";
import { Header } from "@/components/Header";
import { useQuery } from "convex-helpers/react/cache";
import { Id } from "@/types";

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

  const note = useQuery(api.notes.getNote, { noteId: noteId as Id<"notes"> });

  if (!note) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-neutral-100">
              Note not found
            </h1>
            <button
              onClick={() => router.push("/")}
              className="rounded-full bg-neutral-100 px-6 py-3 font-semibold text-black transition-colors hover:bg-neutral-300"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto w-full max-w-[1000px] p-4">
        <NoteDetailView note={note} onBack={() => router.push("/")} />
      </div>
    </div>
  );
}
