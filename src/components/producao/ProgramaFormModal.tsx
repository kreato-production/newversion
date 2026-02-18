import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Programa } from '@/pages/producao/Programas';

interface ProgramaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Programa) => void;
  data?: Programa | null;
  readOnly?: boolean;
}

export const ProgramaFormModal = ({ isOpen, onClose, onSave, data, readOnly = false }: ProgramaFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ codigoExterno: '', nome: '', descricao: '', unidadeNegocioId: '' });
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);

  const fetchUnidades = useCallback(async () => {
    const { data: uData } = await supabase.from('unidades_negocio').select('id, nome').order('nome');
    setUnidades(uData || []);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUnidades();
      if (data) {
        setFormData({ codigoExterno: data.codigoExterno, nome: data.nome, descricao: data.descricao, unidadeNegocioId: data.unidadeNegocioId });
      } else {
        setFormData({ codigoExterno: '', nome: '', descricao: '', unidadeNegocioId: '' });
      }
    }
  }, [isOpen, data, fetchUnidades]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;
    const unidade = unidades.find(u => u.id === formData.unidadeNegocioId);
    onSave({
      id: data?.id || crypto.randomUUID(),
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      descricao: formData.descricao,
      unidadeNegocioId: formData.unidadeNegocioId,
      unidadeNegocio: unidade?.nome || '',
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Programa' : 'Novo Programa'}</DialogTitle>
          <DialogDescription>{data ? 'Editar' : 'Adicionar'} programa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
              <Input id="codigoExterno" value={formData.codigoExterno} onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })} maxLength={10} placeholder="Máx. 10 caracteres" disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">{t('common.name')} <span className="text-destructive">*</span></Label>
              <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} maxLength={200} required disabled={readOnly} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Unidade de Negócio</Label>
            <SearchableSelect
              options={unidades.map(u => ({ value: u.id, label: u.nome }))}
              value={formData.unidadeNegocioId}
              onValueChange={(value) => setFormData({ ...formData, unidadeNegocioId: value })}
              placeholder={t('common.select')}
              searchPlaceholder="Pesquisar unidade..."
              emptyMessage="Nenhuma unidade encontrada."
              disabled={readOnly}
            />
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
