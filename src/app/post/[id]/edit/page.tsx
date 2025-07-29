"use client";

import { useParams, useRouter } from "next/navigation";
import { PostEditor } from "@/components/PostEditor";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const handleClose = () => {
    router.push(`/post/${postId}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <PostEditor postId={postId} onClose={handleClose} />
    </div>
  );
}
