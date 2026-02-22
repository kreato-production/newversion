import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Wrench, MapPin, Clock, Package, Check, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface RequisicaoRT {
  gravacaoId: string;
  gravacaoNome: string;
  recursoTecnicoId: string;
  recursoTecnicoNome: string;
  dataPrevista: string;
  horaInicio: string;
  horaFim: string;
  tempoGravacao: string;
  gravacaoRecursoId: string;
  // Local association state
  selectedRH?: { id: string; nome: string; sobrenome: string; fotoUrl: string | null } | null;
  associadoHoraInicio?: string;
  associadoHoraFim?: string;
  tempoAssociado?: string;
}

interface RequisicaoRF {
  gravacaoId: string;
  gravacaoNome: string;
  recursoFisicoId: string;
  recursoFisicoNome: string;
  dataPrevista: string;
  horaInicio: string;
  horaFim: string;
  tempoGravacao: string;
  gravacaoRecursoId: string;
  selectedEstoque?: { id: string; nome: string; numerador: number; imagemUrl: string | null } | null;
  associadoHoraInicio?: string;
  associadoHoraFim?: string;
  tempoAssociado?: string;
}

interface RHCandidate {
  id: string;
  nome: string;
  sobrenome: string;
  fotoUrl: string | null;
  funcao: string;
  tempoLivre: string;
  tempoLivreMinutos: number;
  escalas: { horaInicio: string; horaFim: string }[];
  ocupacoes: { horaInicio: string; horaFim: string; gravacao: string }[];
}

interface EstoqueItem {
  id: string;
  numerador: number;
  codigo: string | null;
  nome: string;
  imagemUrl: string | null;
  tempoUso: string;
}

interface RequisicoesTabProps {
  dateStart: string;
  dateEnd: string;
}

