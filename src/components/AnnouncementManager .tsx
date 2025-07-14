"use client";

import useSWR from "swr";
import { useState, useTransition } from "react";
import AnnouncementForm from "./AnnouncementForm";
import { AnnouncementList } from "./AnnouncementsList";
import { Announcements } from "@prisma/client";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/actions";
import { FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
// lib/fetcher.ts
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
};

export function AnnouncementManager() {
  const {
    data: announcements,
    error,
    isLoading,
    mutate,
  } = useSWR<Announcements[]>("/api/announcements", fetcher);
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<Announcements | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleSubmit = async (data: Announcements) => {
    startTransition(async () => {
      try {
        if (currentAnnouncement?.id) {
          await updateAnnouncement(currentAnnouncement.id, {
            title: data.title,
            Description: data.Description,
            calendar: data.calendar,
          });
          toast.success("Announcement updated successfully!");
        } else {
          await createAnnouncement({
            title: data.title,
            Description: data.Description,
            calendar: data.calendar,
            created_at: data.created_at,
          });
          toast.success("Announcement created successfully!");
        }
        await mutate();
        setCurrentAnnouncement(null);
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to submit announcement:", error);
        toast.error("Failed to save announcement.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      try {
        await deleteAnnouncement(id);
        await mutate();
        toast.success("Announcement deleted.");
      } catch (error) {
        console.error("Failed to delete announcement:", error);
        toast.error("Failed to delete announcement.");
      }
    });
  };

  const handleCreateNew = () => {
    setCurrentAnnouncement({
      id: 0,
      title: "",
      Description: "",
      created_at: new Date(),
      calendar: new Date(),
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-6">
        Failed to load announcements.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Announcements Management
          </h1>
          <p className="text-gray-500 text-sm">
            {announcements?.length ?? 0} announcement
            {(announcements?.length ?? 0) !== 1 ? "s" : ""} in total
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={isPending}
          className="inline-flex items-center px-2 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlus className="w-5 h-5 mr-1" />
          Add New Announcement
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Current Announcements
          </h2>
          {announcements && announcements.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                No announcements yet. Create your first one!
              </p>
            </div>
          ) : (
            <AnnouncementList
              announcements={announcements!}
              onEdit={(announcement) => {
                setCurrentAnnouncement(announcement);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>

      <AnnouncementForm
        onSubmit={handleSubmit}
        initialData={currentAnnouncement || undefined}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentAnnouncement(null);
        }}
        title={
          currentAnnouncement?.id ? "Edit Announcement" : "Create Announcement"
        }
      />
    </div>
  );
}
