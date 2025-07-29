"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import {
  AtSign,
  Calendar,
  Clock,
  Eye,
  FileText,
  Hash,
  Image as ImageIcon,
  Lightbulb,
  Link,
  Mail,
  MapPin,
  Send,
  Settings,
  Trash2,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { PlatformIcon } from "./PlatformIcons";

interface PostEditorProps {
  postId: string | null;
  onClose: () => void;
}

export function PostEditor({ postId, onClose }: PostEditorProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    platform: "instagram" as "instagram" | "X" | "youtube" | "telegram",
    status: "idea" as "idea" | "schedule",
    scheduledDate: "",
    scheduledTime: "",
    hashtags: [] as string[],
    hashtagInput: "",
    links: "",
    mentions: "",
    authorBio: "",
    location: "",
    story: false,
    reels: false,
    poll: "",
    thread: false,
    category: "",
    privacy: "public" as "public" | "private" | "unlisted",
    thumbnail: "",
    timestamps: "",
    buttons: [] as string[],
    enableNotifications: false,
    notificationTime: "09:00",
    reminderHours: 24,
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [existingMediaIds, setExistingMediaIds] = useState<Id<"_storage">[]>(
    [],
  );
  // const [mediaTypes, setMediaTypes] = useState<string[]>([]);

  const createPost = useMutation(api.posts.createPost);
  const updatePost = useMutation(api.posts.updatePost);
  const deletePost = useMutation(api.posts.deletePost);
  const publishPost = useAction(api.posts.publishPost);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  const platformFields = useQuery(api.posts.getPlatformSpecificFields, {
    platform: formData.platform,
  });
  const existingPost = useQuery(
    api.posts.getUserPosts,
    postId && postId !== "new" ? {} : "skip",
  );

  // Очистка URL объектов при размонтировании
  useEffect(() => {
    return () => {
      mediaUrls.forEach((url, index) => {
        // Очищаем только URL-ы новых файлов, не существующих
        if (!mediaFiles[index]?.name.startsWith("existing-media-")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [mediaUrls, mediaFiles]);

  useEffect(() => {
    if (postId !== "new" && existingPost) {
      const post = existingPost.find((p) => p._id === postId);
      if (post) {
        const scheduledDate = post.scheduledDate
          ? new Date(post.scheduledDate)
          : null;
        setFormData({
          title: post.title,
          content: post.content,
          platform: post.platform,
          status: post.status,
          scheduledDate: scheduledDate
            ? scheduledDate.toISOString().split("T")[0]
            : "",
          scheduledTime: scheduledDate
            ? scheduledDate.toTimeString().slice(0, 5)
            : "",
          hashtags: post.hashtags,
          hashtagInput: "",
          links: post.links.join(", "),
          mentions: post.mentions.join(", "),
          authorBio: post.authorBio || "",
          location: "",
          story: false,
          reels: false,
          poll: "",
          thread: false,
          category: "",
          privacy: "public",
          thumbnail: "",
          timestamps: "",
          buttons: [],
          enableNotifications: post.enableNotifications || false,
          notificationTime: post.notificationTime || "09:00",
          reminderHours: post.reminderHours || 24,
        });

        // Загружаем существующие медиафайлы
        if (post.mediaIds && post.mediaIds.length > 0) {
          setExistingMediaIds(post.mediaIds);
          setMediaUrls(post.mediaUrls.filter((url) => url !== null));
          // Создаем пустые File объекты для существующих медиафайлов
          // Это нужно для совместимости с логикой отображения
          const dummyFiles = post.mediaIds.map((mediaId, index) => {
            const dummyFile = new File([], `existing-media-${index}`, {
              type: post.mediaTypes?.[index] || "image/jpeg",
            });
            return dummyFile;
          });
          setMediaFiles(dummyFiles);
        }
      }
    }
  }, [postId, existingPost]);

  const handleInputChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Автоматически включаем уведомления при выборе статуса "schedule"
      if (field === "status" && value === "schedule") {
        newData.enableNotifications = true;
      }

      return newData;
    });
  };

  const handleHashtagInputChange = (value: string) => {
    let processedValue = value;
    if (value && !value.startsWith("#")) {
      processedValue = "#" + value;
    }
    setFormData((prev) => ({ ...prev, hashtagInput: processedValue }));
  };

  const handleHashtagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      const trimmedValue = formData.hashtagInput.trim().replace(/^#+/, "");
      if (trimmedValue && !formData.hashtags.includes(trimmedValue)) {
        setFormData((prev) => ({
          ...prev,
          hashtags: [...prev.hashtags, trimmedValue],
          hashtagInput: "",
        }));
      }
    }
  };

  const handleHashtagInputBlur = () => {
    const trimmedValue = formData.hashtagInput.trim().replace(/^#+/, "");
    if (trimmedValue && !formData.hashtags.includes(trimmedValue)) {
      setFormData((prev) => ({
        ...prev,
        hashtags: [...prev.hashtags, trimmedValue],
        hashtagInput: "",
      }));
    }
  };

  const removeHashtag = (hashtagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((hashtag) => hashtag !== hashtagToRemove),
    }));
  };

  const removeMediaFile = (index: number) => {
    const file = mediaFiles[index];

    // Если это существующий файл, удаляем его из existingMediaIds
    if (file.name.startsWith("existing-media-")) {
      const existingIndex = parseInt(file.name.split("-")[2]);
      setExistingMediaIds((prev) => prev.filter((_, i) => i !== existingIndex));
    }

    // Очищаем URL объект только для новых файлов
    if (!file.name.startsWith("existing-media-")) {
      URL.revokeObjectURL(mediaUrls[index]);
    }

    // Удаляем из массивов
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
    // setMediaTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMediaUpload = async (files: FileList) => {
    setUploading(true);
    const uploadedFiles: File[] = [];
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        console.log(
          "Processing file:",
          file.name,
          "Type:",
          file.type,
          "Size:",
          file.size,
        );

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        // Проверяем поддерживаемые типы файлов
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          toast.error(
            `File ${file.name} is not a supported image or video format`,
          );
          continue;
        }

        uploadedFiles.push(file);
        const url = URL.createObjectURL(file);
        newUrls.push(url);

        console.log("Created URL for file:", file.name, "URL:", url);
      }

      setMediaFiles((prev) => [...prev, ...uploadedFiles]);
      setMediaUrls((prev) => [...prev, ...newUrls]);
      // setMediaTypes((prev) => [
      //   ...prev,
      //   ...uploadedFiles.map((file) => file.type),
      // ]);
    } catch (error) {
      console.error("Error in handleMediaUpload:", error);
      toast.error("Error uploading files");
    } finally {
      setUploading(false);
    }
  };

  const uploadMediaToStorage = async (): Promise<Id<"_storage">[]> => {
    const mediaIds: Id<"_storage">[] = [];

    for (const file of mediaFiles) {
      // Пропускаем dummy файлы (существующие медиафайлы)
      if (file.name.startsWith("existing-media-")) {
        continue;
      }

      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const { storageId } = await result.json();
        mediaIds.push(storageId as Id<"_storage">);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Upload error for ${file.name}`);
      }
    }

    return mediaIds;
  };

  const handleSave = async () => {
    try {
      // Загружаем только новые файлы
      const newMediaIds = await uploadMediaToStorage();

      // Объединяем существующие и новые mediaIds
      const allMediaIds = [...existingMediaIds, ...newMediaIds];

      const scheduledDateTime =
        formData.scheduledDate && formData.scheduledTime
          ? new Date(
              `${formData.scheduledDate}T${formData.scheduledTime}`,
            ).getTime()
          : undefined;

      const postData = {
        title: formData.title,
        content: formData.content,
        platform: formData.platform,
        status: formData.status,
        scheduledDate: scheduledDateTime,
        hashtags: formData.hashtags,
        links: formData.links
          .split(",")
          .map((link) => link.trim())
          .filter(Boolean),
        mentions: formData.mentions
          .split(",")
          .map((mention) => mention.trim())
          .filter(Boolean),
        mediaIds: allMediaIds,
        authorBio: formData.authorBio || undefined,
        enableNotifications: formData.enableNotifications,
        notificationTime: formData.notificationTime,
        reminderHours: formData.reminderHours,
      };

      if (postId === "new") {
        await createPost(postData);
        toast.success("Post created!");
      } else if (postId) {
        await updatePost({ id: postId as Id<"posts">, ...postData });
        toast.success("Post updated!");
      }

      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Error saving post");
    }
  };

  const handlePublish = async () => {
    if (!postId || postId === "new") {
      toast.error("Please save the post first");
      return;
    }

    setPublishing(true);
    try {
      await publishPost({
        postId: postId as Id<"posts">,
        platform: formData.platform,
        publishNow: true,
      });
      toast.success(`Post scheduled for ${formData.platform}!`);
      onClose();
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error("Error publishing post");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!postId || postId === "new") return;

    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deletePost({ id: postId as Id<"posts"> });
      toast.success("Post deleted successfully!");
      onClose();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const platformColors = {
    instagram: "from-purple-500 to-pink-500",
    X: "from-blue-400 to-blue-600",
    youtube: "from-red-500 to-red-600",
    telegram: "from-cyan-400 to-cyan-600",
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <ImageIcon className="h-4 w-4" />;
      case "X":
        return <Hash className="h-4 w-4" />;
      case "youtube":
        return <Video className="h-4 w-4" />;
      case "telegram":
        return <Send className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderPlatformSpecificFields = () => {
    if (!platformFields) return null;

    const fields = [];

    // Instagram specific fields
    if (formData.platform === "instagram") {
      fields.push(
        <div key="location" className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            <span>Location</span>
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-purple-500"
            placeholder="Add location..."
          />
        </div>,
        <div key="story-reels" className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.story}
              onChange={(e) => handleInputChange("story", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Story</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.reels}
              onChange={(e) => handleInputChange("reels", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Reels</span>
          </label>
        </div>,
      );
    }

    // X specific fields
    if (formData.platform === "X") {
      fields.push(
        <div key="poll" className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            <span>Poll Question</span>
          </label>
          <input
            type="text"
            value={formData.poll}
            onChange={(e) => handleInputChange("poll", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="Add poll question..."
          />
        </div>,
        <div key="thread" className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.thread}
            onChange={(e) => handleInputChange("thread", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Thread</span>
        </div>,
      );
    }

    // YouTube specific fields
    if (formData.platform === "youtube") {
      fields.push(
        <div key="category" className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            <span>Category</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select category</option>
            <option value="entertainment">Entertainment</option>
            <option value="education">Education</option>
            <option value="gaming">Gaming</option>
            <option value="music">Music</option>
            <option value="news">News</option>
            <option value="sports">Sports</option>
            <option value="technology">Technology</option>
          </select>
        </div>,
        <div key="privacy" className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium">
            <Eye className="h-4 w-4" />
            <span>Privacy</span>
          </label>
          <select
            value={formData.privacy}
            onChange={(e) => handleInputChange("privacy", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-red-500"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </div>,
        <div key="timestamps" className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span>Timestamps</span>
          </label>
          <textarea
            value={formData.timestamps}
            onChange={(e) => handleInputChange("timestamps", e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 bg-neutral-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-red-500"
            placeholder="0:00 - Introduction&#10;2:30 - Main content&#10;5:45 - Conclusion"
          />
        </div>,
      );
    }

    // Telegram specific fields
    if (formData.platform === "telegram") {
      fields.push(
        <div key="buttons" className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            <span>Inline Buttons</span>
          </label>
          <input
            type="text"
            value={formData.buttons.join(", ")}
            onChange={(e) => handleInputChange("buttons", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-cyan-500"
            placeholder="Button 1, Button 2, Button 3..."
          />
        </div>,
      );
    }

    return fields;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black text-neutral-300">
      {/* Header */}
      <div className="sticky top-0 flex flex-col border-b border-neutral-900 bg-black/90 px-4 py-3 backdrop-blur-xl sm:grid sm:grid-cols-3 sm:items-center">
        {/* Mobile: Top row with close button and title */}
        <div className="flex items-center justify-between sm:hidden">
          <button
            onClick={onClose}
            className="transition hover:text-neutral-500"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">
            {postId === "new" ? "New Post" : "Edit Post"}
          </h2>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        {/* Desktop: Left */}
        <div className="hidden items-center sm:flex">
          <button
            onClick={onClose}
            className="transition hover:text-neutral-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop: Center */}
        <div className="hidden justify-center sm:flex">
          <h2 className="text-lg font-semibold">
            {postId === "new" ? "New Post" : "Edit Post"}
          </h2>
        </div>

        {/* Mobile: Bottom row with buttons */}
        <div className="mt-3 flex items-center justify-end space-x-2 sm:mt-0">
          {/* Notification Toggle - only show for Schedule status */}
          {formData.status === "schedule" && (
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={formData.enableNotifications}
                onChange={(e) =>
                  handleInputChange("enableNotifications", e.target.checked)
                }
                className="peer sr-only"
              />
              <div
                className={`peer flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                  formData.enableNotifications
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 bg-neutral-300 text-gray-500 hover:border-gray-400"
                }`}
              >
                <Mail className="h-5 w-5" />
              </div>
            </label>
          )}

          <button
            onClick={handleSave}
            className="h-10 rounded-lg bg-neutral-300 px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-neutral-500 sm:px-4 sm:text-base"
          >
            Save
          </button>
          {postId !== "new" && (
            <>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className={`flex h-10 items-center space-x-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:space-x-2 sm:px-4 sm:text-base ${
                  publishing
                    ? "cursor-not-allowed bg-gray-500"
                    : `bg-gradient-to-r ${platformColors[formData.platform]} text-white hover:opacity-80`
                }`}
              >
                {publishing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="hidden sm:inline">Publishing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Publish Now</span>
                    <span className="sm:hidden">Publish</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="flex h-10 items-center space-x-1 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 sm:space-x-2 sm:px-3 sm:text-base"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1000px] space-y-6 p-4">
        {/* Platform Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium">Platform</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "instagram", name: "Instagram" },
              { id: "X", name: "X" },
              { id: "youtube", name: "YouTube" },
              { id: "telegram", name: "Telegram" },
            ].map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleInputChange("platform", platform.id)}
                className={`flex items-center justify-center space-x-2 rounded-lg border p-3 text-white transition-colors ${
                  formData.platform === platform.id
                    ? `bg-gradient-to-r ${platformColors[platform.id as keyof typeof platformColors]} border-none`
                    : "border-neutral-700 hover:border-neutral-600"
                }`}
              >
                <PlatformIcon
                  platform={
                    platform.id as "instagram" | "X" | "youtube" | "telegram"
                  }
                  size={20}
                  className="text-current"
                />
                <span className="font-medium">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status and Notifications */}
        <div className="space-y-4">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium">
              Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="status"
                type="button"
                onClick={() => handleInputChange("status", "idea")}
                className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-3 transition-all ${
                  formData.status === "idea"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "hover:bg-yellow-25 border-gray-300 bg-neutral-300 text-black hover:border-yellow-400"
                }`}
              >
                <Lightbulb className="h-5 w-5" />
                <span className="font-medium">Idea</span>
              </button>

              <button
                type="button"
                onClick={() => handleInputChange("status", "schedule")}
                className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-3 transition-all ${
                  formData.status === "schedule"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "hover:bg-green-25 border-gray-300 bg-neutral-300 text-black hover:border-green-400"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Schedule</span>
              </button>
            </div>
          </div>

          {/* Scheduling Fields */}
          {formData.status === "schedule" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    handleInputChange("scheduledDate", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Time</label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    handleInputChange("scheduledTime", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {formData.status === "schedule" && formData.enableNotifications && (
            <div className="rounded-lg bg-neutral-950 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Remind Before Publication (hours)
                </label>
                <select
                  value={formData.reminderHours}
                  onChange={(e) =>
                    handleInputChange("reminderHours", parseInt(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={168}>1 week</option>
                </select>
              </div>
            </div>
          )}
        </div>
        {/* Platform Info */}
        {platformFields && (
          <div className="rounded-lg bg-neutral-950 p-4">
            <div className="mb-3">
              <h3 className="flex items-center space-x-2 text-sm font-medium">
                {getPlatformIcon(formData.platform)}
                <span>{formData.platform.toUpperCase()} Requirements</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-400">Content limit:</span>
                <span className="ml-2 text-neutral-200">
                  {formData.content.length}/{platformFields.maxContentLength}
                </span>
              </div>
              <div>
                <span className="text-neutral-400">Hashtags:</span>
                <span className="ml-2 text-neutral-200">
                  {formData.hashtags.length}/{platformFields.maxHashtags}
                </span>
              </div>
              <div>
                <span className="text-neutral-400">Media:</span>
                <span className="ml-2 text-neutral-200">
                  {mediaFiles.length}/{platformFields.maxMediaCount}
                </span>
              </div>
              <div>
                <span className="text-neutral-400">Required:</span>
                <span className="ml-2 text-neutral-200">
                  {platformFields.required.join(", ")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Title{" "}
            {platformFields?.required.includes("title") && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="Enter title..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="mb-2 block text-sm font-medium">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange("content", e.target.value)}
            maxLength={platformFields?.maxContentLength || 5000}
            rows={6}
            className="w-full resize-none rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="Write your post content..."
          />
          {platformFields && (
            <div className="mt-1 text-right text-xs text-neutral-400">
              {formData.content.length}/{platformFields.maxContentLength}
            </div>
          )}
        </div>

        {/* Media Upload */}
        {platformFields && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Media Files
            </label>
            <div
              className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-blue-400", "bg-blue-50");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(
                  "border-blue-400",
                  "bg-blue-50",
                );
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(
                  "border-blue-400",
                  "bg-blue-50",
                );
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  handleMediaUpload(files);
                }
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,video/ogg,video/avi,video/mov,video/wmv"
                onChange={(e) =>
                  e.target.files && handleMediaUpload(e.target.files)
                }
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  {uploading ? (
                    <>
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                      <span className="text-sm text-gray-600">
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <div className="flex items-center space-x-1">
                          <ImageIcon className="h-5 w-5 text-gray-600" />
                          <Video className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600 hover:text-gray-700">
                          Click to upload
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Images and videos up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </label>
              {mediaFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square overflow-hidden rounded-lg bg-gray-200">
                        {file.type.startsWith("image/") ? (
                          <Image
                            src={mediaUrls[index]}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : file.type.startsWith("video/") ? (
                          <video
                            src={mediaUrls[index]}
                            className="h-full w-full object-cover"
                            muted
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              // Автоматически останавливаем видео после загрузки метаданных
                              (e.target as HTMLVideoElement).pause();
                            }}
                            onError={(e) => {
                              console.error("Video loading error:", e);
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeMediaFile(index)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white transition-colors hover:bg-red-600"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 left-1 rounded bg-black bg-opacity-50 px-1 py-0.5 text-xs text-white">
                        {file.type.startsWith("image/")
                          ? "IMG"
                          : file.type.startsWith("video/")
                            ? "VID"
                            : "FILE"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platform Specific Fields */}
        {renderPlatformSpecificFields()}

        {/* Hashtags */}
        <div>
          <label className="mb-2 block text-sm font-medium">Hashtags</label>
          <input
            type="text"
            value={formData.hashtagInput}
            onChange={(e) => handleHashtagInputChange(e.target.value)}
            onKeyDown={handleHashtagInputKeyDown}
            onBlur={handleHashtagInputBlur}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="#nottoforget"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.hashtags.map((hashtag, index) => (
              <div
                key={index}
                className="group relative flex cursor-pointer items-center rounded-md bg-neutral-950 px-3 py-1.5 text-sm transition-colors hover:bg-neutral-700"
                onClick={() => removeHashtag(hashtag)}
              >
                #{hashtag}
                <span className="ml-2 text-neutral-400 transition-colors group-hover:text-neutral-200">
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Links and Mentions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 flex items-center space-x-2 text-sm font-medium">
              <Link className="h-4 w-4" />
              <span>Links</span>
            </label>
            <input
              type="text"
              value={formData.links}
              onChange={(e) => handleInputChange("links", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center space-x-2 text-sm font-medium">
              <AtSign className="h-4 w-4" />
              <span>Mentions</span>
            </label>
            <input
              type="text"
              value={formData.mentions}
              onChange={(e) => handleInputChange("mentions", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="@username"
            />
          </div>
        </div>

        {/* Author Bio */}
        <div>
          <label className="mb-2 block text-sm font-medium">Author Bio</label>
          <textarea
            value={formData.authorBio}
            onChange={(e) => handleInputChange("authorBio", e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="Your bio or signature..."
          />
        </div>
      </div>
    </div>
  );
}
