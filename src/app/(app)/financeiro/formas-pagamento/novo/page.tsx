'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { FORMAS_PAGAMENTO_FORM } from '@/modules/parametrizacoes/financeiro.forms';

export default function Page() {
  return <TituloFormRoute config={FORMAS_PAGAMENTO_FORM} />;
}
