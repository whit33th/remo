"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="hover:text-secondary-hover rounded border border-neutral-900 bg-black px-4 py-2 font-semibold text-secondary shadow-sm transition-colors hover:bg-gray-50 hover:shadow"
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}
