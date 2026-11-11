'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
  ConfigurableFieldGrid,
  FieldAsterisk,
  useFormFieldConfig,
} from '@/hooks/useFormFieldConfig';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import type { Orcamento } from '@/modules/financeiro/orcamento.api';
import { OrcamentoItensPanel } from './OrcamentoItensPanel';

const paramsRepo = new ApiParametrizacoesRepository();
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

export interface OrcamentoHeaderInput {
  id?: string;
  ano: number;
  centroLucroId: string;
  descricao: string;
}

/**
 * Orçamento cadastro inside a `RecordFormPage`: year, centro de lucro and description;
 * in edit mode the monthly items are edited below (each row saves by itself).
 */
export function OrcamentoFormBody({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<Orcamento, OrcamentoHeaderInput>) {
  const editing = data;
  const [ano, setAno] = useState(() => editing?.ano ?? currentYear);
  const [centroLucroId, setCentroLucroId] = useState(() => editing?.centroLucroId ?? '');
  const [descricao, setDescricao] = useState(() => editing?.descricao ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('orcamento');
  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    paramsRepo
      .listCentrosLucro()
      .then((centros) => setCentrosLucro(centros.data.map((c) => ({ id: c.id, nome: c.nome }))))
      .catch((err) => console.error('Error fetching centros lucro:', err));
  }, []);

  const isValid = !!centroLucroId;

  const handleSave = async () => {
    if (readOnly || isSaving || !isValid) return;
    if (!validate({ ano, centroLucroId, descricao })) return;
    setIsSaving(true);
    try {
      await onSubmit({ id: editing?.id, ano, centroLucroId, descricao });
    } finally {
      setIsSaving(false);
    }
  };

  const centroOptions = centrosLucro.map((c) => ({ value: c.id, label: c.nome }));

  return (
    <div className="space-y-6">
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <ConfigurableFieldGrid className="py-2">
          <div className="space-y-2" {...fieldLayout('ano')}>
            <Label>
              {fieldLabel('ano', 'Ano')}
              <FieldAsterisk type={getAsterisk('ano', true)} />
            </Label>
            <Select
              value={String(ano)}
              onValueChange={(v) => setAno(Number(v))}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2" {...fieldLayout('centroLucroId')}>
            <Label>
              {fieldLabel('centroLucroId', 'Centro de Lucro')}
              <FieldAsterisk type={getAsterisk('centroLucroId', true)} />
            </Label>
            <SearchableSelect
              options={centroOptions}
              value={centroLucroId}
              onValueChange={setCentroLucroId}
              placeholder="Selecione..."
              searchPlaceholder="Pesquisar centro de lucro..."
              emptyMessage="Nenhum resultado."
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2" {...fieldLayout('descricao')}>
            <Label>
              {fieldLabel('descricao', 'Descrição')}
              <FieldAsterisk type={getAsterisk('descricao')} />
            </Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional..."
              disabled={readOnly}
            />
          </div>
        </ConfigurableFieldGrid>
      </form>

      {editing && <OrcamentoItensPanel orcamento={editing} />}
    </div>
  );
}
