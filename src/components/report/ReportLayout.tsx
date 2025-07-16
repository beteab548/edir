import Image from "next/image";
import CurrentTime from "../ui/currentTime";

interface ReportLayoutProps {
  children: React.ReactNode;
  title?: string;
  searchParams: {
    from?: string;
    to?: string;
  };
}

export default function ReportLayout({
  children,
  title,
  searchParams,
}: ReportLayoutProps) {
  const from = searchParams?.from || "N/A";
  const to = searchParams?.to || "N/A";

  return (
    <div className="bg-white p-4 border rounded-md w-full" id="report-content">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Image src="/edirlogo.jpg" alt="Logo" width={50} height={50} />
        </div>
        <div className="text-center flex flex-col gap-1">
          <h3 className="text-xl font-semibold">
            {title || "Members Info Table"}
          </h3>
          <div className="text-sm text-gray-500">
            From: {from} | To: {to}
          </div>
        </div>
        <span className="text-sm text-gray-500">
          <CurrentTime />
        </span>
      </div>

      {children}
    </div>
  );
}
