'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { STATUS_TAREFA_FORM } from '@/modules/parametrizacoes/producao.forms';

export default function Page() {
  return <TituloFormRoute config={STATUS_TAREFA_FORM} />;
}
