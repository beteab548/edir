"use client";
import { useEffect, useState } from "react";
import ContributionTab from "../../../components/contribution/contributionPage";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
// import { ArrowPathIcon } from "react-icons/fi";  // Correct import path
import AddNewPenaltyType from "@/components/AddNewPenaltyType";
import { useRouter } from "next/navigation";
import AuditLog from "@/components/audit-logs";

type Tab =
  | "contribution"
  | "Audit Logs"
  | "configurePenalty";

interface TabData {
  id: Tab;
  label: string;
  component: JSX.Element;
}

export default function ContributionTabs() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("Audit Logs"); // Set default tab to "Audit Logs"
  const [error, setError] = useState<{ message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const userId = user?.id;
  console.log("user ID:", userId);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const role = user?.publicMetadata?.role;
    if (role !== "chairman" && role !== "admin" && role !== "secretary") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isClient) {
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="w-[900px] flex flex-col mx-auto p-10 space-y-4 ">
        <div className=" w-full items-center ">
          <Skeleton className="h-10 " />
        </div>
        <div className="flex space-x-8 justify-center">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isSignedIn) {
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Unable to load user information.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const role = user.publicMetadata?.role as string;
  const isChairman = role === "chairman" || role === "admin";

  if (role !== "secretary" && !isChairman) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <Alert>
          <LockClosedIcon className="h-5 w-5" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only committee chairpersons and secretaries can access this section.
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
              {/* <ArrowPathIcon className="h-4 w-4 mr-2" /> */}
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
console.log("role is",role);
  let filteredTabs: TabData[];

  if (role === "secretary") {
    filteredTabs = [
      {
        id: "Audit Logs",
        label: "Audit Logs",
        component: <AuditLog userId={userId!} userRole={role} />,
      },
    ];
  } else {
    filteredTabs = [
      {
        id: "Audit Logs",
        label: "Audit Logs",
        component: <AuditLog userId={userId!} userRole={role}/>,
      },
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
    ];
  }

  return (
    <div className="mt-1 bg-gray-50 rounded-xl p-8">
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          View and manage contribution details
        </h2>
      </div>
      <div className="border-b">
        <nav className="-mb-px flex space-x-8 justify-center">
          {filteredTabs.map((tab) => (
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

      <div className="mt-2 p-4 rounded-lg min-h-[200px] transition-all duration-300">
        {filteredTabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}