"use client";

import { Calendar as CalendarIcon, Lightbulb } from "lucide-react";
import { useState } from "react";
import { PlatformIcon } from "./PlatformIcons";
import { PlatformSwiper } from "./PlatformSwiper";
import { Note, Platform } from "@/types";

interface CalendarProps {
  notes: Note[];
  selectedPlatform: "instagram" | "X" | "youtube" | "telegram" | null;
  onEditNote: (noteId: string) => void;
  onPlatformChange?: (platform: Platform | null) => void;
}

export function Calendar({
  notes,
  selectedPlatform,
  onEditNote,
  onPlatformChange,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const platformColors = {
    instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
    X: "bg-gradient-to-r from-blue-400 to-blue-600",
    youtube: "bg-gradient-to-r from-red-500 to-red-600",
    telegram: "bg-gradient-to-r from-cyan-400 to-cyan-600",
  };

  const scheduledNotes = notes.filter(
    (note) =>
      note.scheduledDate &&
      (selectedPlatform ? note.platform === selectedPlatform : true),
  );

  const unscheduledNotes = notes.filter(
    (note) =>
      !note.scheduledDate &&
      note.status === "idea" &&
      (selectedPlatform ? note.platform === selectedPlatform : true),
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getNotesForDate = (date: Date) => {
    return scheduledNotes.filter((note) => {
      if (!note.scheduledDate) return false;
      const noteDate = new Date(note.scheduledDate);
      return (
        noteDate.getDate() === date.getDate() &&
        noteDate.getMonth() === date.getMonth() &&
        noteDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isIdeaStatus = (status: string) => {
    return status === "idea" || status === "draft";
  };

  return (
    <div>
      {onPlatformChange && (
        <div className="mx-auto mb-4 w-full max-w-[1000px] border-b border-neutral-900 py-3">
          <PlatformSwiper
            selectedPlatform={selectedPlatform}
            onPlatformSelect={onPlatformChange}
          />
        </div>
      )}

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex w-full items-center justify-between space-x-4">
            <h2 className="text-2xl font-bold text-neutral-100">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth("prev")}
                className="rounded-lg bg-gray-100 p-2 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                onClick={() => navigateMonth("next")}
                className="rounded-lg bg-gray-100 p-2 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6 rotate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-900 bg-black">
          <div className="grid grid-cols-7 border-b border-neutral-900 bg-neutral-950">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-medium text-neutral-200"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {getDaysInMonth(currentDate).map((date, index) => (
              <div
                key={index}
                className="min-h-32 border-b border-r border-neutral-900 p-2"
              >
                {date && (
                  <>
                    <div className="mb-2 text-sm font-medium text-neutral-100">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {getNotesForDate(date).map((note) => (
                        <div
                          key={note._id}
                          onClick={() => onEditNote(note._id)}
                          className={`${platformColors[note.platform]} cursor-pointer rounded p-1 text-xs text-white transition-opacity hover:opacity-80`}
                        >
                          <div className="flex items-center space-x-1">
                            <PlatformIcon
                              platform={note.platform}
                              size={16}
                              className="text-current"
                            />
                            <span className="truncate">
                              {note.title || "Untitled"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        {unscheduledNotes.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-neutral-100">
              Unscheduled Notes
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unscheduledNotes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => onEditNote(note._id)}
                  className="cursor-pointer rounded-lg border border-neutral-900 bg-black p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-center space-x-2">
                    <div
                      className={`h-6 w-6 rounded-full ${platformColors[note.platform]} flex items-center justify-center text-xs text-white`}
                    >
                      <PlatformIcon
                        platform={note.platform}
                        size={14}
                        className="text-white"
                      />
                    </div>
                    <span className="text-sm font-medium text-neutral-100">
                      {note.title || "Untitled"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {note.content}
                  </p>
                  <div className="mt-2 text-xs text-neutral-200">
                    {isIdeaStatus(note.status) ? (
                      <div className="flex items-center space-x-1">
                        <Lightbulb className="h-3 w-3" />
                        <span>Idea</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Schedule</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
