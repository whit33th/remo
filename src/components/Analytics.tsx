"use client";

import { useQuery } from "convex-helpers/react/cache";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Check,
  Clock,
  FileText,
  Lightbulb,
  Mail,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { PlatformIcon } from "./PlatformIcons";

export function Analytics() {
  const user = useQuery(api.auth.loggedInUser);
  const posts = useQuery(api.posts.getUserPosts, {});
  const notifications = useQuery(api.notifications.getUserNotifications, {});

  if (!posts || !notifications) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalPosts = posts.length;
  const scheduledPosts = posts.filter((p) => p.status === "schedule").length;
  const ideaPosts = posts.filter((p) => p.status === "idea").length;

  const platformStats = posts.reduce(
    (acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const recentNotifications = notifications.slice(0, 5);

  const platformColors = {
    instagram: "from-purple-500 to-pink-500",
    X: "from-blue-400 to-blue-600",
    youtube: "from-red-500 to-red-600",
    telegram: "from-cyan-400 to-cyan-600",
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-neutral-100">Analytics</h2>
        <p className="text-gray-600">Overview of your content and activity</p>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-900 bg-black p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-3xl font-bold text-neutral-100">
                {totalPosts}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-900 bg-black p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ideas</p>
              <p className="text-3xl font-bold text-yellow-600">{ideaPosts}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-900 bg-black p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-3xl font-bold text-orange-600">
                {scheduledPosts}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-900 bg-black p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-3xl font-bold text-green-600">
                {scheduledPosts}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Platform Distribution */}
        <div className="rounded-xl border border-neutral-900 bg-black p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-semibold text-neutral-100">
            Platform Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(platformStats).map(([platform, count]) => {
              const percentage =
                totalPosts > 0 ? (count / totalPosts) * 100 : 0;
              return (
                <div
                  key={platform}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-8 w-8 rounded-full bg-gradient-to-r ${platformColors[platform as keyof typeof platformColors]} flex items-center justify-center text-sm text-white`}
                    >
                      <PlatformIcon
                        platform={
                          platform as "instagram" | "X" | "youtube" | "telegram"
                        }
                        size={16}
                        className="text-white"
                      />
                    </div>
                    <span className="font-medium capitalize text-neutral-100">
                      {platform}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-24 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${platformColors[platform as keyof typeof platformColors]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-sm font-medium text-gray-600">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="rounded-xl border border-neutral-900 bg-black p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-semibold text-neutral-100">
            Content Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                <span className="font-medium text-neutral-100">Ideas</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {ideaPosts}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-green-600" />
                <span className="font-medium text-neutral-100">Scheduled</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {scheduledPosts}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4">
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-6 w-6 text-purple-600" />
                <span className="font-medium text-neutral-100">Ideas</span>
              </div>
              <span className="text-xl font-bold text-purple-600">
                {ideaPosts}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <div className="mt-8 rounded-xl border border-neutral-900 bg-black p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-semibold text-neutral-100">
            Recent Notifications
          </h3>
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification._id}
                className="flex items-start space-x-3 rounded-lg bg-gray-50 p-4"
              >
                <div className="flex-shrink-0">
                  {notification.type === "published" && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                  {notification.type === "reminder" && (
                    <Clock className="h-5 w-5 text-orange-600" />
                  )}
                  {notification.type === "daily" && (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                  {notification.type === "deadline" && (
                    <Calendar className="h-5 w-5 text-red-600" />
                  )}
                  {notification.type === "overdue" && (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-100">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-neutral-200">
                    {new Date(notification.scheduledFor).toLocaleDateString(
                      "ru-RU",
                    )}{" "}
                    в{" "}
                    {new Date(notification.scheduledFor).toLocaleTimeString(
                      "ru-RU",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
                {notification.sent && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Sent
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Notifications Info */}
      <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-100">
              Email Notifications
            </h3>
            <p className="mb-4 text-neutral-300">
              Receive notifications at: {user?.email}
            </p>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-neutral-100">
                  Notification Types:
                </h4>
                <ul className="space-y-1">
                  <li className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Daily reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span>Publication reminders</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Publication notifications</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Overdue warnings</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-neutral-100">Setup:</h4>
                <p>
                  Enable notifications when creating or editing posts to receive
                  automatic reminders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
