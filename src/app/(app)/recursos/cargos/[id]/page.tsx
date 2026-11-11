'use client';

import { ParametroFormRoute } from '@/components/shared/ParametroFormPage';
import { PARAMETROS } from '@/modules/parametros/parametros.config';

export default function Page() {
  return <ParametroFormRoute config={PARAMETROS.cargos} />;
}
