'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { STATUS_PLANEAMENTO_FORM } from '@/modules/parametrizacoes/producao.forms';

export default function Page() {
  return <TituloFormRoute config={STATUS_PLANEAMENTO_FORM} />;
}
