import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ui/ClientOnly";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex " >
      {/* LEFT - Sidebar */}
      <div className="w-[20%] md:w-[20%] lg:w-[18%] xl:w-[18%] p-2 bg-white shadow-sm">
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
          <span className="hidden lg:block font-bold text-lg">Edir</span>
        </Link>
        <ClientOnly>
          <Menu />
        </ClientOnly>
      </div>

      {/* RIGHT - Main Content */}
      <div className="w-[80%] md:w-[80%] lg:w-[82%] xl:w-[82%] bg-[#F7F8FA] overflow-y-auto flex flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
