'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { CATEGORIAS_DESPESA_FORM } from '@/modules/parametrizacoes/financeiro.forms';

export default function Page() {
  return <TituloFormRoute config={CATEGORIAS_DESPESA_FORM} />;
}
