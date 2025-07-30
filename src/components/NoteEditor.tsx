"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  AtSign,
  Calendar,
  FileText,
  Hash,
  Image as ImageIcon,
  Lightbulb,
  Link,
  Mail,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlatformIcon } from "./PlatformIcons";

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    platform: "instagram" as "instagram" | "X" | "youtube" | "telegram",
    status: "idea" as "idea" | "schedule",
    scheduledDate: "",
    scheduledTime: "",
    hashtags: [] as string[],
    hashtagInput: "",
    links: [] as string[],
    linkInput: "",
    mentions: [] as string[],
    mentionInput: "",
    authorBio: "",
    enableNotifications: false,
    notificationTime: "09:00",
    reminderHours: 24,
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [existingMediaIds, setExistingMediaIds] = useState<Id<"_storage">[]>(
    [],
  );

  const createPost = useMutation(api.notes.createNote);
  const updatePost = useMutation(api.notes.updateNote);
  const deletePost = useMutation(api.notes.deleteNote);
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);

  const platformFields = useQuery(api.notes.getPlatformSpecificFields, {
    platform: formData.platform,
  });
  const existingNote = useQuery(
    api.notes.getUserNotes,
    noteId && noteId !== "new" ? {} : "skip",
  );

  useEffect(() => {
    return () => {
      mediaUrls.forEach((url, index) => {
        if (!mediaFiles[index]?.name.startsWith("existing-media-")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [mediaUrls, mediaFiles]);

  useEffect(() => {
    if (noteId !== "new" && existingNote) {
      const note = existingNote.find((p) => p._id === noteId);
      if (note) {
        const scheduledDate = note.scheduledDate
          ? new Date(note.scheduledDate)
          : null;
        setFormData({
          title: note.title,
          content: note.content,
          platform: note.platform,
          status: note.status,
          scheduledDate: scheduledDate
            ? scheduledDate.toISOString().split("T")[0]
            : "",
          scheduledTime: scheduledDate
            ? scheduledDate.toTimeString().slice(0, 5)
            : "",
          hashtags: note.hashtags,
          hashtagInput: "",
          links: note.links,
          linkInput: "",
          mentions: note.mentions,
          mentionInput: "",
          authorBio: note.authorBio || "",
          enableNotifications: note.enableNotifications || false,
          notificationTime: note.notificationTime || "09:00",
          reminderHours: note.reminderHours || 24,
        });

        if (note.mediaIds && note.mediaIds.length > 0) {
          setExistingMediaIds(note.mediaIds);
          setMediaUrls(note.mediaUrls.filter((url) => url !== null));
          const dummyFiles = note.mediaIds.map((mediaId, index) => {
            const dummyFile = new File([], `existing-media-${index}`, {
              type: note.mediaTypes?.[index] || "image/jpeg",
            });
            return dummyFile;
          });
          setMediaFiles(dummyFiles);
        }
      }
    }
  }, [noteId, existingNote]);

  const handleInputChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

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

  const handleLinkInputChange = (value: string) => {
    setFormData((prev) => ({ ...prev, linkInput: value }));
  };

  const handleLinkInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      const trimmedValue = formData.linkInput.trim();
      if (trimmedValue && !formData.links.includes(trimmedValue)) {
        let processedValue = trimmedValue;
        if (
          !trimmedValue.startsWith("http://") &&
          !trimmedValue.startsWith("https://") &&
          !trimmedValue.startsWith("www.")
        ) {
          processedValue = "https://" + trimmedValue;
        } else if (trimmedValue.startsWith("www.")) {
          processedValue = "https://" + trimmedValue;
        }
        setFormData((prev) => ({
          ...prev,
          links: [...prev.links, processedValue],
          linkInput: "",
        }));
      }
    }
  };

  const handleLinkInputBlur = () => {
    const trimmedValue = formData.linkInput.trim();
    if (trimmedValue && !formData.links.includes(trimmedValue)) {
      let processedValue = trimmedValue;
      if (
        !trimmedValue.startsWith("http://") &&
        !trimmedValue.startsWith("https://") &&
        !trimmedValue.startsWith("www.")
      ) {
        processedValue = "https://" + trimmedValue;
      } else if (trimmedValue.startsWith("www.")) {
        processedValue = "https://" + trimmedValue;
      }
      setFormData((prev) => ({
        ...prev,
        links: [...prev.links, processedValue],
        linkInput: "",
      }));
    }
  };

  const removeLink = (linkToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((link) => link !== linkToRemove),
    }));
  };

  const handleMentionInputChange = (value: string) => {
    let processedValue = value;
    if (value && !value.startsWith("@")) {
      processedValue = "@" + value;
    }
    setFormData((prev) => ({ ...prev, mentionInput: processedValue }));
  };

  const handleMentionInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      const trimmedValue = formData.mentionInput.trim().replace(/^@+/, "");
      if (trimmedValue && !formData.mentions.includes(trimmedValue)) {
        setFormData((prev) => ({
          ...prev,
          mentions: [...prev.mentions, trimmedValue],
          mentionInput: "",
        }));
      }
    }
  };

  const handleMentionInputBlur = () => {
    const trimmedValue = formData.mentionInput.trim().replace(/^@+/, "");
    if (trimmedValue && !formData.mentions.includes(trimmedValue)) {
      setFormData((prev) => ({
        ...prev,
        mentions: [...prev.mentions, trimmedValue],
        mentionInput: "",
      }));
    }
  };

  const removeMention = (mentionToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      mentions: prev.mentions.filter((mention) => mention !== mentionToRemove),
    }));
  };

  const removeMediaFile = (index: number) => {
    const file = mediaFiles[index];

    if (file.name.startsWith("existing-media-")) {
      const existingIndex = parseInt(file.name.split("-")[2]);
      setExistingMediaIds((prev) => prev.filter((_, i) => i !== existingIndex));
    }

    if (!file.name.startsWith("existing-media-")) {
      URL.revokeObjectURL(mediaUrls[index]);
    }

    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
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
      const newMediaIds = await uploadMediaToStorage();

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
        links: formData.links,
        mentions: formData.mentions,
        mediaIds: allMediaIds,
        authorBio: formData.authorBio || undefined,
        enableNotifications: formData.enableNotifications,
        notificationTime: formData.notificationTime,
        reminderHours: formData.reminderHours,
      };

      if (noteId === "new") {
        await createPost(postData);
        toast.success("Note created!");
      } else if (noteId) {
        await updatePost({ id: noteId as Id<"notes">, ...postData });
        toast.success("Note updated!");
      }

      onClose();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Error saving note");
    }
  };

  const handleDelete = async () => {
    if (!noteId || noteId === "new") return;

    if (
      !confirm(
        "Are you sure you want to delete this note? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deletePost({ id: noteId as Id<"notes"> });
      toast.success("Note deleted successfully!");
      onClose();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
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
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-neutral-300">
      <div className="sticky top-0 flex flex-col border-b border-neutral-900 bg-black/90 px-4 py-3 backdrop-blur-xl sm:grid sm:grid-cols-3 sm:items-center">
        <div className="flex items-center justify-between sm:hidden">
          <button
            onClick={onClose}
            className="transition hover:text-neutral-500"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">
            {noteId === "new" ? "New Note" : "Edit Note"}
          </h2>
        </div>

        <div className="hidden items-center sm:flex">
          <button
            onClick={onClose}
            className="transition hover:text-neutral-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="hidden justify-center sm:flex">
          <h2 className="text-lg font-semibold">
            {noteId === "new" ? "New Note" : "Edit Note"}
          </h2>
        </div>

        <div className="mt-3 flex items-center justify-end space-x-2 sm:mt-0">
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
          {noteId !== "new" && (
            <button
              onClick={handleDelete}
              className="flex h-10 items-center space-x-1 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 sm:space-x-2 sm:px-3 sm:text-base"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1000px] space-y-6 p-4">
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

        <div>
          <label className="mb-2 block text-sm font-medium">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange("content", e.target.value)}
            maxLength={platformFields?.maxContentLength || 5000}
            rows={6}
            className="w-full resize-none rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="Write your note content..."
          />
          {platformFields && (
            <div className="mt-1 text-right text-xs text-neutral-400">
              {formData.content.length}/{platformFields.maxContentLength}
            </div>
          )}
        </div>

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

        {renderPlatformSpecificFields()}

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

        <div>
          <label className="mb-2 flex items-center space-x-2 text-sm font-medium">
            <Link className="h-4 w-4" />
            <span>Links</span>
          </label>
          <input
            type="text"
            value={formData.linkInput}
            onChange={(e) => handleLinkInputChange(e.target.value)}
            onKeyDown={handleLinkInputKeyDown}
            onBlur={handleLinkInputBlur}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com or example.com"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.links.map((link, index) => (
              <div
                key={index}
                className="group relative flex cursor-pointer items-center rounded-md bg-neutral-950 px-3 py-1.5 text-sm transition-colors hover:bg-neutral-700"
                onClick={() => removeLink(link)}
              >
                {link}
                <span className="ml-2 text-neutral-400 transition-colors group-hover:text-neutral-200">
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center space-x-2 text-sm font-medium">
            <AtSign className="h-4 w-4" />
            <span>Mentions</span>
          </label>
          <input
            type="text"
            value={formData.mentionInput}
            onChange={(e) => handleMentionInputChange(e.target.value)}
            onKeyDown={handleMentionInputKeyDown}
            onBlur={handleMentionInputBlur}
            className="w-full rounded-lg border border-gray-300 bg-neutral-300 px-3 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="@username"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.mentions.map((mention, index) => (
              <div
                key={index}
                className="group relative flex cursor-pointer items-center rounded-md bg-neutral-950 px-3 py-1.5 text-sm transition-colors hover:bg-neutral-700"
                onClick={() => removeMention(mention)}
              >
                @{mention}
                <span className="ml-2 text-neutral-400 transition-colors group-hover:text-neutral-200">
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>

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
