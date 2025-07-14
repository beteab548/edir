// components/Navbar.tsx
import { currentUser } from "@clerk/nextjs/server";
import dynamic from "next/dynamic";

const NavbarClient = dynamic(() => import("@/components/ui/NavbarClient"), { ssr: false });

const Navbar = async () => {
  try {
    const user = await currentUser();
    const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
    const role = user?.publicMetadata?.role as string;

    return <NavbarClient fullName={fullName} role={role} />;
  } catch (error) {
    return (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-center px-6 py-4 text-red-600 text-sm">
          Connection timeout. Please refresh
        </div>
      </header>
    );
  }
};

export default Navbar;
