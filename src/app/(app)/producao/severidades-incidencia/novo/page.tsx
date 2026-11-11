'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { SEVERIDADES_INCIDENCIA_FORM } from '@/modules/parametrizacoes/producao.forms';

export default function Page() {
  return <TituloFormRoute config={SEVERIDADES_INCIDENCIA_FORM} />;
}
