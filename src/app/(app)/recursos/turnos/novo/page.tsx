'use client';

import { useParams } from 'next/navigation';
import Form from '@/views/recursos/TurnoForm';

export default function Page() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  return <Form key={id ?? 'novo'} id={id} />;
}
