import { Calendar, Lightbulb } from "lucide-react";
import { SocialIcon } from "../ui/SocialIcons";

interface Post {
  _id: string;
  title: string;
  content: string;
  platform: "instagram" | "X" | "youtube" | "telegram";
  status: "idea" | "schedule";
  scheduledDate?: number;
  mediaUrls?: (string | null)[];
  createdAt: number;
}

interface IdeasFeedProps {
  posts: Post[];
  selectedPlatform: "instagram" | "X" | "youtube" | "telegram" | null;
  onEditPost: (postId: string) => void;
}

export function IdeasFeed({
  posts,
  selectedPlatform,
  onEditPost,
}: IdeasFeedProps) {
  const platformColors = {
    instagram: "from-purple-500 to-pink-500",
    X: "from-blue-400 to-blue-600",
    youtube: "from-red-500 to-red-600",
    telegram: "from-cyan-400 to-cyan-600",
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "idea":
        return (
          <div className="flex items-center space-x-1">
            <Lightbulb className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-neutral-200">Idea</span>
          </div>
        );
      case "schedule":
        return (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-green-500" />
            <span className="text-xs text-neutral-200">Scheduled</span>
          </div>
        );
      case "draft":
      case "scheduled":
      case "published":
        return (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-green-500" />
            <span className="text-xs text-neutral-200">Scheduled</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1">
            <Lightbulb className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-neutral-200">Idea</span>
          </div>
        );
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.scheduledDate && b.scheduledDate) {
      return a.scheduledDate - b.scheduledDate;
    }
    if (a.scheduledDate && !b.scheduledDate) return -1;
    if (!a.scheduledDate && b.scheduledDate) return 1;
    return b.createdAt - a.createdAt;
  });

  const filteredPosts = selectedPlatform
    ? sortedPosts.filter((post) => post.platform === selectedPlatform)
    : sortedPosts;

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-200">
        Ideas Feed
      </h3>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {filteredPosts.slice(0, 10).map((post) => (
          <div
            key={post._id}
            onClick={() => onEditPost(post._id)}
            className="cursor-pointer rounded-lg border border-neutral-900 bg-black p-3 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start space-x-3">
              <div
                className={`h-8 w-8 rounded-full bg-gradient-to-r ${platformColors[post.platform]} flex flex-shrink-0 items-center justify-center text-white`}
              >
                <SocialIcon platform={post.platform} size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="truncate text-sm font-medium text-neutral-100">
                    {post.title || "Untitled"}
                  </h4>
                  <div className="text-xs text-neutral-200">
                    {renderStatus(post.status)}
                  </div>
                </div>
                <p className="mb-2 line-clamp-2 text-xs text-gray-600">
                  {post.content}
                </p>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="mb-2 flex space-x-1">
                    {post.mediaUrls.slice(0, 3).map(
                      (url, index) =>
                        url && (
                          <div
                            key={index}
                            className="h-6 w-6 flex-shrink-0 rounded bg-gray-200"
                            style={{
                              backgroundImage: `url(${url})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                        ),
                    )}
                    {post.mediaUrls.length > 3 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-300 text-xs text-gray-600">
                        +{post.mediaUrls.length - 3}
                      </div>
                    )}
                  </div>
                )}
                {post.scheduledDate && (
                  <div className="text-xs text-neutral-200">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(post.scheduledDate).toLocaleDateString(
                          "en-US",
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredPosts.length === 0 && (
          <div className="py-8 text-center text-neutral-200">
            <p className="text-sm">No ideas yet</p>
            <p className="mt-1 text-xs">Create your first idea!</p>
          </div>
        )}
      </div>
    </div>
  );
}
