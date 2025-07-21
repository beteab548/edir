'use client';

import Link from "next/link";
import NProgress from "nprogress";
import { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
};

export default function LinkButtonWithProgress({ href, children }: Props) {
  const handleClick = () => {
    NProgress.start();
  };

  return (
    <Link href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
