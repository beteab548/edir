"use client";

import { useEffect, useState } from "react";

type Announcement = {
  id: number;
  title: string;
  date: string;
  content: string;
};

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Monthly Meeting This Sunday",
    date: "2025-06-25",
    content: "We'll be discussing new members and updates to the penalty policy.",
  },
  {
    id: 2,
    title: "New Contribution Rules",
    date: "2025-06-10",
    content: "Open-ended recurring contributions are now in effect. Check the bylaws.",
  },
];

export default function PublicPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Replace with API call later
    setAnnouncements(mockAnnouncements);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 rounded-xl shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Our Edir</h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          A community built on compassion, support, and responsibility.
        </p>
      </section>

      {/* Mission Section */}
      <section className="bg-white p-8 rounded-xl shadow-md">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Mission & Purpose</h2>
        </div>
        <p className="text-gray-700 leading-relaxed text-lg">
          Our Edir exists to support members during times of grief, provide a safety net in difficult times,
          and foster strong community ties. Every member contributes monthly to ensure we're ready when support is needed.
        </p>
      </section>

      {/* Bylaws Section */}
      <section className="bg-white p-8 rounded-xl shadow-md">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Bylaws</h2>
        </div>
        <p className="text-gray-700 text-lg mb-4">
          Our bylaws define how we operate — membership rules, contribution types, penalties, and more.
        </p>
        <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Bylaws (PDF)
        </button>
      </section>

      {/* Announcements Section */}
      <section className="bg-white p-8 rounded-xl shadow-md">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Announcements</h2>
        </div>
        <div className="space-y-6">
          {announcements.map((a) => (
            <div key={a.id} className="p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-xl text-blue-700">{a.title}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {new Date(a.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-gray-700">{a.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Resources Section */}
      <section className="bg-white p-8 rounded-xl shadow-md">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Resources</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
            <a href="/documents/contribution-calendar.pdf" className="flex items-center" download>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-blue-600 hover:underline font-medium">Contribution Calendar (PDF)</span>
            </a>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
            <a href="/documents/meeting-notes-june.pdf" className="flex items-center" download>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-blue-600 hover:underline font-medium">Last Meeting Notes – June 2025</span>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-white p-8 rounded-xl shadow-md">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
        </div>
        <p className="text-gray-700 text-lg mb-4">Got a question? Reach out to our leadership team:</p>
        <div className="space-y-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href="mailto:edir@example.com" className="text-blue-600 hover:underline">edir@example.com</a>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-gray-800">+251 91 234 5678</span>
          </div>
        </div>
      </section>
    </div>
  );
}