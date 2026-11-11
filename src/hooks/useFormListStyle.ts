import { useEffect, useState } from 'react';
import { ApiAdminConfigRepository } from '@/modules/admin/admin-config.api';
import {
  DEFAULT_LISTA_CONFIG,
  stripeColorOf,
  type FormularioListaConfig,
} from '@/data/listStripeColors';

const repository = new ApiAdminConfigRepository();

/**
 * Aparência da lista do módulo de um formulário, publicada em Administração > Formulários >
 * Lista. `stripeColor` é a cor das linhas intercaladas (null = sem zebra); passe-a ao
 * `SortableTable` (`stripeColor`) ou use `zebraBodyProps`.
 */
export function useFormListStyle(formularioId: string) {
  const [lista, setLista] = useState<FormularioListaConfig>(DEFAULT_LISTA_CONFIG);

  useEffect(() => {
    let active = true;
    repository
      .getFormularioLista(formularioId)
      .then((config) => {
        if (active) setLista(config);
      })
      // Sem a configuração, a lista fica como sempre foi (sem zebra).
      .catch((): void => undefined);
    return () => {
      active = false;
    };
  }, [formularioId]);

  return { lista, stripeColor: stripeColorOf(lista) };
}
