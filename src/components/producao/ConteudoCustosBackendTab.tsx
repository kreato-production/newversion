import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import { conteudosRelacionamentosApi } from '@/modules/conteudos/conteudos-relacionamentos.api';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import { gravacoesRelacionamentosApi } from '@/modules/gravacoes/gravacoes-relacionamentos.api';
import { ApiAlocacoesRepository } from '@/modules/alocacoes/alocacoes.api';
import { ApiRecursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';

interface ConteudoCustosBackendTabProps {
  conteudoId: string;
  conteudoNome?: string;
}

type SummaryRow = {
  nome: string;
  estimado: number;
  realizado: number;
};

const alocacoesApi = new ApiAlocacoesRepository();
const recursosHumanosApi = new ApiRecursosHumanosRepository();
const recursosFisicosApi = new ApiRecursosFisicosRepository();

function hoursBetween(inicio?: string | null, fim?: string | null) {
  if (!inicio || !fim) return 0;
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  const start = hi * 60 + mi;
  const end = hf * 60 + mf;
  return end > start ? (end - start) / 60 : 0;
}

export const ConteudoCustosBackendTab = ({
  conteudoId,
  conteudoNome,
}: ConteudoCustosBackendTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [moeda, setMoeda] = useState('BRL');
  const [rtRows, setRtRows] = useState<SummaryRow[]>([]);
  const [rfRows, setRfRows] = useState<SummaryRow[]>([]);
  const [terceirosRows, setTerceirosRows] = useState<SummaryRow[]>([]);
  const [gravacoesCount, setGravacoesCount] = useState(0);

  const formatCurrency = useCallback((value: number) => formatCurrencyUtil(value, moeda), [moeda]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [conteudos, options, gravacoes, overview, rhs, rfs] = await Promise.all([
          conteudosRepository.list(),
          conteudosRepository.listOptions(),
          gravacoesRepository.list(),
          alocacoesApi.listOverview(),
          recursosHumanosApi.list(),
          recursosFisicosApi.list(),
        ]);

        const conteudo = conteudos.find((item) => item.id === conteudoId);
        const unidade = options.unidades.find((item) => item.id === conteudo?.unidadeNegocioId);
        setMoeda(unidade?.moeda || 'BRL');

        const [rtPlanejado, rfPlanejado, terceirosPlanejado] = await Promise.all([
          conteudosRelacionamentosApi.listResources(conteudoId, 'tecnico', conteudo?.tabelaPrecoId),
          conteudosRelacionamentosApi.listResources(conteudoId, 'fisico', conteudo?.tabelaPrecoId),
          conteudosRelacionamentosApi.listTerceiros(conteudoId),
        ]);

        const gravacoesConteudo = gravacoes.filter((item) => item.conteudoId === conteudoId);
        setGravacoesCount(gravacoesConteudo.length);
        const gravacaoIds = new Set(gravacoesConteudo.map((item) => item.id));

        const rhMap = new Map(rhs.map((item) => [item.id, item.custoHora || 0]));
        const rfMap = new Map(rfs.map((item) => [item.id, item.custoHora || 0]));

        const rtRealizado = new Map<string, number>();
        const rfRealizado = new Map<string, number>();
        overview.alocacoes
          .filter((item) => gravacaoIds.has(item.gravacaoId))
          .forEach((item) => {
            if (item.recursoTecnicoId && item.recursoHumanoId) {
              const cost = rhMap.get(item.recursoHumanoId) || 0;
              const total = hoursBetween(item.horaInicio, item.horaFim) * cost;
              rtRealizado.set(
                item.recursoTecnicoId,
                (rtRealizado.get(item.recursoTecnicoId) || 0) + total,
              );
            }

            if (item.recursoFisicoId && !item.recursoTecnicoId) {
              const cost = rfMap.get(item.recursoFisicoId) || 0;
              const total = hoursBetween(item.horaInicio, item.horaFim) * cost;
              rfRealizado.set(
                item.recursoFisicoId,
                (rfRealizado.get(item.recursoFisicoId) || 0) + total,
              );
            }
          });

        setRtRows(
          rtPlanejado.items.map((item) => ({
            nome: item.recursoNome,
            estimado:
              Number(item.valorComDesconto || item.valorTotal || 0) *
              Math.max(gravacoesConteudo.length, 1),
            realizado: rtRealizado.get(item.recursoId) || 0,
          })),
        );

        setRfRows(
          rfPlanejado.items.map((item) => ({
            nome: item.recursoNome,
            estimado:
              Number(item.valorComDesconto || item.valorTotal || 0) *
              Math.max(gravacoesConteudo.length, 1),
            realizado: rfRealizado.get(item.recursoId) || 0,
          })),
        );

        const terceirosRealMap = new Map<string, number>();
        const terceirosPorGravacao = await Promise.all(
          gravacoesConteudo.map(async (gravacao) => ({
            gravacaoId: gravacao.id,
            data: await gravacoesRelacionamentosApi.listTerceiros(gravacao.id),
          })),
        );
        terceirosPorGravacao.forEach(({ data }) => {
          data.items.forEach((item) => {
            const key = item.servicoNome || item.fornecedorNome || 'Servico';
            terceirosRealMap.set(key, (terceirosRealMap.get(key) || 0) + Number(item.custo || 0));
          });
        });

        setTerceirosRows(
          terceirosPlanejado.items.map((item) => ({
            nome: item.servicoNome,
            estimado: Number(item.valorPrevisto || 0),
            realizado: terceirosRealMap.get(item.servicoNome) || 0,
          })),
        );
      } catch (error) {
        console.error('Error loading conteudo custos backend:', error);
        setRtRows([]);
        setRfRows([]);
        setTerceirosRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [conteudoId]);

  const totalEstimado = useMemo(
    () => [...rtRows, ...rfRows, ...terceirosRows].reduce((sum, item) => sum + item.estimado, 0),
    [rfRows, rtRows, terceirosRows],
  );
  const totalRealizado = useMemo(
    () => [...rtRows, ...rfRows, ...terceirosRows].reduce((sum, item) => sum + item.realizado, 0),
    [rfRows, rtRows, terceirosRows],
  );

  const renderSection = (title: string, rows: SummaryRow[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dado disponivel.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Estimado</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.nome}>
                  <TableCell className="font-medium">{row.nome}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.estimado)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.realizado)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.estimado - row.realizado)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Resumo de Custos {conteudoNome ? `- ${conteudoNome}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Gravacoes</p>
            <p className="text-2xl font-semibold">{gravacoesCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimado</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalEstimado)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Realizado</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalRealizado)}</p>
          </div>
        </CardContent>
      </Card>
      {renderSection('Recursos Tecnicos', rtRows)}
      {renderSection('Recursos Fisicos', rfRows)}
      {renderSection('Terceiros', terceirosRows)}
    </div>
  );
};
