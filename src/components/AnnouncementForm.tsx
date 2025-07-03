import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

// Define TypeScript interface based on your Prisma model
interface Announcement {
  id?: number;
  title: string;
  Description: string;
  created_at?: Date;
  calendar: Date;
}

// Define validation schema with Zod
const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  Description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  calendar: z.date(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementFormProps {
  onSubmit: (data: Announcement) => void;
  initialData?: Announcement;
}

export function AnnouncementForm({ onSubmit, initialData }: AnnouncementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultValues = initialData || {
    title: '',
    Description: '',
    calendar: new Date(),
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues,
  });

  const calendarValue = watch('calendar');

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('calendar', new Date(e.target.value), { shouldValidate: true });
  };

  const processSubmit = async (data: AnnouncementFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        created_at: initialData?.created_at || new Date(),
        id: initialData?.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.title ? 'border-red-500' : 'border'
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="Description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="Description"
          rows={4}
          {...register('Description')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.Description ? 'border-red-500' : 'border'
          }`}
        />
        {errors.Description && (
          <p className="mt-1 text-sm text-red-600">{errors.Description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="calendar" className="block text-sm font-medium text-gray-700">
          Calendar Date
        </label>
        <input
          id="calendar"
          type="datetime-local"
          value={format(calendarValue, "yyyy-MM-dd'T'HH:mm")}
          onChange={handleCalendarChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.calendar ? 'border-red-500' : 'border'
          }`}
        />
        {errors.calendar && (
          <p className="mt-1 text-sm text-red-600">{errors.calendar.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}