'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { STATUS_GRAVACAO_FORM } from '@/modules/parametrizacoes/producao.forms';

export default function Page() {
  return <TituloFormRoute config={STATUS_GRAVACAO_FORM} />;
}
