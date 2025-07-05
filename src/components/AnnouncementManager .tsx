"use client";

import { useState, useTransition } from "react";
import AnnouncementForm from "./AnnouncementForm";
import { AnnouncementList } from "./AnnouncementsList";
import { Announcements } from "@prisma/client";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/actions";

export function AnnouncementManager({
  initialAnnouncements,
}: {
  initialAnnouncements: Announcements[];
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<Announcements | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const refresh = async () => {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(data);
  };

  const handleSubmit = async (data: Announcements) => {
    startTransition(async () => {
      if (currentAnnouncement?.id) {
        await updateAnnouncement(currentAnnouncement.id, {
          title: data.title,
          Description: data.Description,
          calendar: data.calendar,
        });
      } else {
        await createAnnouncement({
          title: data.title,
          Description: data.Description,
          calendar: data.calendar,
          created_at: data.created_at,
        });
      }
      await refresh();
      setCurrentAnnouncement(null);
    });
  };

  const handleEdit = (announcement: Announcements) => {
    setCurrentAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      await deleteAnnouncement(id);
      await refresh();
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Announcements Management
      </h1>

      <div className="mb-8 flex items-end justify-end">
        <button
          onClick={() => {
            setCurrentAnnouncement({
              id: 0,
              title: "",
              Description: "",
              created_at: new Date(),
              calendar: new Date(),
            });
            setIsModalOpen(true);
          }}
          className="inline-flex  px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add New Announcement
        </button>
      </div>

      {currentAnnouncement !== null && (
        <AnnouncementForm
          onSubmit={handleSubmit}
          initialData={currentAnnouncement || undefined}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            currentAnnouncement?.id
              ? "Edit Announcement"
              : "Create Announcement"
          }
        />
      )}
      <div>
        <h2 className="text-lg font-medium mb-4">Current Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-gray-500">No announcements yet. Create one!</p>
        ) : (
          <AnnouncementList
            announcements={announcements}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
