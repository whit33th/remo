"use client";

import { useParams, useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { NoteDetailView } from "../../../components/NoteDetailView";
import { Header } from "@/components/Header";
import { useQuery } from "convex-helpers/react/cache";
import { Id } from "@/types";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const post = useQuery(api.posts.getPost, { postId: postId as Id<"posts"> });

  if (!post) {
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
        <NoteDetailView post={post} onBack={() => router.push("/")} />
      </div>
    </div>
  );
}
