'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { TIPOS_DOCUMENTOS_FORM } from '@/modules/parametrizacoes/financeiro.forms';

export default function Page() {
  return <TituloFormRoute config={TIPOS_DOCUMENTOS_FORM} />;
}
