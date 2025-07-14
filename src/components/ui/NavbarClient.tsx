// components/NavbarClient.tsx
"use client";

import { UserButton } from "@clerk/nextjs";
import { FiBell } from "react-icons/fi";

interface NavbarClientProps {
  fullName: string;
  role: string;
}

export default function NavbarClient({ fullName, role }: NavbarClientProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
            <FiBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="sr-only">Notifications</span>
          </button>

          <div className="flex items-center space-x-2 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                {fullName || "Unnamed User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {role || "User"}
              </p>
            </div>

            <div className="relative">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9",
                    userButtonPopoverCard: "shadow-lg rounded-xl",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
