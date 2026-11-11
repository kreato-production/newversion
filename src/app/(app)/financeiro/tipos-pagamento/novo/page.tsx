'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { TIPOS_PAGAMENTO_FORM } from '@/modules/parametrizacoes/financeiro.forms';

export default function Page() {
  return <TituloFormRoute config={TIPOS_PAGAMENTO_FORM} />;
}
