import Image from "next/image";
import CurrentTime from "../ui/currentTime";
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  isSameDay,
  format,
  isValid,
} from "date-fns";

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
  const fromStr = searchParams?.from;
  const toStr = searchParams?.to;

  let displayRange = "From: N/A | To: N/A";

  if (fromStr && toStr) {
    const fromDate = parseISO(fromStr);
    const toDate = parseISO(toStr);

    if (isValid(fromDate) && isValid(toDate)) {
      const expectedStart = startOfMonth(fromDate);
      const expectedEnd = endOfMonth(fromDate);

      const isWholeMonth =
        isSameDay(fromDate, expectedStart) && isSameDay(toDate, expectedEnd);

      if (isWholeMonth) {
        displayRange = format(fromDate, "MMMM yyyy"); 
      } else {
        displayRange = `From: ${format(fromDate, "yyyy-MM-dd")} | To: ${format(
          toDate,
          "yyyy-MM-dd"
        )}`;
      }
    }
  }

  return (
    <div className="bg-white p-4 border rounded-md w-full" id="report-content">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Image src="/edirlogo2.jpg" alt="Logo" width={50} height={50} />
        </div>
        <div className="text-center flex flex-col gap-1">
          <h3 className="text-xl font-semibold">
            {title || "Members Info Table"}
          </h3>
          <div className="text-sm text-gray-500">{displayRange}</div>
        </div>
        <span className="text-sm text-gray-500">
          <CurrentTime />
        </span>
      </div>

      {children}
    </div>
  );
}
