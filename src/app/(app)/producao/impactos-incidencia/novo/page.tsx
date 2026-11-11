'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { IMPACTOS_INCIDENCIA_FORM } from '@/modules/parametrizacoes/producao.forms';

export default function Page() {
  return <TituloFormRoute config={IMPACTOS_INCIDENCIA_FORM} />;
}
