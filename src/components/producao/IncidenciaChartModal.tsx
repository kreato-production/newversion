import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, startOfWeek, getISOWeek, parseISO } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

interface IncidenciaChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ data_incidencia: string | null; severidade_cor?: string | null }>;
}

export const IncidenciaChartModal = ({ isOpen, onClose, items }: IncidenciaChartModalProps) => {
  const { t, language } = useLanguage();
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const locale = language === 'pt' ? ptBR : language === 'es' ? es : enUS;

  const chartData = useMemo(() => {
    const validItems = items.filter((i) => i.data_incidencia);
    const grouped: Record<string, number> = {};

    validItems.forEach((item) => {
      const date = parseISO(item.data_incidencia!);
      let key = '';
      switch (granularity) {
        case 'day':
          key = format(date, 'dd/MM/yyyy');
          break;
        case 'week': {
          const weekStart = startOfWeek(date, { locale });
          key = `S${getISOWeek(date)} - ${format(weekStart, 'dd/MM', { locale })}`;
          break;
        }
        case 'month':
          key = format(date, 'MMM/yyyy', { locale });
          break;
        case 'year':
          key = format(date, 'yyyy');
          break;
      }
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, granularity, locale]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{t('incident.chartTitle')}</DialogTitle>
          <DialogDescription>
            {t('incident.totalIncidents')}: {items.filter((i) => i.data_incidencia).length}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={granularity}
          onValueChange={(v) => setGranularity(v as 'day' | 'week' | 'month' | 'year')}
        >
          <TabsList className="w-full">
            <TabsTrigger value="day" className="flex-1">
              {t('incident.byDay')}
            </TabsTrigger>
            <TabsTrigger value="week" className="flex-1">
              {t('incident.byWeek')}
            </TabsTrigger>
            <TabsTrigger value="month" className="flex-1">
              {t('incident.byMonth')}
            </TabsTrigger>
            <TabsTrigger value="year" className="flex-1">
              {t('incident.byYear')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={granularity} className="mt-4">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                {t('common.noResults')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Bar dataKey="total" name={t('incident.totalIncidents')} radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
