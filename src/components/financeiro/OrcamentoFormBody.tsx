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
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano *</Label>
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
            <div className="space-y-2 col-span-2">
              <Label>Centro de Lucro *</Label>
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
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional..."
              disabled={readOnly}
            />
          </div>
        </div>
      </form>

      {editing && <OrcamentoItensPanel orcamento={editing} />}
    </div>
  );
}
