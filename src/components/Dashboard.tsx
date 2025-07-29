import { useQuery } from "convex-helpers/react/cache";
import { BarChart3, Calendar as CalendarIcon, Lightbulb } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { Analytics } from "./Analytics";
import { Calendar } from "./Calendar";
import { IdeasFeed } from "./IdeasFeed";
import { PlatformNavigation } from "./PlatformNavigation";
import { PostEditor } from "./PostEditor";

type Platform = "instagram" | "X" | "youtube" | "telegram" | null;
type View = "calendar" | "ideas" | "analytics";

export function Dashboard() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [currentView, setCurrentView] = useState<View>("calendar");
  const [editingPost, setEditingPost] = useState<string | null>(null);

  const user = useQuery(api.auth.loggedInUser);
  const posts = useQuery(api.posts.getUserPosts, {
    platform: selectedPlatform || undefined,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-neutral-100">Tretch</h1>
            <div className="text-sm text-neutral-200">
              Welcome, {user?.email}
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="h-screen w-80 overflow-y-auto border-r border-neutral-900 bg-black">
          <div className="p-6">
            {/* Platform Navigation */}
            <PlatformNavigation
              selectedPlatform={selectedPlatform}
              onPlatformSelect={setSelectedPlatform}
            />

            {/* View Navigation */}
            <div className="mt-8">
              <nav className="space-y-2">
                <button
                  onClick={() => setCurrentView("calendar")}
                  className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                    currentView === "calendar"
                      ? "bg-blue-50 text-blue-700"
                      : "text-neutral-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Календарь</span>
                  </div>
                </button>
                <button
                  onClick={() => setCurrentView("ideas")}
                  className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                    currentView === "ideas"
                      ? "bg-blue-50 text-blue-700"
                      : "text-neutral-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Идеи</span>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView("analytics")}
                  className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                    currentView === "analytics"
                      ? "bg-blue-50 text-blue-700"
                      : "text-neutral-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Аналитика</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Ideas Feed */}
            <div className="mt-8">
              <IdeasFeed
                posts={posts || []}
                selectedPlatform={selectedPlatform}
                onEditPost={setEditingPost}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {editingPost ? (
            <PostEditor
              postId={editingPost}
              onClose={() => setEditingPost(null)}
            />
          ) : (
            <>
              {currentView === "calendar" && (
                <Calendar
                  posts={posts || []}
                  selectedPlatform={selectedPlatform}
                  onEditPost={setEditingPost}
                />
              )}
              {currentView === "ideas" && (
                <div className="p-6">
                  <h2 className="mb-6 text-2xl font-bold">Идеи</h2>
                  <button
                    onClick={() => setEditingPost("new")}
                    className="rounded-lg bg-neutral-100 px-4 py-2 text-black transition-colors hover:bg-neutral-300"
                  >
                    + Новая идея
                  </button>
                </div>
              )}

              {currentView === "analytics" && <Analytics />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
