// app/components/Menu.tsx
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import ContributionDropdown from "./ContributionDropdown";
import PenaltyDropdown from "./penaltyDropdown";

const fetchTypes = async () => {
  const data = await prisma.contributionType.findMany();
  return data;
};

// Menu config with role-based visibility
const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/",
        visible: ["admin", "secretary", "chairman"],
      },
      {
        icon: "/members.png",
        label: "Members",
        href: "/list/members",
        visible: ["admin", "secretary"],
      },
      {
        icon: "/contribution.png",
        label: "Contribution",
        href: "/Contribution",
        visible: ["admin", "chairman"],
        hasDropdown: true,
      },
      {
        icon: "/penalty.png",
        label: "Penalty",
        href: "/penalty",
        visible: ["admin", "chairman"],
        hasDropdown: true,
      },
      {
        icon: "/report.png",
        label: "Reports",
        href: "/admin",
        visible: ["admin", "chairman", "secretary"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "chairman", "secretary"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/configure-setting",
        visible: ["admin", "chairman", "secretary"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "chairman", "secretary"],
      },
    ],
  },
];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;

  // Optional: hide whole menu if no role or user
  if (!user || !role) return null;

  const contributionTypes = await fetchTypes();

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((group) => {
        const visibleItems = group.items.filter((item) =>
          item.visible.includes(role)
        );

        if (visibleItems.length === 0) return null;

        return (
          <div className="flex flex-col gap-2" key={group.title}>
            <span className="hidden lg:block text-gray-400 font-light my-4">
              {group.title}
            </span>
            {visibleItems.map((item) => {
              if (item.hasDropdown && item.label === "Contribution") {
                return (
                  <ContributionDropdown
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    contributionTypes={contributionTypes}
                  />
                );
              }

              if (item.hasDropdown && item.label === "Penalty") {
                return (
                  <PenaltyDropdown
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                  />
                );
              }

              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Menu;
