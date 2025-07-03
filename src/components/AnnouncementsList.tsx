import { Announcements } from '@prisma/client';
import { format } from 'date-fns';

interface AnnouncementListProps {
  announcements: Announcements[];
  onEdit: (announcement: Announcements) => void;
  onDelete: (id: number) => void;
}

export function AnnouncementList({ announcements, onEdit, onDelete }: AnnouncementListProps) {
  return (
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
                  onClick={() => onDelete(announcement.id!)}
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
  );
}