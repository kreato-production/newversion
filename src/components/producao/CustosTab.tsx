import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MapPin,
  Wrench,
  Calculator,
  Clock,
  DollarSign,
  Building2,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  gravacoesRelacionamentosApi,
  type GravacaoCustoItem,
} from '@/modules/gravacoes/gravacoes-relacionamentos.api';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';

interface CustosTabProps {
  gravacaoId: string;
}

export const CustosTab = ({ gravacaoId }: CustosTabProps) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [itens, setItens] = useState<GravacaoCustoItem[]>([]);
  const [moeda, setMoeda] = useState<string>('BRL');

  const formatCurrency = useCallback((value: number) => formatCurrencyUtil(value, moeda), [moeda]);

  useEffect(() => {
    setIsLoading(true);
    gravacoesRelacionamentosApi
      .getCustos(gravacaoId)
      .then((result) => {
        setItens(result.itens);
        setMoeda(result.moeda);
      })
      .catch((err) => console.error('Erro ao carregar custos:', err))
      .finally(() => setIsLoading(false));
  }, [gravacaoId]);

  const categorias = itens.reduce<Record<string, GravacaoCustoItem[]>>((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {});

  const totalGeral = {
    horas: itens.reduce((acc, item) => acc + item.horas, 0),
    custo: itens.reduce((acc, item) => acc + item.custoTotal, 0),
  };

  const terceirosCat = t('thirdParties.title');

  const getIconCategoria = (categoria: string) => {
    if (categoria === t('costsTab.humanResources') || categoria === 'Recursos Humanos')
      return <Users className="h-4 w-4" />;
    if (categoria === t('costsTab.physicalResources') || categoria === 'Recursos Físicos')
      return <MapPin className="h-4 w-4" />;
    if (categoria === terceirosCat || categoria === 'Terceiros')
      return <Building2 className="h-4 w-4" />;
    return <Wrench className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('costsTab.noCosts')}</h3>
        <p className="text-xs text-muted-foreground max-w-sm">{t('costsTab.noCostsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t('costsTab.totalHours')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGeral.horas.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{t('costsTab.estimatedHours')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t('costsTab.totalCost')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalGeral.custo)}
            </div>
            <p className="text-xs text-muted-foreground">{t('costsTab.estimatedCost')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t('costsTab.costItems')}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itens.length}</div>
            <p className="text-xs text-muted-foreground">{t('costsTab.allocatedWithCost')}</p>
          </CardContent>
        </Card>
      </div>

      {Object.entries(categorias).map(([categoria, catItens]) => {
        const subtotal = catItens.reduce((acc, item) => acc + item.custoTotal, 0);
        const subtotalHoras = catItens.reduce((acc, item) => acc + item.horas, 0);
        const isTerceiros = categoria === terceirosCat;
        return (
          <Card key={categoria}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {getIconCategoria(categoria)}
                {categoria}
                <Badge variant="secondary" className="ml-2">
                  {formatCurrency(subtotal)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('costsTab.resource')}</TableHead>
                    {!isTerceiros && <TableHead>Atividade</TableHead>}
                    <TableHead>{t('common.description')}</TableHead>
                    {!isTerceiros && (
                      <>
                        <TableHead className="text-right">{t('costsTab.hours')}</TableHead>
                        <TableHead className="text-right">{t('costsTab.hourlyRate')}</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">{t('costs.totalCost')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catItens.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.recurso}</TableCell>
                      {!isTerceiros && (
                        <TableCell className="text-muted-foreground text-xs">
                          {item.atividade ?? '-'}
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">{item.descricao}</TableCell>
                      {!isTerceiros && (
                        <>
                          <TableCell className="text-right">{item.horas.toFixed(1)}h</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.custoUnitario)}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.custoTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={isTerceiros ? 2 : 3} className="font-medium">
                      {t('costsTab.subtotal')} - {categoria}
                    </TableCell>
                    {!isTerceiros && (
                      <>
                        <TableCell className="text-right font-medium">
                          {subtotalHoras.toFixed(1)}h
                        </TableCell>
                        <TableCell />
                      </>
                    )}
                    <TableCell className="text-right font-bold">
                      {formatCurrency(subtotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('costsTab.totalEstimatedCost')}</p>
                <p className="text-xs text-muted-foreground">
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
