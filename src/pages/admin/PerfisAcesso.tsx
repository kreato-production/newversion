import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Copy, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import PerfilFormModal from '@/components/admin/PerfilFormModal';
import { clonePermissions, savePerfilPermissions, getPerfilPermissions } from '@/data/permissionsMatrix';
import jsPDF from 'jspdf';

interface Perfil {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const PerfisAcesso = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Perfil | null>(null);
  const [items, setItems] = useState<Perfil[]>(() => {
    const stored = localStorage.getItem('kreato_perfis_acesso');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: Perfil[]) => {
    localStorage.setItem('kreato_perfis_acesso', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: Perfil) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: t('common.success'), description: `Perfil ${t('common.updated').toLowerCase()}!` });
    } else {
      saveToStorage([...items, data]);
      toast({ title: t('common.success'), description: `Perfil ${t('common.save').toLowerCase()}!` });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: t('common.deleted'), description: `Perfil ${t('common.deleted').toLowerCase()}!` });
    }
  };

  const handleEdit = (item: Perfil) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCopy = (item: Perfil) => {
    const newId = crypto.randomUUID();
    const copiedPerfil: Perfil = {
      ...item,
      id: newId,
      nome: `${item.nome} (Cópia)`,
      codigoExterno: '',
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
    };
    
    // Clonar as permissões do perfil original
    const clonedPermissions = clonePermissions(item.id, newId);
    if (clonedPermissions) {
      savePerfilPermissions(clonedPermissions);
    }
    
    saveToStorage([...items, copiedPerfil]);
    toast({
      title: t('common.success'),
      description: `Perfil "${item.nome}" copiado com sucesso!`,
    });
  };

  const handleExportPDF = (item: Perfil) => {
    const permissions = getPerfilPermissions(item.id);
    if (!permissions) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encontrar as permissões do perfil.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;
    const lineHeight = 6;
    const margin = 14;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Mapa de Permissões de Acesso', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Nome do perfil
    doc.setFontSize(14);
    doc.text(`Perfil: ${item.nome}`, margin, yPosition);
    yPosition += 8;

    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);
    yPosition += 12;

    // Cabeçalho da tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    const colWidths = [45, 35, 35, 30, 12, 12, 12, 12, 12];
    const headers = ['Módulo', 'Sub-módulo 1', 'Sub-módulo 2', 'Campo', 'Ação', 'Leit.', 'Incl.', 'Alt.', 'Excl.'];
    let xPos = margin;
    
    headers.forEach((header, index) => {
      doc.text(header, xPos + 1, yPosition);
      xPos += colWidths[index];
    });
    
    yPosition += lineHeight;

    // Dados das permissões
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    permissions.permissoes.forEach((perm) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }

      xPos = margin;
      const data = [
        perm.modulo.substring(0, 20),
        perm.subModulo1 === '-' ? '' : perm.subModulo1.substring(0, 15),
        perm.subModulo2 === '-' ? '' : perm.subModulo2.substring(0, 15),
        perm.campo === '-' ? '' : perm.campo.substring(0, 15),
        perm.acao === 'visible' ? 'V' : 'I',
        perm.tipo === 'campo' ? (perm.somenteLeitura ? 'S' : 'N') : '',
        perm.tipo === 'campo' ? (perm.incluir ? 'S' : 'N') : '',
        perm.tipo === 'campo' ? (perm.alterar ? 'S' : 'N') : '',
        perm.tipo === 'campo' ? (perm.excluir ? 'S' : 'N') : '',
      ];

      // Destaque para módulos
      if (perm.tipo === 'modulo') {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      data.forEach((text, index) => {
        doc.text(text, xPos + 1, yPosition);
        xPos += colWidths[index];
      });

      yPosition += lineHeight;
    });

    // Legenda
    yPosition += 5;
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Legenda:', margin, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('V = Visível | I = Invisível | S = Sim | N = Não', margin, yPosition);

    // Salvar o PDF
    doc.save(`permissoes_${item.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`);

    toast({
      title: t('common.success'),
      description: `PDF das permissões exportado com sucesso!`,
    });
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Perfil & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'descricao',
      label: t('common.description'),
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-32',
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-36 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => handleCopy(item)}
            title="Copiar Perfil"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => handleExportPDF(item)}
            title="Exportar PDF"
          >
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(item)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Perfis de Acesso"
        description="Gerencie os perfis de acesso do sistema"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel={`${t('common.new')} Perfil`}
      >
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description={`${t('common.add')} perfil.`}
            icon={Settings}
            onAction={() => setIsModalOpen(true)}
            actionLabel={`${t('common.add')} Perfil`}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_perfis_acesso"
          />
        )}
      </DataCard>

      <PerfilFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
      />
    </div>
  );
};

export default PerfisAcesso;
