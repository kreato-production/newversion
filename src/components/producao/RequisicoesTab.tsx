import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Wrench, MapPin, Clock, User, Package, Check } from 'lucide-react';
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
  gravacaoRecursoId: string; // the anchor row id
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

const RequisicoesTab = () => {
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState('tecnicos');
  const [requisicoesTecnicas, setRequisicoesTecnicas] = useState<RequisicaoRT[]>([]);
  const [requisicoesFisicas, setRequisicoesFisicas] = useState<RequisicaoRF[]>([]);
  const [loading, setLoading] = useState(true);

  // Popup state for technical resources
  const [selectedRT, setSelectedRT] = useState<RequisicaoRT | null>(null);
  const [rhCandidates, setRhCandidates] = useState<RHCandidate[]>([]);
  const [selectedRHId, setSelectedRHId] = useState<string | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Popup state for physical resources
  const [selectedRF, setSelectedRF] = useState<RequisicaoRF | null>(null);
  const [estoqueItems, setEstoqueItems] = useState<EstoqueItem[]>([]);
  const [selectedEstoqueId, setSelectedEstoqueId] = useState<string | null>(null);
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

  // Fetch pending requisitions
  const fetchRequisicoes = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all gravacao_recursos with recurso_tecnico that have NO recurso_humano (anchor rows)
      const { data: rtData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id,
          gravacao_id,
          recurso_tecnico_id,
          recurso_humano_id,
          hora_inicio,
          hora_fim,
          gravacoes!gravacao_recursos_gravacao_id_fkey(nome, data_prevista),
          recursos_tecnicos!gravacao_recursos_recurso_tecnico_id_fkey(nome)
        `)
        .not('recurso_tecnico_id', 'is', null)
        .is('recurso_humano_id', null);

      // For each anchor row, check if there are sibling rows with recurso_humano assigned
      const pendingRT: RequisicaoRT[] = [];
      for (const row of (rtData || [])) {
        // Check if any sibling row for same gravacao + recurso_tecnico has a recurso_humano
        const { count } = await supabase
          .from('gravacao_recursos')
          .select('id', { count: 'exact', head: true })
          .eq('gravacao_id', row.gravacao_id)
          .eq('recurso_tecnico_id', row.recurso_tecnico_id)
          .not('recurso_humano_id', 'is', null);

        if ((count || 0) === 0) {
          const gravacao = row.gravacoes as any;
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

      // Fetch all gravacao_recursos with recurso_fisico that don't have estoque item linked yet
      // For physical resources, we consider those allocated but without hora_inicio/hora_fim as pending
      const { data: rfData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id,
          gravacao_id,
          recurso_fisico_id,
          hora_inicio,
          hora_fim,
          gravacoes!gravacao_recursos_gravacao_id_fkey(nome, data_prevista),
          recursos_fisicos!gravacao_recursos_recurso_fisico_id_fkey(nome)
        `)
        .not('recurso_fisico_id', 'is', null);

      const pendingRF: RequisicaoRF[] = (rfData || []).map((row: any) => {
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
  }, []);

  useEffect(() => {
    fetchRequisicoes();
  }, [fetchRequisicoes]);

  // Group requisicoes by gravacao for display
  const groupedRT = useMemo(() => {
    const map = new Map<string, RequisicaoRT[]>();
    requisicoesTecnicas.forEach(r => {
      if (!map.has(r.gravacaoId)) map.set(r.gravacaoId, []);
      map.get(r.gravacaoId)!.push(r);
    });
    return Array.from(map.entries());
  }, [requisicoesTecnicas]);

  const groupedRF = useMemo(() => {
    const map = new Map<string, RequisicaoRF[]>();
    requisicoesFisicas.forEach(r => {
      if (!map.has(r.gravacaoId)) map.set(r.gravacaoId, []);
      map.get(r.gravacaoId)!.push(r);
    });
    return Array.from(map.entries());
  }, [requisicoesFisicas]);

  // Handle click on RT row - fetch candidates
  const handleRTClick = async (req: RequisicaoRT) => {
    setSelectedRT(req);
    setSelectedRHId(null);
    setLoadingCandidates(true);

    try {
      // Get the funcao_operador_id for this recurso tecnico
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

      // Fetch RH with matching funcao
      const { data: rhData } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome, foto_url, funcao_id, funcoes:funcao_id(nome)')
        .eq('funcao_id', funcaoId)
        .eq('status', 'Ativo');

      const candidates: RHCandidate[] = [];

      for (const rh of (rhData || [])) {
        // Fetch escalas for the date
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

        // Calculate total available time
        let totalDisponivelMin = 0;
        const escalasFormatted = escalasAtivas.map((e: any) => {
          const inicio = e.hora_inicio?.substring(0, 5) || '08:00';
          const fim = e.hora_fim?.substring(0, 5) || '18:00';
          totalDisponivelMin += calcularMinutos(inicio, fim);
          return { horaInicio: inicio, horaFim: fim };
        });

        // Fetch existing occupations for that date
        const { data: ocupData } = await supabase
          .from('gravacao_recursos')
          .select('hora_inicio, hora_fim, gravacao_id, gravacoes!gravacao_recursos_gravacao_id_fkey(nome, data_prevista)')
          .eq('recurso_humano_id', rh.id)
          .not('hora_inicio', 'is', null);

        const ocupacoes = (ocupData || [])
          .filter((o: any) => {
            const gravacao = o.gravacoes as any;
            return gravacao?.data_prevista === dataPrevista;
          })
          .map((o: any) => ({
            horaInicio: o.hora_inicio?.substring(0, 5) || '',
            horaFim: o.hora_fim?.substring(0, 5) || '',
            gravacao: (o.gravacoes as any)?.nome || '',
          }));

        let totalOcupadoMin = 0;
        ocupacoes.forEach((o: any) => {
          totalOcupadoMin += calcularMinutos(o.horaInicio, o.horaFim);
        });

        const tempoLivreMin = Math.max(0, totalDisponivelMin - totalOcupadoMin);
        const hours = Math.floor(tempoLivreMin / 60);
        const mins = tempoLivreMin % 60;

        candidates.push({
          id: rh.id,
          nome: rh.nome,
          sobrenome: rh.sobrenome,
          fotoUrl: rh.foto_url,
          funcao: (rh.funcoes as any)?.nome || '',
          tempoLivre: mins > 0 ? `${hours}h${mins}m` : `${hours}h`,
          tempoLivreMinutos: tempoLivreMin,
          escalas: escalasFormatted,
          ocupacoes,
        });
      }

      // Sort by most free time
      candidates.sort((a, b) => b.tempoLivreMinutos - a.tempoLivreMinutos);
      setRhCandidates(candidates);
    } catch (err) {
      console.error('Error fetching RH candidates:', err);
    }
    setLoadingCandidates(false);
  };

  // Handle confirm RH selection
  const handleConfirmRH = async () => {
    if (!selectedRT || !selectedRHId) return;
    try {
      // Insert a new gravacao_recursos row linking the RH to the RT for this gravacao
      const { error } = await supabase
        .from('gravacao_recursos')
        .insert({
          gravacao_id: selectedRT.gravacaoId,
          recurso_tecnico_id: selectedRT.recursoTecnicoId,
          recurso_humano_id: selectedRHId,
          hora_inicio: selectedRT.horaInicio || null,
          hora_fim: selectedRT.horaFim || null,
        });

      if (error) throw error;
      toast.success('Recurso humano associado com sucesso');
      setSelectedRT(null);
      fetchRequisicoes();
    } catch (err) {
      console.error('Error associating RH:', err);
      toast.error('Erro ao associar recurso humano');
    }
  };

  // Handle click on RF row - fetch stock items
  const handleRFClick = async (req: RequisicaoRF) => {
    setSelectedRF(req);
    setSelectedEstoqueId(null);
    setLoadingEstoque(true);
    try {
      const { data: estoqueData } = await supabase
        .from('rf_estoque_itens')
        .select('id, numerador, codigo, nome, imagem_url')
        .eq('recurso_fisico_id', req.recursoFisicoId)
        .order('numerador');

      setEstoqueItems((estoqueData || []).map((item: any) => ({
        id: item.id,
        numerador: item.numerador,
        codigo: item.codigo,
        nome: item.nome,
        imagemUrl: item.imagem_url,
        tempoUso: req.tempoGravacao || '-',
      })));
    } catch (err) {
      console.error('Error fetching estoque:', err);
    }
    setLoadingEstoque(false);
  };

  // Handle confirm RF selection (just close popup - the resource is already allocated)
  const handleConfirmRF = async () => {
    if (!selectedRF) return;
    // The physical resource is already allocated via gravacao_recursos
    // The selection from estoque is informational
    toast.success('Item de estoque selecionado');
    setSelectedRF(null);
    // Remove from list
    setRequisicoesFisicas(prev => prev.filter(r => r.gravacaoRecursoId !== selectedRF.gravacaoRecursoId));
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
      <Tabs value={subTab} onValueChange={setSubTab}>
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
                        <TableHead className="text-primary-foreground font-semibold">Recursos Técnico</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Data</TableHead>
                        <TableHead className="text-primary-foreground font-semibold text-center">Tempo de Gravação</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Recurso Humano</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedRT.map(([gravacaoId, items]) => (
                        items.map((req, idx) => (
                          <TableRow
                            key={req.gravacaoRecursoId}
                            className={`cursor-pointer hover:bg-accent/50 ${idx % 2 === 0 ? '' : 'bg-muted/30'}`}
                            onClick={() => handleRTClick(req)}
                          >
                            <TableCell className="font-medium">
                              {idx === 0 ? req.gravacaoNome : ''}
                            </TableCell>
                            <TableCell>{req.recursoTecnicoNome}</TableCell>
                            <TableCell>{formatDate(req.dataPrevista)}</TableCell>
                            <TableCell className="text-center">{req.tempoGravacao}</TableCell>
                            <TableCell className="text-muted-foreground">-</TableCell>
                          </TableRow>
                        ))
                      ))}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedRF.map(([gravacaoId, items]) => (
                        items.map((req, idx) => (
                          <TableRow
                            key={req.gravacaoRecursoId}
                            className={`cursor-pointer hover:bg-accent/50 ${idx % 2 === 0 ? '' : 'bg-muted/30'}`}
                            onClick={() => handleRFClick(req)}
                          >
                            <TableCell className="font-medium">
                              {idx === 0 ? req.gravacaoNome : ''}
                            </TableCell>
                            <TableCell>{req.recursoFisicoNome}</TableCell>
                            <TableCell>{formatDate(req.dataPrevista)}</TableCell>
                            <TableCell className="text-center">{req.tempoGravacao}</TableCell>
                          </TableRow>
                        ))
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Select RH for RT */}
      <Dialog open={!!selectedRT} onOpenChange={(open) => !open && setSelectedRT(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Selecionar Recurso Humano - {selectedRT?.recursoTecnicoNome}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Gravação: {selectedRT?.gravacaoNome} • Data: {selectedRT ? formatDate(selectedRT.dataPrevista) : ''}
            </p>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
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
                    selectedRHId === candidate.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50'
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
            <Button variant="outline" size="sm" onClick={() => setSelectedRT(null)}>Cancelar</Button>
            <Button size="sm" disabled={!selectedRHId} onClick={handleConfirmRH}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Select Estoque Item for RF */}
      <Dialog open={!!selectedRF} onOpenChange={(open) => !open && setSelectedRF(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Estoque - {selectedRF?.recursoFisicoNome}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Gravação: {selectedRF?.gravacaoNome} • Data: {selectedRF ? formatDate(selectedRF.dataPrevista) : ''} • Tempo: {selectedRF?.tempoGravacao}
            </p>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
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
                    selectedEstoqueId === item.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50'
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
            <Button variant="outline" size="sm" onClick={() => setSelectedRF(null)}>Cancelar</Button>
            <Button size="sm" disabled={!selectedEstoqueId} onClick={handleConfirmRF}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisicoesTab;
