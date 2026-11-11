'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { CATEGORIAS_INCIDENCIA_FORM } from '@/modules/parametrizacoes/producao.forms';

export default function Page() {
  return <TituloFormRoute config={CATEGORIAS_INCIDENCIA_FORM} />;
}
