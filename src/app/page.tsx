"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Announcements } from "@prisma/client";
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
const smoothScroll = (
  e: React.MouseEvent<HTMLAnchorElement>,
  targetId: string
) => {
  e.preventDefault();
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: "smooth",
    });
  }
};
export default function PublicPage() {
  const [announcements, setAnnouncements] = useState<Announcements[]>([]);
  const [activeTab, setActiveTab] = useState("announcements");
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<
    Set<string>
  >(new Set());
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const toggleExpand = (id: string) => {
    setExpandedAnnouncements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  useEffect(() => {
    async function fetchData() {
      setIsLoadingAnnouncements(true);
      const res = await fetch("/api/announcements");
      const data = await res.json();
      console.log("data", data);
      setAnnouncements(data);
      setIsLoadingAnnouncements(false);
    }
    fetchData();
  }, []);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  useEffect(() => {
    const role = user?.publicMetadata.role;
    console.log("role", role);
    if (role) {
      setIsAuthenticating(true);
      switch (role) {
        case "secretary":
          router.push("/dashboard");
          break;
        case "chairman":
          router.push("/dashboard");
          break;
        default:
          router.push("/unauthoried");
          break;
      }
    }
  }, [user, router]);

  const handleLoginClick = () => {
    const role = user?.publicMetadata.role;
    if (!role) {
      setIsAuthenticating(true);
      return router.push("/sign-in");
    }
    setIsAuthenticating(true);
    switch (role) {
      case "secretary":
        router.push("/dashboard");
        break;
      case "chairman":
        router.push("/dashboard");
        break;
      default:
        router.push("/unauthoried");
        break;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Navigation */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-blue-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h1 className="text-2xl font-bold">
                Jemo Edir<span className="text-blue-300">Community</span>
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                href="#about"
                onClick={(e) => smoothScroll(e, "about")}
                className="text-blue-100 hover:text-white font-medium"
              >
                About
              </a>
              <a
                href="#announcements"
                onClick={(e) => smoothScroll(e, "announcements")}
                className="text-blue-100 hover:text-white font-medium"
              >
                Announcements
              </a>
              <a
                href="#contact"
                onClick={(e) => smoothScroll(e, "contact")}
                className="text-blue-100 hover:text-white font-medium"
              >
                Contact
              </a>
            </nav>
            <button
              disabled={isAuthenticating}
              onClick={handleLoginClick}
              className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center min-w-[80px]"
            >
              {isAuthenticating ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Together We Support
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            A compassionate community providing financial and emotional support
            during life's most challenging moments.
          </p>
          <div className="mt-10">
            <button className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg mr-4">
              Join Our Community
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-700 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About Section */}
        <section id="about" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our Mission & Values
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">
                Mutual Support
              </h3>
              <p className="text-gray-600 text-center">
                We provide financial assistance and emotional support to members
                during times of bereavement and hardship.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">
                Financial Security
              </h3>
              <p className="text-gray-600 text-center">
                Our collective contributions create a safety net that ensures
                dignified support when it's needed most.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">
                Community
              </h3>
              <p className="text-gray-600 text-center">
                We foster strong social bonds through regular meetings, cultural
                events, and shared traditions.
              </p>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <div className="mb-20">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("announcements")}
              className={`py-4 px-6 font-medium text-lg ${
                activeTab === "announcements"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab("bylaws")}
              className={`py-4 px-6 font-medium text-lg ${
                activeTab === "bylaws"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Bylaws & Documents
            </button>
          </div>

          <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-lg">
            {activeTab === "announcements" && (
              <div id="announcements">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingAnnouncements
                    ? Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-xl overflow-hidden animate-pulse"
                        >
                          <div className="bg-blue-100 h-12" />
                          <div className="p-5 space-y-3">
                            <div className="h-4 bg-gray-300 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-full" />
                            <div className="h-3 bg-gray-200 rounded w-5/6" />
                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                          </div>
                        </div>
                      ))
                    : announcements.map((a) => (
                        <div
                          key={a.id}
                          className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="bg-blue-600 px-4 py-3">
                            <h3 className="font-semibold text-white text-lg">
                              {a.title}
                            </h3>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {new Date(a.calendar).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </div>
                            <p className="text-gray-700">
                              {expandedAnnouncements.has(a.id.toString())
                                ? a.Description
                                : `${a.Description.substring(0, 100)}${
                                    a.Description.length > 100 ? "..." : ""
                                  }`}
                            </p>
                            {a.Description.length > 100 && (
                              <button
                                onClick={() => toggleExpand(a.id.toString())}
                                className="mt-4 text-blue-600 hover:text-blue-800 font-medium flex items-center"
                              >
                                {expandedAnnouncements.has(a.id.toString())
                                  ? "Read less"
                                  : "Read more"}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 ml-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={
                                      expandedAnnouncements.has(a.id.toString())
                                        ? "M19 12H5"
                                        : "M9 5l7 7-7 7"
                                    }
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}

            {activeTab === "bylaws" && (
              <div id="bylaws" className="p-4">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold mb-4">
                      Our Governing Documents
                    </h3>
                    <p className="text-gray-700 mb-6">
                      Our bylaws define how we operate — membership rules,
                      contribution types, penalties, and more. These documents
                      ensure transparency and fairness in all our operations.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-blue-600 mt-1 mr-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Edir Bylaws - 2025 Edition
                          </h4>
                          <p className="text-sm text-gray-500">
                            Updated January 2025
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-blue-600 mt-1 mr-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Membership Agreement
                          </h4>
                          <p className="text-sm text-gray-500">
                            Required for all new members
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/3 bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-blue-800">
                      Download Documents
                    </h4>
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 mb-3">
                      <span className="text-blue-700 font-medium">
                        Bylaws (PDF)
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50">
                      <span className="text-blue-700 font-medium">
                        Membership Form (PDF)
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-xl p-8 mb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Our Community by the Numbers
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">200+</div>
                <div className="text-blue-100">Active Members</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10+</div>
                <div className="text-blue-100">Years of Service</div>
              </div>
            </div>
          </div>
        </section>
        {/* Contact Section */}
        <section id="contact" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Get In Touch
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold mb-6">
                Contact Information
              </h3>
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Email</h4>
                    <a
                      href="mailto:edir@example.com"
                      className="text-blue-600 hover:underline"
                    >
                      edir@example.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Phone</h4>
                    <a
                      href="tel:+251912345678"
                      className="text-blue-600 hover:underline"
                    >
                      +251 91 234 5678
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Address</h4>
                    <p className="text-gray-600">
                      123 Community Street, Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold mb-6">Send Us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="text-xl font-bold">
                  Edir<span className="text-blue-400">Community</span>
                </h3>
              </div>
              <p className="text-gray-400">
                Supporting our members through life's challenges since 2000.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#announcements"
                    className="text-gray-400 hover:text-white"
                  >
                    Announcements
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Documents</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#about"
                    onClick={(e) => smoothScroll(e, "about")}
                    className="text-gray-400 hover:text-white"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#announcements"
                    onClick={(e) => smoothScroll(e, "announcements")}
                    className="text-gray-400 hover:text-white"
                  >
                    Announcements
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => smoothScroll(e, "contact")}
                    className="text-gray-400 hover:text-white"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>
              © {new Date().getFullYear()} EdirCommunity. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
