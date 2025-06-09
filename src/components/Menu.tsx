// app/components/Menu.tsx
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import ContributionDropdown from "./ContributionDropdown"; // <-- client component

const fetchTypes = async () => {
  const data = await prisma.contributionType.findMany();
  return data;
};

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin"],
      },
      {
        icon: "/members.png",
        label: "Members",
        href: "/list/members",
        visible: ["admin"],
      },
      {
        icon: "/contribution.png",
        label: "Contribution",
        href: "/Contribution",
        visible: ["admin"],
        hasDropdown: true,
      },
      {
        icon: "/report.png",
        label: "Reports",
        href: "/list/reportss",
        visible: ["admin"],
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
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  const contributionTypes = await fetchTypes();

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((group) => (
        <div className="flex flex-col gap-2" key={group.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {group.title}
          </span>
          {group.items.map((item) => {
            if (item.visible.includes(role)) {
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
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
