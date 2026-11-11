'use client';

import { TituloFormRoute } from '@/components/shared/TituloFormPage';
import { PERFIS_ACESSO_FORM } from '@/modules/parametros/perfis-acesso.form';

export default function Page() {
  return <TituloFormRoute config={PERFIS_ACESSO_FORM} />;
}
