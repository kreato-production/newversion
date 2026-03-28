import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

// Auth protection is enforced by middleware.ts — no need to check here.
// AppShell is a Client Component that renders sidebar + settings dropdown.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
