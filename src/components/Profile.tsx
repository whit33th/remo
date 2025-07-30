"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/ui/Button";
import { Clock, Bell, BellOff, Settings, User } from "lucide-react";
import { toast } from "sonner";

export function Profile() {
  const user = useQuery(api.auth.loggedInUser);
  const updateUserSettings = useMutation(api.auth.updateUserSettings);

  const [notificationTime, setNotificationTime] = useState("09:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNotificationTime(user.notificationTime || "09:00");
      setNotificationsEnabled(user.notificationsEnabled !== false);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserSettings({
        notificationTime,
        notificationsEnabled,
      });
      toast.success("Settings saved!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Error saving settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  if (!user) {
    return (
      <div className="bg-black p-4 text-white">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
              <User className="h-8 w-8 text-neutral-400" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Profile</h1>
            <p className="text-neutral-400">Sign in to access settings</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black p-4 text-white">
      <div className="mx-auto max-w-md">
        {/* Profile header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800">
            <User className="h-10 w-10 text-neutral-400" />
          </div>
          <h1 className="mb-1 text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-neutral-400">{user.email}</p>
        </div>

        {/* Notification settings */}
        <div className="mb-6 rounded-lg bg-neutral-900 p-6">
          <div className="mb-4 flex items-center">
            <Settings className="mr-2 h-5 w-5 text-neutral-400" />
            <h2 className="text-lg font-medium">Notification Settings</h2>
          </div>

          {/* Notification toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              {notificationsEnabled ? (
                <Bell className="mr-2 h-5 w-5 text-neutral-400" />
              ) : (
                <BellOff className="mr-2 h-5 w-5 text-neutral-400" />
              )}
              <span className="text-sm">Daily reminders</span>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? "bg-blue-600" : "bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Notification time */}
          {notificationsEnabled && (
            <div className="space-y-3">
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-neutral-400" />
                <span className="text-sm">Notification time</span>
              </div>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
              <p className="text-xs text-neutral-500">
                You will receive a daily reminder at the specified time
              </p>
            </div>
          )}
        </div>

        {/* Save button */}
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="w-full rounded-lg bg-neutral-100 py-3 font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
