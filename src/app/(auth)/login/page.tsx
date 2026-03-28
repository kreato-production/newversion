'use client';

import { Suspense } from 'react';
import LoginPage from '@/views/Login';

// Suspense necessário por LoginPage usar useSearchParams indiretamente
export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
