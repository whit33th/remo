"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Toast } from "./Toast";
import { Note } from "@/types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  onShare: (email: string) => void;
}

export function ShareModal({
  isOpen,
  onClose,
  note,
  onShare,
}: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await onShare(email);
      setEmail("");
      onClose();
      setToast({
        message: "Note sent successfully!",
        type: "success",
        isVisible: true,
      });
    } catch (error) {
      console.error("Error sharing note:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error sending note";
      setToast({
        message: errorMessage,
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md rounded-lg border border-neutral-900 bg-black p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-100">Share note</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="mb-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold text-white">
              C
            </div>
            <span className="text-sm font-medium text-neutral-100">
              {note.title || "Note"}
            </span>
          </div>
          {note.content && (
            <p className="line-clamp-2 text-sm text-neutral-300">
              {note.content}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-neutral-200"
            >
              Email recipient
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="example@email.com"
              className="w-full rounded-lg border border-neutral-800 bg-black p-3 text-neutral-100 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex-1 rounded-lg border border-neutral-800 bg-transparent px-4 py-2 text-neutral-300 transition-colors hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 rounded-lg bg-neutral-100 px-4 py-2 font-medium text-black transition-colors hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
