'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { ESTADOS_EVENTO_FORM } from '@/modules/satops/estados-evento.form';

export default function Page() {
  return <TituloFormRoute config={ESTADOS_EVENTO_FORM} />;
}
