'use client';

import { useParams } from 'next/navigation';
import PessoaForm from '@/views/recursos/PessoaForm';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <PessoaForm key={params.id} pessoaId={params.id} />;
}
