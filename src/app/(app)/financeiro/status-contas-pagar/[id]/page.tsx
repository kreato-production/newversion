'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { STATUS_CONTAS_PAGAR_FORM } from '@/modules/parametrizacoes/financeiro.forms';

export default function Page() {
  return <TituloFormRoute config={STATUS_CONTAS_PAGAR_FORM} />;
}
