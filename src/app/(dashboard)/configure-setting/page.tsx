"use client";
import { useEffect, useState } from "react";
import ContributionTab from "../../../components/contribution/contributionPage";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import AddNewPenaltyType from "@/components/AddNewPenaltyType";
import { AnnouncementManager } from "@/components/AnnouncementManager ";
import { Announcements } from "@prisma/client";
import { useRouter } from "next/navigation";

type Tab =
  | "contribution"
  | "contributionPenalty"
  | "Announcements Manager"
  | "configurePenalty";

interface TabData {
  id: Tab;
  label: string;
  component: JSX.Element;
}

export default async function ContributionTabs() {
   const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return; 

    if (!isSignedIn) {
     return router.push("/sign-in");
    } else {
      const role = user?.publicMetadata?.role;
      if (role !== "chairman") {
      return  router.push("/dashboard");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded || !isSignedIn || user?.publicMetadata?.role !== "chairman") {
    return null;
  }
  const [activeTab, setActiveTab] = useState<Tab>("contribution");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [Announcements, setAnnouncements] = useState<Announcements[]>([]);
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/announcements");
        const data = await res.json();
        setAnnouncements(data);
        if (!res.ok) throw new Error("Failed to fetch data");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError({ message: err.message });
        } else {
          setError({
            message: "An unknown error occurred while fetching data.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [retryCount]);

  if (!isLoaded) {
    return (
      <div className="w-[900px] flex flex-col mx-auto p-10 space-y-4 ">
        <div className=" w-full items-center ">
          <Skeleton className="h-10 " />
        </div>
        <div className="flex space-x-8 justify-center">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to sign in to access this section.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  const role = user.publicMetadata.role as string;
  const isChairman = role && role.includes("chairman");
  if (!isChairman) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <Alert>
          <LockClosedIcon className="h-5 w-5" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only committee chairpersons can access this section.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {error.message}
            <button
              onClick={() => setRetryCount(retryCount + 1)}
              className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-[1000px] flex flex-col mx-auto p-10 space-y-4">
        <div className=" w-full items-center ">
          <Skeleton className="h-10 " />
        </div>
        <div className="flex space-x-8 justify-center">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const allTabs: TabData[] = [
    {
      id: "contribution",
      label: "Configure Contribution",
      component: <ContributionTab />,
    },

    {
      id: "configurePenalty",
      label: "Configure Penalty",
      component: <AddNewPenaltyType />,
    },
    {
      id: "Announcements Manager",
      label: "Announcements Manager",
      component: <AnnouncementManager initialAnnouncements={Announcements} />,
    },
  ];

  return (
    <div className=" mt-1 bg-gray-50 rounded-xl  p-8">
      <div className=" flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 ">
          View and manage contribution details
        </h2>
      </div>

      <div className="border-b ">
        <nav className="-mb-px flex space-x-8 justify-center">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-2 p-4  rounded-lg min-h-[200px] transition-all duration-300">
        {allTabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}
