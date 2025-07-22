// components/ClientLink.tsx
"use client";

import Link from "next/link";
import nProgress from "nprogress";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

type ClientLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function ClientLink({ href, children, className }: ClientLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    nProgress.start();
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