const RequisicoesTab = ({ dateStart, dateEnd }: RequisicoesTabProps) => {
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState('tecnicos');
  const [requisicoesTecnicas, setRequisicoesTecnicas] = useState<RequisicaoRT[]>([]);
  const [requisicoesFisicas, setRequisicoesFisicas] = useState<RequisicaoRF[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Popup state for technical resources
  const [selectedRTIndex, setSelectedRTIndex] = useState<number | null>(null);
  const [rhCandidates, setRhCandidates] = useState<RHCandidate[]>([]);
  const [selectedRHId, setSelectedRHId] = useState<string | null>(null);
  const [popupHoraInicio, setPopupHoraInicio] = useState('');
  const [popupHoraFim, setPopupHoraFim] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Popup state for physical resources
  const [selectedRFIndex, setSelectedRFIndex] = useState<number | null>(null);
  const [estoqueItems, setEstoqueItems] = useState<EstoqueItem[]>([]);
  const [selectedEstoqueId, setSelectedEstoqueId] = useState<string | null>(null);
  const [popupRFHoraInicio, setPopupRFHoraInicio] = useState('');
  const [popupRFHoraFim, setPopupRFHoraFim] = useState('');
  const [loadingEstoque, setLoadingEstoque] = useState(false);

  const calcularTempo = (inicio: string, fim: string): string => {
    if (!inicio || !fim) return '-';
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fim.split(':').map(Number);
    const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMin <= 0) return '-';
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  };

  const calcularMinutos = (inicio: string, fim: string): number => {
    if (!inicio || !fim) return 0;
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fim.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };

  const isInDateRange = (date: string) => {
    if (!date) return false;
    return date >= dateStart && date <= dateEnd;
  };

  const fetchRequisicoes = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rtData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id, gravacao_id, recurso_tecnico_id, recurso_humano_id, hora_inicio, hora_fim,
          gravacoes!gravacao_recursos_gravacao_id_fkey(nome, data_prevista),
          recursos_tecnicos!gravacao_recursos_recurso_tecnico_id_fkey(nome)
        `)
        .not('recurso_tecnico_id', 'is', null)
        .is('recurso_humano_id', null);

      const pendingRT: RequisicaoRT[] = [];
      for (const row of (rtData || [])) {
        const gravacao = row.gravacoes as any;
        if (!isInDateRange(gravacao?.data_prevista || '')) continue;
        const { count } = await supabase
          .from('gravacao_recursos')
          .select('id', { count: 'exact', head: true })
          .eq('gravacao_id', row.gravacao_id)
          .eq('recurso_tecnico_id', row.recurso_tecnico_id)
          .not('recurso_humano_id', 'is', null);

        if ((count || 0) === 0) {
          const recurso = row.recursos_tecnicos as any;
          pendingRT.push({
            gravacaoId: row.gravacao_id,
            gravacaoNome: gravacao?.nome || '',
            recursoTecnicoId: row.recurso_tecnico_id!,
            recursoTecnicoNome: recurso?.nome || '',
            dataPrevista: gravacao?.data_prevista || '',
            horaInicio: row.hora_inicio?.substring(0, 5) || '',
            horaFim: row.hora_fim?.substring(0, 5) || '',
            tempoGravacao: calcularTempo(
              row.hora_inicio?.substring(0, 5) || '',
              row.hora_fim?.substring(0, 5) || ''
            ),
            gravacaoRecursoId: row.id,
          });
        }
      }
      setRequisicoesTecnicas(pendingRT);

      const { data: rfData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id, gravacao_id, recurso_fisico_id, hora_inicio, hora_fim,
          gravacoes!gravacao_recursos_gravacao_id_fkey(nome, data_prevista),
          recursos_fisicos!gravacao_recursos_recurso_fisico_id_fkey(nome)
        `)
        .not('recurso_fisico_id', 'is', null);

      const pendingRF: RequisicaoRF[] = (rfData || [])
        .filter((row: any) => {
          const gravacao = row.gravacoes as any;
          return isInDateRange(gravacao?.data_prevista || '');
        })
        .map((row: any) => {
          const gravacao = row.gravacoes as any;
          const recurso = row.recursos_fisicos as any;
          return {
            gravacaoId: row.gravacao_id,
            gravacaoNome: gravacao?.nome || '',
            recursoFisicoId: row.recurso_fisico_id!,
            recursoFisicoNome: recurso?.nome || '',
            dataPrevista: gravacao?.data_prevista || '',
            horaInicio: row.hora_inicio?.substring(0, 5) || '',
            horaFim: row.hora_fim?.substring(0, 5) || '',
            tempoGravacao: calcularTempo(
              row.hora_inicio?.substring(0, 5) || '',
              row.hora_fim?.substring(0, 5) || ''
            ),
            gravacaoRecursoId: row.id,
          };
        });
      setRequisicoesFisicas(pendingRF);
    } catch (err) {
      console.error('Error fetching requisicoes:', err);
    }
    setLoading(false);
  }, [dateStart, dateEnd]);

  useEffect(() => {
    fetchRequisicoes();
  }, [fetchRequisicoes]);

  const groupedRT = useMemo(() => {
    const map = new Map<string, { index: number; req: RequisicaoRT }[]>();
    requisicoesTecnicas.forEach((r, i) => {
      if (!map.has(r.gravacaoId)) map.set(r.gravacaoId, []);
      map.get(r.gravacaoId)!.push({ index: i, req: r });
    });
    return Array.from(map.entries());
  }, [requisicoesTecnicas]);

  const groupedRF = useMemo(() => {
    const map = new Map<string, { index: number; req: RequisicaoRF }[]>();
    requisicoesFisicas.forEach((r, i) => {
      if (!map.has(r.gravacaoId)) map.set(r.gravacaoId, []);
      map.get(r.gravacaoId)!.push({ index: i, req: r });
    });
    return Array.from(map.entries());
  }, [requisicoesFisicas]);

  // Check if there are any pending associations
  const hasRTAssociations = requisicoesTecnicas.some(r => r.selectedRH);
  const hasRFAssociations = requisicoesFisicas.some(r => r.selectedEstoque);

  // Handle click on RT row
  const handleRTClick = async (globalIndex: number) => {
    const req = requisicoesTecnicas[globalIndex];
    setSelectedRTIndex(globalIndex);
    setSelectedRHId(req.selectedRH?.id || null);
    setPopupHoraInicio(req.associadoHoraInicio || req.horaInicio || '');
    setPopupHoraFim(req.associadoHoraFim || req.horaFim || '');
    setLoadingCandidates(true);

    try {
      const { data: rtData } = await supabase
        .from('recursos_tecnicos')
        .select('funcao_operador_id')
        .eq('id', req.recursoTecnicoId)
        .single();

      const funcaoId = rtData?.funcao_operador_id;
      if (!funcaoId) {
        setRhCandidates([]);
        setLoadingCandidates(false);
        return;
      }

      const { data: rhData } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome, foto_url, funcao_id, funcoes:funcao_id(nome)')
        .eq('funcao_id', funcaoId)
        .eq('status', 'Ativo');

      const candidates: RHCandidate[] = [];
      for (const rh of (rhData || [])) {
        const dataPrevista = req.dataPrevista;
        if (!dataPrevista) continue;
        const dayOfWeek = new Date(dataPrevista + 'T12:00:00').getDay();

        const { data: escalasData } = await supabase
          .from('rh_escalas')
          .select('hora_inicio, hora_fim, data_inicio, data_fim, dias_semana')
          .eq('recurso_humano_id', rh.id)
          .lte('data_inicio', dataPrevista)
          .gte('data_fim', dataPrevista);

        const escalasAtivas = (escalasData || []).filter((e: any) => {
          const dias = e.dias_semana || [1, 2, 3, 4, 5];
          return dias.includes(dayOfWeek);
        });
        if (escalasAtivas.length === 0) continue;

        let totalDisponivelMin = 0;
        const escalasFormatted = escalasAtivas.map((e: any) => {
          const inicio = e.hora_inicio?.substring(0, 5) || '08:00';
          const fim = e.hora_fim?.substring(0, 5) || '18:00';
          totalDisponivelMin += calcularMinutos(inicio, fim);
          return { horaInicio: inicio, horaFim: fim };
        });

        const { data: ocupData } = await supabase
          .from('gravacao_recursos')
          .select('hora_inicio, hora_fim, gravacao_id, gravacoes!gravacao_recursos_gravacao_id_fkey(nome, data_prevista)')
          .eq('recurso_humano_id', rh.id)
          .not('hora_inicio', 'is', null);

        const ocupacoes = (ocupData || [])
          .filter((o: any) => (o.gravacoes as any)?.data_prevista === dataPrevista)
          .map((o: any) => ({
            horaInicio: o.hora_inicio?.substring(0, 5) || '',
            horaFim: o.hora_fim?.substring(0, 5) || '',
            gravacao: (o.gravacoes as any)?.nome || '',
          }));

        let totalOcupadoMin = 0;
        ocupacoes.forEach((o: any) => { totalOcupadoMin += calcularMinutos(o.horaInicio, o.horaFim); });

        const tempoLivreMin = Math.max(0, totalDisponivelMin - totalOcupadoMin);
        const hours = Math.floor(tempoLivreMin / 60);
        const mins = tempoLivreMin % 60;

        candidates.push({
          id: rh.id, nome: rh.nome, sobrenome: rh.sobrenome, fotoUrl: rh.foto_url,
          funcao: (rh.funcoes as any)?.nome || '',
          tempoLivre: mins > 0 ? `${hours}h${mins}m` : `${hours}h`,
          tempoLivreMinutos: tempoLivreMin, escalas: escalasFormatted, ocupacoes,
        });
      }
      candidates.sort((a, b) => b.tempoLivreMinutos - a.tempoLivreMinutos);
      setRhCandidates(candidates);
    } catch (err) {
      console.error('Error fetching RH candidates:', err);
    }
    setLoadingCandidates(false);
  };

  // Confirm RH selection in popup (local only)
  const handleConfirmRHLocal = () => {
    if (selectedRTIndex === null || !selectedRHId) return;
    const candidate = rhCandidates.find(c => c.id === selectedRHId);
    if (!candidate) return;
    if (!popupHoraInicio || !popupHoraFim) {
      toast.error('Informe a hora de início e fim');
      return;
    }
    if (calcularMinutos(popupHoraInicio, popupHoraFim) <= 0) {
      toast.error('Hora de fim deve ser maior que hora de início');
      return;
    }

    setRequisicoesTecnicas(prev => {
      const updated = [...prev];
      updated[selectedRTIndex] = {
        ...updated[selectedRTIndex],
        selectedRH: { id: candidate.id, nome: candidate.nome, sobrenome: candidate.sobrenome, fotoUrl: candidate.fotoUrl },
        associadoHoraInicio: popupHoraInicio,
        associadoHoraFim: popupHoraFim,
        tempoAssociado: calcularTempo(popupHoraInicio, popupHoraFim),
      };
      return updated;
    });
    setSelectedRTIndex(null);
  };

  // Handle click on RF row
  const handleRFClick = async (globalIndex: number) => {
    const req = requisicoesFisicas[globalIndex];
    setSelectedRFIndex(globalIndex);
    setSelectedEstoqueId(req.selectedEstoque?.id || null);
    setPopupRFHoraInicio(req.associadoHoraInicio || req.horaInicio || '');
    setPopupRFHoraFim(req.associadoHoraFim || req.horaFim || '');
    setLoadingEstoque(true);
    try {
      const { data: estoqueData } = await supabase
        .from('rf_estoque_itens')
        .select('id, numerador, codigo, nome, imagem_url')
        .eq('recurso_fisico_id', req.recursoFisicoId)
        .order('numerador');

      setEstoqueItems((estoqueData || []).map((item: any) => ({
        id: item.id, numerador: item.numerador, codigo: item.codigo,
        nome: item.nome, imagemUrl: item.imagem_url, tempoUso: req.tempoGravacao || '-',
      })));
    } catch (err) {
      console.error('Error fetching estoque:', err);
    }
    setLoadingEstoque(false);
  };

  // Confirm RF selection in popup (local only)
  const handleConfirmRFLocal = () => {
    if (selectedRFIndex === null || !selectedEstoqueId) return;
    const item = estoqueItems.find(i => i.id === selectedEstoqueId);
    if (!item) return;
    if (!popupRFHoraInicio || !popupRFHoraFim) {
      toast.error('Informe a hora de início e fim');
      return;
    }
    if (calcularMinutos(popupRFHoraInicio, popupRFHoraFim) <= 0) {
      toast.error('Hora de fim deve ser maior que hora de início');
      return;
    }

    setRequisicoesFisicas(prev => {
      const updated = [...prev];
      updated[selectedRFIndex] = {
        ...updated[selectedRFIndex],
        selectedEstoque: { id: item.id, nome: item.nome, numerador: item.numerador, imagemUrl: item.imagemUrl },
        associadoHoraInicio: popupRFHoraInicio,
        associadoHoraFim: popupRFHoraFim,
        tempoAssociado: calcularTempo(popupRFHoraInicio, popupRFHoraFim),
      };
      return updated;
    });
    setSelectedRFIndex(null);
  };

  // BATCH SAVE: "Associar" button
  const handleAssociar = async () => {
    setSaving(true);
    try {
      // Save RT associations
      const rtToSave = requisicoesTecnicas.filter(r => r.selectedRH);
      for (const req of rtToSave) {
        const { error } = await supabase
          .from('gravacao_recursos')
          .insert({
            gravacao_id: req.gravacaoId,
            recurso_tecnico_id: req.recursoTecnicoId,
            recurso_humano_id: req.selectedRH!.id,
            hora_inicio: req.associadoHoraInicio || null,
            hora_fim: req.associadoHoraFim || null,
          });
        if (error) throw error;
      }

      // Save RF associations (update hora_inicio/hora_fim on existing row)
      const rfToSave = requisicoesFisicas.filter(r => r.selectedEstoque);
      for (const req of rfToSave) {
        const { error } = await supabase
          .from('gravacao_recursos')
          .update({
            hora_inicio: req.associadoHoraInicio || null,
            hora_fim: req.associadoHoraFim || null,
          })
          .eq('id', req.gravacaoRecursoId);
        if (error) throw error;
      }

      const totalSaved = rtToSave.length + rfToSave.length;
      if (totalSaved > 0) {
        toast.success(`${totalSaved} associação(ões) realizada(s) com sucesso`);
      }
      // Re-fetch to remove associated items
      await fetchRequisicoes();
    } catch (err) {
      console.error('Error saving associations:', err);
      toast.error('Erro ao salvar associações');
    }
    setSaving(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={subTab} onValueChange={setSubTab} className="flex-1">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="tecnicos" className="gap-2">
                <Wrench className="h-4 w-4" />
                Recursos Técnicos
              </TabsTrigger>
              <TabsTrigger value="fisicos" className="gap-2">
                <MapPin className="h-4 w-4" />
                Recursos Físicos
              </TabsTrigger>
            </TabsList>
            <Button
              size="sm"
              onClick={handleAssociar}
              disabled={saving || (!hasRTAssociations && !hasRFAssociations)}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              {saving ? 'Associando...' : 'Associar'}
            </Button>
          </div>

          {/* Sub-tab: Recursos Técnicos */}
          <TabsContent value="tecnicos" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
            ) : groupedRT.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma requisição pendente de recurso técnico
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary text-primary-foreground">
                          <TableHead className="text-primary-foreground font-semibold">Gravação</TableHead>
                          <TableHead className="text-primary-foreground font-semibold">Recurso Técnico</TableHead>
                          <TableHead className="text-primary-foreground font-semibold">Data</TableHead>
                          <TableHead className="text-primary-foreground font-semibold text-center">Tempo de Gravação</TableHead>
                          <TableHead className="text-primary-foreground font-semibold text-center">Tempo Associado</TableHead>
                          <TableHead className="text-primary-foreground font-semibold">Recurso Humano</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedRT.map(([gravacaoId, items]) =>
                          items.map(({ index: globalIdx, req }, localIdx) => (
                            <TableRow
                              key={req.gravacaoRecursoId}
                              className={`cursor-pointer hover:bg-accent/50 ${localIdx % 2 === 0 ? '' : 'bg-muted/30'} ${req.selectedRH ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                              onClick={() => handleRTClick(globalIdx)}
                            >
                              <TableCell className="font-medium">
                                {localIdx === 0 ? req.gravacaoNome : ''}
                              </TableCell>
                              <TableCell>{req.recursoTecnicoNome}</TableCell>
                              <TableCell>{formatDate(req.dataPrevista)}</TableCell>
                              <TableCell className="text-center">{req.tempoGravacao}</TableCell>
                              <TableCell className="text-center">
                                {req.tempoAssociado || '-'}
                              </TableCell>
                              <TableCell>
                                {req.selectedRH ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={req.selectedRH.fotoUrl || undefined} />
                                      <AvatarFallback className="text-[10px] bg-muted">
                                        {getInitials(req.selectedRH.nome, req.selectedRH.sobrenome)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">{req.selectedRH.nome} {req.selectedRH.sobrenome}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sub-tab: Recursos Físicos */}
          <TabsContent value="fisicos" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
            ) : groupedRF.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma requisição pendente de recurso físico
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary text-primary-foreground">
                          <TableHead className="text-primary-foreground font-semibold">Gravação</TableHead>
                          <TableHead className="text-primary-foreground font-semibold">Recurso Físico</TableHead>
                          <TableHead className="text-primary-foreground font-semibold">Data</TableHead>
                          <TableHead className="text-primary-foreground font-semibold text-center">Tempo de Gravação</TableHead>
                          <TableHead className="text-primary-foreground font-semibold text-center">Tempo Associado</TableHead>
                          <TableHead className="text-primary-foreground font-semibold">Item de Estoque</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedRF.map(([gravacaoId, items]) =>
                          items.map(({ index: globalIdx, req }, localIdx) => (
                            <TableRow
                              key={req.gravacaoRecursoId}
                              className={`cursor-pointer hover:bg-accent/50 ${localIdx % 2 === 0 ? '' : 'bg-muted/30'} ${req.selectedEstoque ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                              onClick={() => handleRFClick(globalIdx)}
                            >
                              <TableCell className="font-medium">
                                {localIdx === 0 ? req.gravacaoNome : ''}
                              </TableCell>
                              <TableCell>{req.recursoFisicoNome}</TableCell>
                              <TableCell>{formatDate(req.dataPrevista)}</TableCell>
                              <TableCell className="text-center">{req.tempoGravacao}</TableCell>
                              <TableCell className="text-center">
                                {req.tempoAssociado || '-'}
                              </TableCell>
                              <TableCell>
                                {req.selectedEstoque ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center overflow-hidden">
                                      {req.selectedEstoque.imagemUrl ? (
                                        <img src={req.selectedEstoque.imagemUrl} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <Package className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                    <span className="text-xs font-medium">#{req.selectedEstoque.numerador} - {req.selectedEstoque.nome}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Select RH for RT */}
      <Dialog open={selectedRTIndex !== null} onOpenChange={(open) => !open && setSelectedRTIndex(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Selecionar Recurso Humano - {selectedRTIndex !== null ? requisicoesTecnicas[selectedRTIndex]?.recursoTecnicoNome : ''}
            </DialogTitle>
            <p className="text-xs text-white/80 mt-1">
              Gravação: {selectedRTIndex !== null ? requisicoesTecnicas[selectedRTIndex]?.gravacaoNome : ''} • Data: {selectedRTIndex !== null ? formatDate(requisicoesTecnicas[selectedRTIndex]?.dataPrevista) : ''}
            </p>
          </DialogHeader>

          {/* Time inputs */}
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hora Início</label>
              <Input type="time" value={popupHoraInicio} onChange={e => setPopupHoraInicio(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hora Fim</label>
              <Input type="time" value={popupHoraFim} onChange={e => setPopupHoraFim(e.target.value)} className="h-8 text-xs" />
            </div>
            {popupHoraInicio && popupHoraFim && calcularMinutos(popupHoraInicio, popupHoraFim) > 0 && (
              <div className="pt-4">
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {calcularTempo(popupHoraInicio, popupHoraFim)}
                </Badge>
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {loadingCandidates ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Carregando candidatos...</div>
            ) : rhCandidates.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum recurso humano disponível para esta função
              </div>
            ) : (
              rhCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRHId === candidate.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedRHId(candidate.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={candidate.fotoUrl || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(candidate.nome, candidate.sobrenome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{candidate.nome} {candidate.sobrenome}</div>
                    <div className="text-xs text-muted-foreground">{candidate.funcao}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={candidate.tempoLivreMinutos > 0 ? 'default' : 'destructive'} className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {candidate.tempoLivre} livre
                    </Badge>
                    {selectedRHId === candidate.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedRTIndex(null)}>Cancelar</Button>
            <Button size="sm" disabled={!selectedRHId || !popupHoraInicio || !popupHoraFim} onClick={handleConfirmRHLocal}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Select Estoque Item for RF */}
      <Dialog open={selectedRFIndex !== null} onOpenChange={(open) => !open && setSelectedRFIndex(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Estoque - {selectedRFIndex !== null ? requisicoesFisicas[selectedRFIndex]?.recursoFisicoNome : ''}
            </DialogTitle>
            <p className="text-xs text-white/80 mt-1">
              Gravação: {selectedRFIndex !== null ? requisicoesFisicas[selectedRFIndex]?.gravacaoNome : ''} • Data: {selectedRFIndex !== null ? formatDate(requisicoesFisicas[selectedRFIndex]?.dataPrevista) : ''}
            </p>
          </DialogHeader>

          {/* Time inputs */}
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hora Início</label>
              <Input type="time" value={popupRFHoraInicio} onChange={e => setPopupRFHoraInicio(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hora Fim</label>
              <Input type="time" value={popupRFHoraFim} onChange={e => setPopupRFHoraFim(e.target.value)} className="h-8 text-xs" />
            </div>
            {popupRFHoraInicio && popupRFHoraFim && calcularMinutos(popupRFHoraInicio, popupRFHoraFim) > 0 && (
              <div className="pt-4">
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {calcularTempo(popupRFHoraInicio, popupRFHoraFim)}
                </Badge>
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {loadingEstoque ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Carregando estoque...</div>
            ) : estoqueItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum item de estoque disponível
              </div>
            ) : (
              estoqueItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEstoqueId === item.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedEstoqueId(item.id)}
                >
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {item.imagemUrl ? (
                      <img src={item.imagemUrl} alt={item.nome} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">#{item.numerador} - {item.nome}</div>
                    {item.codigo && <div className="text-xs text-muted-foreground">Cód: {item.codigo}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.tempoUso}
                    </Badge>
                    {selectedEstoqueId === item.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedRFIndex(null)}>Cancelar</Button>
            <Button size="sm" disabled={!selectedEstoqueId || !popupRFHoraInicio || !popupRFHoraFim} onClick={handleConfirmRFLocal}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisicoesTab;
