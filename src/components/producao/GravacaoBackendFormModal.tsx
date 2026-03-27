import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { programasRepository } from '@/modules/programas/programas.repository.provider';
import { unidadesRepository } from '@/modules/unidades/unidades.repository';
import type { Gravacao, GravacaoInput } from '@/modules/gravacoes/gravacoes.types';

interface GravacaoBackendFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GravacaoInput) => void;
  data?: Gravacao | null;
  readOnly?: boolean;
}

function generateCodigoGravacao(): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear}${Math.floor(Math.random() * 90000 + 10000)}`;
}

export const GravacaoBackendFormModal = ({ isOpen, onClose, onSave, data, readOnly = false }: GravacaoBackendFormModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<GravacaoInput>({
    codigo: '',
    codigoExterno: '',
    nome: '',
    unidadeNegocioId: '',
    centroLucro: '',
    classificacao: '',
    tipoConteudo: '',
    descricao: '',
    status: '',
    dataPrevista: '',
    conteudoId: '',
    orcamento: 0,
    programaId: '',
  });
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [programas, setProgramas] = useState<{ id: string; nome: string; unidadeNegocioId: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      unidadesRepository.list(''),
      programasRepository.list(),
    ]).then(([unidadesData, programasData]) => {
      setUnidades(unidadesData.map((item) => ({ id: item.id, nome: item.nome })));
      setProgramas(programasData.map((item) => ({ id: item.id, nome: item.nome, unidadeNegocioId: item.unidadeNegocioId || '' })));
    }).catch((error) => {
      console.error('Error loading gravacao backend form options:', error);
      setUnidades([]);
      setProgramas([]);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (data) {
      setFormData({
        id: data.id,
        codigo: data.codigo,
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        unidadeNegocioId: data.unidadeNegocioId || '',
        centroLucro: data.centroLucro,
        classificacao: data.classificacao,
        tipoConteudo: data.tipoConteudo,
        descricao: data.descricao,
        status: data.status,
        dataPrevista: data.dataPrevista,
        conteudoId: data.conteudoId || '',
        orcamento: data.orcamento || 0,
        programaId: data.programaId || '',
      });
      return;
    }

    setFormData({
      codigo: generateCodigoGravacao(),
      codigoExterno: '',
      nome: '',
      unidadeNegocioId: '',
      centroLucro: '',
      classificacao: '',
      tipoConteudo: '',
      descricao: '',
      status: 'Planejada',
      dataPrevista: '',
      conteudoId: '',
      orcamento: 0,
      programaId: '',
    });
  }, [data, isOpen]);

  const filteredProgramas = programas.filter((programa) => !formData.unidadeNegocioId || programa.unidadeNegocioId === formData.unidadeNegocioId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Gravação' : 'Nova Gravação'}</DialogTitle>
          <DialogDescription>Fluxo de gravações operando pelo backend próprio.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">{t('common.code')}</Label>
              <Input id="codigo" value={formData.codigo} readOnly className="bg-muted font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
              <Input id="codigoExterno" value={formData.codigoExterno} onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">{t('common.name')}</Label>
              <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required disabled={readOnly} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unidade de Negócio</Label>
              <SearchableSelect
                options={unidades.map((item) => ({ value: item.id, label: item.nome }))}
                value={formData.unidadeNegocioId || ''}
                onValueChange={(value) => setFormData({ ...formData, unidadeNegocioId: value, programaId: '' })}
                placeholder={t('common.select')}
                searchPlaceholder="Pesquisar unidade..."
                emptyMessage="Nenhuma unidade encontrada."
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Programa</Label>
              <SearchableSelect
                options={filteredProgramas.map((item) => ({ value: item.id, label: item.nome }))}
                value={formData.programaId || ''}
                onValueChange={(value) => setFormData({ ...formData, programaId: value })}
                placeholder={t('common.select')}
                searchPlaceholder="Pesquisar programa..."
                emptyMessage="Nenhum programa encontrado."
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataPrevista">{t('recordings.expectedDate')}</Label>
              <Input id="dataPrevista" type="date" value={formData.dataPrevista} onChange={(e) => setFormData({ ...formData, dataPrevista: e.target.value })} disabled={readOnly} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="centroLucro">Centro de Custos</Label>
              <Input id="centroLucro" value={formData.centroLucro} onChange={(e) => setFormData({ ...formData, centroLucro: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classificacao">Classificação</Label>
              <Input id="classificacao" value={formData.classificacao} onChange={(e) => setFormData({ ...formData, classificacao: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoConteudo">Tipo de Conteúdo</Label>
              <Input id="tipoConteudo" value={formData.tipoConteudo} onChange={(e) => setFormData({ ...formData, tipoConteudo: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} disabled={readOnly} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orcamento">{t('field.budget') || 'Orçamento'}</Label>
              <Input id="orcamento" type="number" min="0" step="0.01" value={formData.orcamento || 0} onChange={(e) => setFormData({ ...formData, orcamento: Number(e.target.value) })} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conteudoId">Conteúdo Id</Label>
              <Input id="conteudoId" value={formData.conteudoId || ''} onChange={(e) => setFormData({ ...formData, conteudoId: e.target.value })} disabled={readOnly} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">{t('common.description')}</Label>
            <Textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={3} disabled={readOnly} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{readOnly ? 'Fechar' : t('common.cancel')}</Button>
            {!readOnly && <Button type="submit" className="gradient-primary hover:opacity-90">{t('common.save')}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
