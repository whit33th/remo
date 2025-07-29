"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "@/components/SignInForm";
import { MainFeed } from "@/components/MainFeed";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <Authenticated>
        <MainFeed />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-900 bg-black/80 px-4 text-neutral-300 shadow-sm backdrop-blur-sm">
            <h2 className="text-xl">Tretch</h2>
          </header>
          <main className="flex flex-1 items-center justify-center p-8">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center">
                <h1 className="mb-4 text-4xl font-bold text-neutral-100">
                  Create & Share
                </h1>
                <p className="text-xl text-neutral-600">
                  Plan and manage your content across all platforms
                </p>
              </div>
              <SignInForm />
            </div>
          </main>
        </div>
      </Unauthenticated>
    </div>
  );
}
