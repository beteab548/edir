"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { translations } from "./translation";
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
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
  const [activeTab, setActiveTab] = useState("bylaws");

  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [metrics, setMetrics] = useState<{
    members: number;
    activeSince: Date;
  }>({ members: 0, activeSince: new Date() });
  const [language, setLanguage] = useState<"en" | "am">("en");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "am" : "en"));
  };

  const t = translations[language];

  useEffect(() => {
    async function fetchData() {
      setIsLoadingAnnouncements(true);

      try {
        const [MetricsRes] = await Promise.all([
          fetch("/api/landingpage", {
            cache: "no-store",
            next: { revalidate: 0 },
          }),
        ]);
        const MetricsData = await MetricsRes.json();
        console.log("MetricsRes", MetricsData);
        setMetrics(MetricsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingAnnouncements(false);
      }
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
    <div className="min-h-screen bg-gray-50" dir="ltr">
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
              <h1 className="text-2xl font-bold">{t.logoText}</h1>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <a
                href="#about"
                onClick={(e) => smoothScroll(e, "about")}
                className="text-blue-100 hover:text-white font-medium"
              >
                {t.nav.about}
              </a>

              <button
                onClick={toggleLanguage}
                className="text-blue-100 hover:text-white font-medium px-2 py-1 border border-blue-100 rounded"
              >
                {language === "en" ? "አማ" : "EN"}
              </button>
            </nav>
            <button
              disabled={isAuthenticating}
              onClick={handleLoginClick}
              className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center min-w-[80px]"
            >
              {isAuthenticating ? (
                <>
                  <Spinner />
                  {t.nav.redirect}
                </>
              ) : (
                t.nav.login
              )}
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </p>
          <div className="mt-10">
            <a href="#about" onClick={(e) => smoothScroll(e, "about")}>
              <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-700 transition-colors">
                {t.hero.learn}
              </button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section id="about" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {t.about.title}
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
                {t.about.mutualSupport}
              </h3>
              <p className="text-gray-600 text-center">
                {t.about.mutualSupportDesc}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">
                {t.about.financialSecurity}
              </h3>
              <p className="text-gray-600 text-center">
                {t.about.financialSecurityDesc}
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
                {t.about.community}
              </h3>
              <p className="text-gray-600 text-center">
                {t.about.communityDesc}
              </p>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <div className="mb-20" id="bylaws">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("bylaws")}
              className={`py-4 px-6 font-medium text-lg ${
                activeTab === "bylaws"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.bylaws}
            </button>
          </div>

          <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-lg">
            {activeTab === "bylaws" && (
              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold mb-4">
                      {t.governingDocs}
                    </h3>
                    <p className="text-gray-700 mb-6">{t.governingDesc}</p>
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
                            {t.bylawsTitle}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/3 bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-blue-800">
                      {t.download}
                    </h4>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 mb-3"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href =
                          "/documents/ጀም_ለቡ_02_ሊዝ_መንደር_ዕድር_መተዳደሪያ_ደንብ_July_6_2025.pdf";
                        link.download = "Jemo-Edir-Bylaws-2025.pdf";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <span className="text-blue-700 font-medium">
                        {t.bylaws} (PDF)
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
              {t.stats.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">{metrics.members}</div>
                <div className="text-blue-100">{t.stats.members}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">
                  {new Date().getFullYear() -
                    new Date(metrics.activeSince).getFullYear()}
                </div>
                <div className="text-blue-100">{t.stats.years} </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-14">
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
              <p className="text-gray-400">{t.footer.description}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">
                {t.footer.quickLinks}
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#about"   onClick={(e) => smoothScroll(e, "about")} className="text-gray-400 hover:text-white">
                    {t.nav.about}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">
                {t.footer.documents}
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#about"
                    onClick={(e) => smoothScroll(e, "bylaws")}
                    className="text-gray-400 hover:text-white"
                  >
                    Bylaws
                  </a>
                </li>

                <li></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>
              {t.footer.copyright.replace(
                "{year}",
                new Date().getFullYear().toString()
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
