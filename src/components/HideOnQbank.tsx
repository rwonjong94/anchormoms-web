'use client';

import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';

export default function HideOnQbank({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isQbank = pathname?.startsWith('/qbank');
  if (isQbank) return null;
  return <>{children}</>;
}


