"use client";

import { CheckCircle, X, XCircle } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center space-x-2 rounded-lg border border-neutral-800 bg-black p-4 shadow-lg">
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <span className="text-sm text-neutral-100">{message}</span>
      <button
        onClick={onClose}
        className="text-gray-400 transition-colors hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
