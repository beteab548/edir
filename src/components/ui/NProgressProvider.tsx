'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NProgress from 'nprogress';

export default function NProgressProvider() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.done(); // Stop when path changes
  }, [pathname]);

  return null;
}
