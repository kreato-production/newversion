import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Wrench, Calculator, Clock, DollarSign, Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';

interface CustoItem {
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
  tipo: 'humano' | 'fisico' | 'tecnico' | 'terceiro';
}

interface CustosTabProps {
  gravacaoId: string;
}

const calcularHorasEntreTempo = (inicio: string, fim: string): number => {
  if (!inicio || !fim) return 0;
  
  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);
  
  const totalMinutosInicio = horaInicio * 60 + minInicio;
  const totalMinutosFim = horaFim * 60 + minFim;
  
  const diferencaMinutos = totalMinutosFim - totalMinutosInicio;
  return diferencaMinutos > 0 ? diferencaMinutos / 60 : 0;
};

export const CustosTab = ({ gravacaoId }: CustosTabProps) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [recursos, setRecursos] = useState<any[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<any[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<any[]>([]);
  const [terceiros, setTerceiros] = useState<any[]>([]);
  const [moeda, setMoeda] = useState<string>('BRL');

  // Custom currency formatter based on business unit
  const formatCurrency = useCallback((value: number) => {
    return formatCurrencyUtil(value, moeda);
  }, [moeda]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // First, fetch the gravação to get the unidade_negocio_id
      const { data: gravacaoData } = await supabase
        .from('gravacoes')
        .select('unidade_negocio_id')
        .eq('id', gravacaoId)
        .single();

      // If there's a business unit, fetch its currency preference
      if (gravacaoData?.unidade_negocio_id) {
        const { data: unidadeData } = await supabase
          .from('unidades_negocio')
          .select('moeda')
          .eq('id', gravacaoData.unidade_negocio_id)
          .single();
        
        if (unidadeData?.moeda) {
          setMoeda(unidadeData.moeda);
        }
      }

      // Buscar recursos alocados na gravação (incluindo alocações de RH em recursos técnicos)
      const { data: recursosData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id,
          hora_inicio,
          hora_fim,
          recurso_humano_id,
          recurso_fisico_id,
          recurso_tecnico_id,
          recursos_humanos:recurso_humano_id(id, nome, sobrenome, custo_hora),
          recursos_fisicos:recurso_fisico_id(id, nome, custo_hora),
          recursos_tecnicos:recurso_tecnico_id(id, nome)
        `)
        .eq('gravacao_id', gravacaoId);

      setRecursos(recursosData || []);

      // Buscar cadastro de recursos humanos
      const { data: rhData } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome, custo_hora');
      setRecursosHumanos(rhData || []);

      // Buscar cadastro de recursos físicos
      const { data: rfData } = await supabase
        .from('recursos_fisicos')
        .select('id, nome, custo_hora');
      setRecursosFisicos(rfData || []);

      // Buscar terceiros alocados
      const { data: terceirosData } = await supabase
        .from('gravacao_terceiros')
        .select(`
          id,
          valor,
          observacao,
          fornecedor:fornecedor_id(id, nome),
          servico:servico_id(id, nome)
        `)
        .eq('gravacao_id', gravacaoId);
      setTerceiros(terceirosData || []);
    } catch (err) {
      console.error('Erro ao carregar dados de custos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gravacaoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const custos = useMemo(() => {
    const itens: CustoItem[] = [];
    const rhProcessados = new Set<string>(); // Evitar duplicatas de RH
    const rfProcessados = new Set<string>(); // Evitar duplicatas de RF

    // Processar recursos alocados
    recursos.forEach((recurso) => {
      // Processar recursos humanos alocados (seja diretamente ou via recurso técnico)
      // Este caso trata:
      //   - RH alocado diretamente (recurso_humano_id + sem recurso_tecnico_id)
      //   - RH associado a recurso técnico (recurso_humano_id + recurso_tecnico_id)
      if (recurso.recurso_humano_id && recurso.recursos_humanos) {
        const rh = recurso.recursos_humanos;
        const custoHora = rh.custo_hora || 0;
        const horas = calcularHorasEntreTempo(recurso.hora_inicio, recurso.hora_fim);
        
        // Criar chave única incluindo recurso técnico para evitar conflito mas manter cada alocação
        const rhKey = `${recurso.recurso_humano_id}_${recurso.recurso_tecnico_id || 'direct'}_${recurso.hora_inicio}_${recurso.hora_fim}`;
        
        if (horas > 0 && !rhProcessados.has(rhKey)) {
          rhProcessados.add(rhKey);
          
          // Identificar se está associado a um recurso técnico
          const recursoTecnico = recurso.recurso_tecnico_id ? recurso.recursos_tecnicos : null;
          const descricao = recursoTecnico 
            ? `${horas.toFixed(1)}h operando ${recursoTecnico.nome}`
            : `${horas.toFixed(1)}h de trabalho`;
          
          itens.push({
            categoria: t('costsTab.humanResources'),
            recurso: `${rh.nome} ${rh.sobrenome || ''}`.trim(),
            descricao,
            horas,
            custoUnitario: custoHora,
            custoTotal: horas * custoHora,
            tipo: 'humano',
          });
        }
      }

      // Processar recursos físicos - cada alocação separadamente
      if (recurso.recurso_fisico_id && recurso.recursos_fisicos) {
        const rf = recurso.recursos_fisicos;
        const custoHora = rf.custo_hora || 0;
        const horas = calcularHorasEntreTempo(recurso.hora_inicio, recurso.hora_fim);
        
        // Usar ID do registro como chave única (permite múltiplas alocações do mesmo RF em horários diferentes)
        const rfKey = recurso.id;

        if (horas > 0 && !rfProcessados.has(rfKey)) {
          rfProcessados.add(rfKey);
          itens.push({
            categoria: t('costsTab.physicalResources'),
            recurso: rf.nome,
            descricao: `${horas.toFixed(1)}h de ocupação`,
            horas,
            custoUnitario: custoHora,
            custoTotal: horas * custoHora,
            tipo: 'fisico',
          });
        }
      }
    });

    // Adicionar custos de terceiros
    terceiros.forEach((terceiro) => {
      const valor = terceiro.valor || 0;
      itens.push({
        categoria: t('thirdParties.title'),
        recurso: terceiro.fornecedor?.nome || 'Fornecedor',
        descricao: terceiro.servico?.nome || terceiro.observacao || 'Serviço',
        horas: 0,
        custoUnitario: valor,
        custoTotal: valor,
        tipo: 'terceiro',
      });
    });

    return itens;
  }, [recursos, terceiros, t]);

  const custosPorCategoria = useMemo(() => {
    const categorias: Record<string, CustoItem[]> = {};
    custos.forEach((item) => {
      if (!categorias[item.categoria]) {
        categorias[item.categoria] = [];
      }
      categorias[item.categoria].push(item);
    });
    return categorias;
  }, [custos]);

  const totaisPorCategoria = useMemo(() => {
    const totais: Record<string, { horas: number; custo: number }> = {};
    Object.entries(custosPorCategoria).forEach(([categoria, itens]) => {
      totais[categoria] = {
        horas: itens.reduce((acc, item) => acc + item.horas, 0),
        custo: itens.reduce((acc, item) => acc + item.custoTotal, 0),
      };
    });
    return totais;
  }, [custosPorCategoria]);

  const totalGeral = useMemo(() => {
    return {
      horas: custos.reduce((acc, item) => acc + item.horas, 0),
      custo: custos.reduce((acc, item) => acc + item.custoTotal, 0),
    };
  }, [custos]);

  const getIconCategoria = (categoria: string) => {
    if (categoria === t('costsTab.humanResources')) return <Users className="h-4 w-4" />;
    if (categoria === t('costsTab.physicalResources')) return <MapPin className="h-4 w-4" />;
    if (categoria === t('thirdParties.title')) return <Building2 className="h-4 w-4" />;
    return <Wrench className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (custos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('costsTab.noCosts')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('costsTab.noCostsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costsTab.totalHours')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGeral.horas.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{t('costsTab.estimatedHours')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costsTab.totalCost')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalGeral.custo)}</div>
            <p className="text-xs text-muted-foreground">{t('costsTab.estimatedCost')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costsTab.costItems')}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custos.length}</div>
            <p className="text-xs text-muted-foreground">{t('costsTab.allocatedWithCost')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de custos por categoria */}
      {Object.entries(custosPorCategoria).map(([categoria, itens]) => (
        <Card key={categoria}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {getIconCategoria(categoria)}
              {categoria}
              <Badge variant="secondary" className="ml-2">
                {formatCurrency(totaisPorCategoria[categoria]?.custo || 0)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('costsTab.resource')}</TableHead>
                  <TableHead>{t('common.description')}</TableHead>
                  {categoria !== t('thirdParties.title') && (
                    <>
                      <TableHead className="text-right">{t('costsTab.hours')}</TableHead>
                      <TableHead className="text-right">{t('costsTab.hourlyRate')}</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">{t('costs.totalCost')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.recurso}</TableCell>
                    <TableCell className="text-muted-foreground">{item.descricao}</TableCell>
                    {categoria !== t('thirdParties.title') && (
                      <>
                        <TableCell className="text-right">{item.horas.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.custoUnitario)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right font-medium">{formatCurrency(item.custoTotal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="font-medium">
                    {t('costsTab.subtotal')} - {categoria}
                  </TableCell>
                  {categoria !== t('thirdParties.title') && (
                    <>
                      <TableCell className="text-right font-medium">
                        {totaisPorCategoria[categoria]?.horas.toFixed(1)}h
                      </TableCell>
                      <TableCell></TableCell>
                    </>
                  )}
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totaisPorCategoria[categoria]?.custo || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Total Geral */}
      <Card className="border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('costsTab.totalEstimatedCost')}</p>
                <p className="text-sm text-muted-foreground">
                  {totalGeral.horas.toFixed(1)} {t('costsTab.workHours')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalGeral.custo)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
