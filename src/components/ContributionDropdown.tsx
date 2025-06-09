"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type ContributionDropdownProps = {
  icon: string;
  label: string;
  contributionTypes: { id: number; name: string }[];
};

export default function ContributionDropdown({
  icon,
  label,
  contributionTypes,
}: ContributionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight w-full"
      >
        <Image src={icon} alt="" width={20} height={20} />
        <span className="hidden lg:block">{label}</span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col bg-white  rounded-md shadow-sm w-full px-4 py-2 gap-1">
          {contributionTypes.map((type) => (
            <Link
              key={type.id}
              href={`/contribution/${type.name}`}
              className="text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
            >
              {type.name}
            </Link>
          ))}
          <Link
            href="/contribution"
            className="text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
          >
            Contribution setting
          </Link>
          <Link
            href="/contribution/penalties"
            className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-gray-100"
          >
            Penalty Management
          </Link>
        </div>
      </div>
    </div>
  );
}
