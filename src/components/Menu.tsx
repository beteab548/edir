import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

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
        label: "Contribtuion",
        href: "/contribution",
        visible: ["admin"],
        hasDropdown: true, 
      },
      {
        icon: "/report.png",
        label: "Reports",
        href: "/list/reportss",
        visible: ["admin"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
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
              if (item.hasDropdown && item.label === "Contribtuion") {
                return (
                  <div key={item.label} className="relative group">
                    <button className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight w-full">
                      <Image src={item.icon} alt="" width={20} height={20} />
                      <span className="hidden lg:block">{item.label}</span>
                    </button>
                    {/* Dropdown content */}
                    <div className="hidden lg:group-hover:block absolute left-full top-0 ml-1 w-48 bg-white shadow-lg rounded-md z-10">
                      <div className="py-1">
                        {contributionTypes.map((type) => (
                          <Link
                            key={type.id}
                            href={`/contribution/${type.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {type.name}
                          </Link>
                        ))}
                      </div>
                      <Link
                            key={"contribution"}
                            href={`/contribution/config-setting}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {"Contribution setting"}
                          </Link>
                    </div>
                  </div>
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