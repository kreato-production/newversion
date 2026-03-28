import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiTenantsRepository } from '@/modules/tenants/tenants.api.repository';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2 } from 'lucide-react';
import { UnidadeNegocioFormModal } from './UnidadeNegocioFormModal';

interface Unidade {
  id: string;
  codigo_externo: string | null;
  nome: string;
  moeda: string;
  descricao: string | null;
  tenant_id: string;
}

const apiRepository = new ApiTenantsRepository();

export const TenantUnidadesTab = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchUnidades = async () => {
    setIsLoading(true);
    try {
      const data = await apiRepository.listUnidades(tenantId);
      setUnidades(
        data.map((item) => ({
          id: item.id,
          codigo_externo: item.codigoExterno || null,
          nome: item.nome,
          moeda: item.moeda,
          descricao: item.descricao || null,
          tenant_id: tenantId,
        })),
      );
    } catch (error) {
      console.error('Error fetching business units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUnidades();
  }, [tenantId]);

  const handleCreateNew = async (data: {
    codigoExterno?: string;
    nome: string;
    descricao?: string;
    imagem?: string;
    moeda?: string;
  }) => {
    try {
      await apiRepository.createUnidade(tenantId, {
        codigoExterno: data.codigoExterno || undefined,
        nome: data.nome,
        descricao: data.descricao || undefined,
        imagem: data.imagem || undefined,
        moeda: data.moeda || 'BRL',
      });

      toast({ title: 'Sucesso', description: 'Unidade criada para o tenant' });
      await fetchUnidades();
      setIsCreating(false);
    } catch (error: unknown) {
      console.error('Error creating unit:', error);
      toast({
        title: 'Erro',
        description: (error as Error).message || 'Erro ao criar unidade',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Unidades de negocio vinculadas ao tenant na API local.
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
        No modo backend, as unidades pertencem diretamente ao tenant. A associacao de unidades ja
        existentes nao se aplica aqui.
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codigo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Moeda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Carregando unidades...
                </TableCell>
              </TableRow>
            ) : unidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhuma unidade associada a este tenant
                </TableCell>
              </TableRow>
            ) : (
              unidades.map((unidade) => (
                <TableRow key={unidade.id}>
                  <TableCell className="font-mono text-xs">
                    {unidade.codigo_externo || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {unidade.nome}
                    </div>
                  </TableCell>
                  <TableCell>{unidade.moeda}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UnidadeNegocioFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSave={handleCreateNew}
      />
    </div>
  );
};
