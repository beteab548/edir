import { useState } from "react";
import { AnnouncementForm } from "./AnnouncementForm";
import { AnnouncementList } from "./AnnouncementsList";
import { Announcements } from "@prisma/client";

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcements[]>([]);
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<Announcements | null>(null);

  const handleSubmit = async (data: Announcements) => {
    if (currentAnnouncement && currentAnnouncement.id) {
      // Update existing announcement
      setAnnouncements(
        announcements.map((ann) =>
          ann.id === currentAnnouncement.id
            ? { ...data, id: currentAnnouncement.id }
            : ann
        )
      );
    } else {
      // Add new announcement
      const newAnnouncement = {
        ...data,
        id:
          announcements.length > 0
            ? Math.max(...announcements.map((a) => a.id!)) + 1
            : 1,
        created_at: new Date(),
      };
      setAnnouncements([...announcements, newAnnouncement]);
    }
    setCurrentAnnouncement(null);
  };

  const handleEdit = (announcement: Announcements) => {
    setCurrentAnnouncement(announcement);
  };

  const handleDelete = (id: number) => {
    setAnnouncements(announcements.filter((ann) => ann.id !== id));
  };

  const handleCancel = () => {
    setCurrentAnnouncement(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Announcements Management
      </h1>

      <div className="mb-8">
        <button
          onClick={() =>
            setCurrentAnnouncement({
              id:
                announcements.length > 0
                  ? Math.max(...announcements.map((a) => a.id!)) + 1
                  : 1,
              title: "",
              Description: "",
              created_at: new Date(),
              calendar: new Date(),
            })
          }
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Announcement
        </button>
      </div>

      {currentAnnouncement && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-medium mb-4">
            {currentAnnouncement.id
              ? "Edit Announcement"
              : "Create Announcement"}
          </h2>
          <AnnouncementForm
            onSubmit={handleSubmit}
            initialData={currentAnnouncement}
          />
          <button
            onClick={handleCancel}
            className="mt-4 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
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
