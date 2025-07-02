import { DataChangeProvider } from "@/components/DataChangeContext";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import "react-phone-number-input/style.css";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DataChangeProvider>
      <div className="h-screen flex">
        {/* LEFT */}
        <div className="w-[20%] md:w-[20%] lg:w-[16%] xl:w-[14%] p-2 ">
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start gap-2"
          >
            <Image
              src="/edirlogo.jpg"
              alt="logo"
              width={42}
              height={42}
              className="mb-6"
            />
            <span className="hidden lg:block font-bold">Edir</span>
          </Link>
          <Menu />
        </div>
        {/* RIGHT */}
        <div className="w-[80%] md:w-[80%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
          <Navbar />
          {children}
        </div>
      </div>
    </DataChangeProvider>
  );
}
