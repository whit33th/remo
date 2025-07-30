"use client";

import { useParams, useRouter } from "next/navigation";
import { NoteEditor } from "@/components/NoteEditor";

export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

  const handleClose = () => {
    router.push(`/note/${noteId}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <NoteEditor noteId={noteId} onClose={handleClose} />
    </div>
  );
}
