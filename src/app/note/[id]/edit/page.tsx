"use client";

import { useParams, useRouter } from "next/navigation";
import { NoteEditor } from "@/components/NoteEditor";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const handleClose = () => {
    router.push(`/note/${postId}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <NoteEditor noteId={postId} onClose={handleClose} />
    </div>
  );
}
