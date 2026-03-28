import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Clock, Link2, MapPin, Package, Wrench } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ApiAlocacoesRepository,
  type OverviewAllocationRow,
} from '@/modules/alocacoes/alocacoes.api';
import { ApiGravacoesRepository } from '@/modules/gravacoes/gravacoes.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import type { RecursoFisico } from '@/modules/recursos-fisicos/recursos-fisicos.types';
import { ApiRecursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.api.repository';
import type {
  RecursoHumano,
  RecursoHumanoOcupacao,
} from '@/modules/recursos-humanos/recursos-humanos.types';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';
import type { RecursoTecnico } from '@/modules/recursos-tecnicos/recursos-tecnicos.types';

type RTItem = {
  gravacaoId: string;
  gravacaoNome: string;
  recursoId: string;
  recursoNome: string;
  dataPrevista: string;
  horaInicio: string;
  horaFim: string;
  tempoGravacao: string;
  anchorId: string;
  selectedRh?: { id: string; nome: string; sobrenome: string; foto?: string } | null;
  associadoHoraInicio?: string;
  associadoHoraFim?: string;
  tempoAssociado?: string;
};

type RFItem = {
  gravacaoId: string;
  gravacaoNome: string;
  recursoId: string;
  recursoNome: string;
  dataPrevista: string;
  horaInicio: string;
  horaFim: string;
  tempoGravacao: string;
  anchorId: string;
  selectedEstoque?: { id: string; nome: string; numerador: number; imagemUrl?: string } | null;
  associadoHoraInicio?: string;
  associadoHoraFim?: string;
  tempoAssociado?: string;
};

type Candidate = {
  id: string;
  nome: string;
  sobrenome: string;
  foto?: string;
  funcao: string;
  tempoLivre: string;
  tempoLivreMinutos: number;
};

type StockItem = {
  id: string;
  numerador: number;
  codigo: string;
  nome: string;
  imagemUrl?: string;
};

interface RequisicoesTabProps {
  dateStart: string;
  dateEnd: string;
}

const alocacoesApi = new ApiAlocacoesRepository();
const gravacoesApi = new ApiGravacoesRepository();
const recursosTecnicosApi = new ApiRecursosTecnicosRepository();
const recursosHumanosApi = new ApiRecursosHumanosRepository();
const recursosFisicosApi = new ApiRecursosFisicosRepository();

const minutos = (inicio: string, fim: string) => {
  if (!inicio || !fim) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
};

const tempo = (inicio: string, fim: string) => {
  const total = minutos(inicio, fim);
  if (total <= 0) return '-';
  const horas = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${horas}h${mins}m` : `${horas}h`;
};

const iniciais = (nome: string, sobrenome: string) =>
  `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();

const RequisicoesTab = ({ dateStart, dateEnd }: RequisicoesTabProps) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState('tecnicos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tecnicos, setTecnicos] = useState<RTItem[]>([]);
  const [fisicos, setFisicos] = useState<RFItem[]>([]);
  const [rtDialog, setRtDialog] = useState<number | null>(null);
  const [rfDialog, setRfDialog] = useState<number | null>(null);
  const [rhCandidates, setRhCandidates] = useState<Candidate[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedRhId, setSelectedRhId] = useState<string | null>(null);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [rtHoraInicio, setRtHoraInicio] = useState('');
  const [rtHoraFim, setRtHoraFim] = useState('');
  const [rfHoraInicio, setRfHoraInicio] = useState('');
  const [rfHoraFim, setRfHoraFim] = useState('');
  const [rhBusy, setRhBusy] = useState(false);
  const [stockBusy, setStockBusy] = useState(false);
  const [gravacoes, setGravacoes] = useState<Map<string, { nome: string; dataPrevista: string }>>(
    new Map(),
  );
  const [recursosTecnicos, setRecursosTecnicos] = useState<Map<string, RecursoTecnico>>(new Map());
  const [recursosHumanos, setRecursosHumanos] = useState<Map<string, RecursoHumano>>(new Map());
  const [recursosFisicos, setRecursosFisicos] = useState<Map<string, RecursoFisico>>(new Map());
  const [ocupacoesRh, setOcupacoesRh] = useState<RecursoHumanoOcupacao[]>([]);

  const inRange = (date?: string) => Boolean(date && date >= dateStart && date <= dateEnd);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, gravacoesRows, rtRows, rhRows, rfRows, ocupacoesRows] = await Promise.all([
        alocacoesApi.listOverview(),
        gravacoesApi.list(),
        recursosTecnicosApi.list(),
        recursosHumanosApi.list(),
        recursosFisicosApi.list(),
        recursosHumanosApi.listOcupacoes(dateStart, dateEnd),
      ]);

      const gravMap = new Map(
        gravacoesRows.map((item) => [
          item.id,
          { nome: item.nome, dataPrevista: item.dataPrevista },
        ]),
      );
      const rtMap = new Map(rtRows.map((item) => [item.id, item]));
      const rhMap = new Map(rhRows.map((item) => [item.id, item]));
      const rfMap = new Map(rfRows.map((item) => [item.id, item]));

      setGravacoes(gravMap);
      setRecursosTecnicos(rtMap);
      setRecursosHumanos(rhMap);
      setRecursosFisicos(rfMap);
      setOcupacoesRh(ocupacoesRows);

      const children = new Map<string, OverviewAllocationRow[]>();
      overview.alocacoes.forEach((row) => {
        if (!row.parentRecursoId) return;
        const current = children.get(row.parentRecursoId) ?? [];
        current.push(row);
        children.set(row.parentRecursoId, current);
      });

      const nextRt: RTItem[] = [];
      const nextRf: RFItem[] = [];

      overview.alocacoes.forEach((row) => {
        if (row.parentRecursoId || row.recursoHumanoId) return;
        const gravacao = gravMap.get(row.gravacaoId);
        if (!gravacao || !inRange(gravacao.dataPrevista)) return;

        if (row.recursoTecnicoId) {
          const hasRhChild = (children.get(row.id) ?? []).some((child) =>
            Boolean(child.recursoHumanoId),
          );
          if (!hasRhChild) {
            nextRt.push({
              gravacaoId: row.gravacaoId,
              gravacaoNome: gravacao.nome,
              recursoId: row.recursoTecnicoId,
              recursoNome: row.recursoTecnicoNome || '',
              dataPrevista: gravacao.dataPrevista,
              horaInicio: row.horaInicio?.slice(0, 5) || '',
              horaFim: row.horaFim?.slice(0, 5) || '',
              tempoGravacao: tempo(
                row.horaInicio?.slice(0, 5) || '',
                row.horaFim?.slice(0, 5) || '',
              ),
              anchorId: row.id,
            });
          }
          return;
        }

        if (row.recursoFisicoId && !row.estoqueItemId) {
          nextRf.push({
            gravacaoId: row.gravacaoId,
            gravacaoNome: gravacao.nome,
            recursoId: row.recursoFisicoId,
            recursoNome: row.recursoFisicoNome || '',
            dataPrevista: gravacao.dataPrevista,
            horaInicio: row.horaInicio?.slice(0, 5) || '',
            horaFim: row.horaFim?.slice(0, 5) || '',
            tempoGravacao: tempo(row.horaInicio?.slice(0, 5) || '', row.horaFim?.slice(0, 5) || ''),
            anchorId: row.id,
          });
        }
      });

      setTecnicos(nextRt);
      setFisicos(nextRf);
    } catch (error) {
      console.error('Error fetching requisicoes:', error);
      toast.error('Erro ao carregar requisiÃ§Ãµes');
    } finally {
      setLoading(false);
    }
  }, [dateEnd, dateStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupedRt = useMemo(() => {
    const map = new Map<string, { index: number; req: RTItem }[]>();
    tecnicos.forEach((req, index) => {
      const current = map.get(req.gravacaoId) ?? [];
      current.push({ index, req });
      map.set(req.gravacaoId, current);
    });
    return Array.from(map.entries());
  }, [tecnicos]);

  const groupedRf = useMemo(() => {
    const map = new Map<string, { index: number; req: RFItem }[]>();
    fisicos.forEach((req, index) => {
      const current = map.get(req.gravacaoId) ?? [];
      current.push({ index, req });
      map.set(req.gravacaoId, current);
    });
    return Array.from(map.entries());
  }, [fisicos]);

  const openRtDialog = async (index: number) => {
    const req = tecnicos[index];
    const recurso = recursosTecnicos.get(req.recursoId);
    setRtDialog(index);
    setSelectedRhId(req.selectedRh?.id || null);
    setRtHoraInicio(req.associadoHoraInicio || req.horaInicio || '');
    setRtHoraFim(req.associadoHoraFim || req.horaFim || '');
    setRhBusy(true);

    try {
      const funcaoId = recurso?.funcaoOperadorId;
      if (!funcaoId) {
        setRhCandidates([]);
        return;
      }

      const dayOfWeek = new Date(`${req.dataPrevista}T12:00:00`).getDay();
      const candidates: Candidate[] = [];
      recursosHumanos.forEach((rh) => {
        if (rh.status !== 'Ativo' || rh.funcaoId !== funcaoId) return;
        const escalas = (rh.escalas || []).filter(
          (item) =>
            item.dataInicio <= req.dataPrevista &&
            item.dataFim >= req.dataPrevista &&
            (item.diasSemana || [1, 2, 3, 4, 5]).includes(dayOfWeek),
        );
        if (escalas.length === 0) return;
        const livre = Math.max(
          0,
          escalas.reduce((sum, item) => sum + minutos(item.horaInicio, item.horaFim), 0) -
            ocupacoesRh
              .filter((item) => item.recursoId === rh.id && item.data === req.dataPrevista)
              .reduce((sum, item) => sum + minutos(item.horaInicio, item.horaFim), 0),
        );
        const horas = Math.floor(livre / 60);
        const mins = livre % 60;
        candidates.push({
          id: rh.id,
          nome: rh.nome,
          sobrenome: rh.sobrenome,
          foto: rh.foto,
          funcao: rh.funcao,
          tempoLivre: mins > 0 ? `${horas}h${mins}m` : `${horas}h`,
          tempoLivreMinutos: livre,
        });
      });
      candidates.sort((a, b) => b.tempoLivreMinutos - a.tempoLivreMinutos);
      setRhCandidates(candidates);
    } finally {
      setRhBusy(false);
    }
  };

  const openRfDialog = (index: number) => {
    const req = fisicos[index];
    const recurso = recursosFisicos.get(req.recursoId);
    setRfDialog(index);
    setSelectedStockId(req.selectedEstoque?.id || null);
    setRfHoraInicio(req.associadoHoraInicio || req.horaInicio || '');
    setRfHoraFim(req.associadoHoraFim || req.horaFim || '');
    setStockBusy(true);
    setStockItems(
      (recurso?.estoqueItens || []).map((item) => ({
        id: item.id,
        numerador: item.numerador,
        codigo: item.codigo,
        nome: item.nome,
        imagemUrl: item.imagemUrl,
      })),
    );
    setStockBusy(false);
  };

  const confirmRt = () => {
    if (rtDialog === null || !selectedRhId || minutos(rtHoraInicio, rtHoraFim) <= 0) {
      toast.error('Preencha o horÃ¡rio corretamente');
      return;
    }
    const rh = rhCandidates.find((item) => item.id === selectedRhId);
    if (!rh) return;
    setTecnicos((current) =>
      current.map((item, index) =>
        index === rtDialog
          ? {
              ...item,
              selectedRh: { id: rh.id, nome: rh.nome, sobrenome: rh.sobrenome, foto: rh.foto },
              associadoHoraInicio: rtHoraInicio,
              associadoHoraFim: rtHoraFim,
              tempoAssociado: tempo(rtHoraInicio, rtHoraFim),
            }
          : item,
      ),
    );
    setRtDialog(null);
  };

  const confirmRf = () => {
    if (rfDialog === null || !selectedStockId || minutos(rfHoraInicio, rfHoraFim) <= 0) {
      toast.error('Preencha o horÃ¡rio corretamente');
      return;
    }
    const stock = stockItems.find((item) => item.id === selectedStockId);
    if (!stock) return;
    setFisicos((current) =>
      current.map((item, index) =>
        index === rfDialog
          ? {
              ...item,
              selectedEstoque: {
                id: stock.id,
                nome: stock.nome,
                numerador: stock.numerador,
                imagemUrl: stock.imagemUrl,
              },
              associadoHoraInicio: rfHoraInicio,
              associadoHoraFim: rfHoraFim,
              tempoAssociado: tempo(rfHoraInicio, rfHoraFim),
            }
          : item,
      ),
    );
    setRfDialog(null);
  };

  const associar = async () => {
    setSaving(true);
    try {
      for (const item of tecnicos.filter((entry) => entry.selectedRh)) {
        await alocacoesApi.addColaborador(item.gravacaoId, item.anchorId, {
          recursoHumanoId: item.selectedRh!.id,
          horaInicio: item.associadoHoraInicio || item.horaInicio || '08:00',
          horaFim: item.associadoHoraFim || item.horaFim || '18:00',
        });
      }
      for (const item of fisicos.filter((entry) => entry.selectedEstoque)) {
        await alocacoesApi.updateHorario(item.gravacaoId, item.anchorId, {
          horaInicio: item.associadoHoraInicio || null,
          horaFim: item.associadoHoraFim || null,
          estoqueItemId: item.selectedEstoque!.id,
        });
      }
      toast.success('AssociaÃ§Ãµes salvas com sucesso');
      await load();
    } catch (error) {
      console.error('Error saving associations:', error);
      toast.error('Erro ao salvar associaÃ§Ãµes');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  };

  const tableCard = (
    groups: Array<[string, Array<{ index: number; req: RTItem | RFItem }>]>,
    type: 'rt' | 'rf',
  ) =>
    groups.map(([gravacaoId, items]) => (
      <Card key={gravacaoId}>
        <CardContent className="p-0">
          <div className="bg-muted/50 px-3 py-2 border-b">
            <span className="font-medium text-sm">{items[0].req.gravacaoNome}</span>
            <Badge variant="outline" className="ml-2 text-[10px]">
              {formatDate(items[0].req.dataPrevista)}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  {type === 'rt' ? 'Recurso TÃ©cnico' : 'Recurso FÃ­sico'}
                </TableHead>
                <TableHead className="text-xs">Tempo</TableHead>
                <TableHead className="text-xs">
                  {type === 'rt' ? 'AssociaÃ§Ã£o' : 'Estoque'}
                </TableHead>
                <TableHead className="text-xs">Tempo Associado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(({ index, req }) => (
                <TableRow
                  key={req.anchorId}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => (type === 'rt' ? void openRtDialog(index) : openRfDialog(index))}
                >
                  <TableCell className="text-xs font-medium">{req.recursoNome}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {req.tempoGravacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {type === 'rt' ? (
                      (req as RTItem).selectedRh ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={(req as RTItem).selectedRh?.foto || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {iniciais(
                                (req as RTItem).selectedRh!.nome,
                                (req as RTItem).selectedRh!.sobrenome,
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {(req as RTItem).selectedRh!.nome}{' '}
                            {(req as RTItem).selectedRh!.sobrenome}
                          </span>
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Clique para associar</span>
                      )
                    ) : (req as RFItem).selectedEstoque ? (
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <span>
                          #{(req as RFItem).selectedEstoque!.numerador} -{' '}
                          {(req as RFItem).selectedEstoque!.nome}
                        </span>
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Clique para associar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {req.tempoAssociado ? (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {req.tempoAssociado}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    ));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="tecnicos" className="gap-2">
                <Wrench className="h-4 w-4" />
                Recursos TÃ©cnicos
              </TabsTrigger>
              <TabsTrigger value="fisicos" className="gap-2">
                <MapPin className="h-4 w-4" />
                Recursos FÃ­sicos
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={associar}
              disabled={
                saving ||
                (!tecnicos.some((item) => item.selectedRh) &&
                  !fisicos.some((item) => item.selectedEstoque))
              }
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Associar'}
            </Button>
          </div>
          <TabsContent value="tecnicos">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : groupedRt.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum recurso tÃ©cnico pendente de associaÃ§Ã£o neste perÃ­odo.
              </div>
            ) : (
              <div className="space-y-4">
                {tableCard(
                  groupedRt as Array<[string, Array<{ index: number; req: RTItem | RFItem }>]>,
                  'rt',
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="fisicos">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : groupedRf.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum recurso fÃ­sico pendente de associaÃ§Ã£o neste perÃ­odo.
              </div>
            ) : (
              <div className="space-y-4">
                {tableCard(
                  groupedRf as Array<[string, Array<{ index: number; req: RTItem | RFItem }>]>,
                  'rf',
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={rtDialog !== null} onOpenChange={(open) => !open && setRtDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Associar recurso humano</DialogTitle>
          </DialogHeader>
          {rhBusy ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hora InÃ­cio</label>
                  <Input
                    type="time"
                    value={rtHoraInicio}
                    onChange={(event) => setRtHoraInicio(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora Fim</label>
                  <Input
                    type="time"
                    value={rtHoraFim}
                    onChange={(event) => setRtHoraFim(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {rhCandidates.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    Nenhum recurso humano elegÃ­vel encontrado.
                  </div>
                ) : (
                  rhCandidates.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full border rounded-lg p-3 text-left transition-colors ${selectedRhId === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedRhId(item.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={item.foto || undefined} />
                            <AvatarFallback>{iniciais(item.nome, item.sobrenome)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {item.nome} {item.sobrenome}
                            </div>
                            <div className="text-xs text-muted-foreground">{item.funcao}</div>
                          </div>
                        </div>
                        <Badge variant="outline">{item.tempoLivre} livres</Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRtDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmRt} disabled={!selectedRhId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rfDialog !== null} onOpenChange={(open) => !open && setRfDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Associar item de estoque</DialogTitle>
          </DialogHeader>
          {stockBusy ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hora InÃ­cio</label>
                  <Input
                    type="time"
                    value={rfHoraInicio}
                    onChange={(event) => setRfHoraInicio(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora Fim</label>
                  <Input
                    type="time"
                    value={rfHoraFim}
                    onChange={(event) => setRfHoraFim(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {stockItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    Nenhum item de estoque encontrado para este recurso.
                  </div>
                ) : (
                  stockItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full border rounded-lg p-3 text-left transition-colors ${selectedStockId === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedStockId(item.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">
                            #{item.numerador} - {item.nome}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.codigo || 'Sem cÃ³digo'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRfDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmRf} disabled={!selectedStockId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisicoesTab;
