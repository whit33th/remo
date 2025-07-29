"use client";

import { ReactNode } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ConvexQueryCacheProvider>
        <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
      </ConvexQueryCacheProvider>
    </ConvexProvider>
  );
}
