import { useState } from 'react';
import { Announcements } from '@prisma/client';
import { format } from 'date-fns';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  announcementTitle: string;
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  announcementTitle,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
        <p className="mt-2 text-gray-600">
          Are you sure you want to delete the announcement "{announcementTitle}"? This action cannot
          be undone.
        </p>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface AnnouncementListProps {
  announcements: Announcements[];
  onEdit: (announcement: Announcements) => void;
  onDelete: (id: number) => void;
}

export function AnnouncementList({ announcements, onEdit, onDelete }: AnnouncementListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const handleDeleteClick = (announcement: Announcements) => {
    setAnnouncementToDelete({
      id: announcement.id!,
      title: announcement.title,
    });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (announcementToDelete) {
      onDelete(announcementToDelete.id);
      setDeleteModalOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setAnnouncementToDelete(null);
  };

  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{announcement.Description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <span>Created: {format(new Date(announcement.created_at!), 'PPpp')}</span>
                    <span className="ml-4">
                      Calendar: {format(new Date(announcement.calendar), 'PPpp')}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(announcement)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(announcement)}
                    className="text-sm font-medium text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        announcementTitle={announcementToDelete?.title || ''}
      />
    </>
  );
}