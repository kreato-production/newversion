import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Building2, Calculator, Clock, DollarSign, Film } from 'lucide-react';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface RecursoHumanoAlocado {
  id: string;
  recursoHumanoId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
}

interface HorarioOcupacao {
  horaInicio: string;
  horaFim: string;
}

interface RecursoAlocado {
  id: string;
  tipo: 'tecnico' | 'fisico';
  recursoId: string;
  recursoNome: string;
  alocacoes: Record<string, number>;
  recursosHumanos: Record<string, RecursoHumanoAlocado[]>;
  horarios: Record<string, HorarioOcupacao>;
}

interface RecursoHumano {
  id: string;
  nome: string;
  sobrenome?: string;
  custoHora: number;
  cargo?: string;
}

interface RecursoFisico {
  id: string;
  nome: string;
  custoHora: number;
}

interface Gravacao {
  id: string;
  codigo: string;
  nome: string;
  conteudoId?: string;
}

interface TerceiroAlocado {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoId: string;
  servicoNome: string;
  custo: number;
}

interface CustoItem {
  gravacaoNome: string;
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
  tipo: 'humano' | 'fisico' | 'tecnico' | 'terceiro';
}

interface ConteudoCustosTabProps {
  conteudoId: string;
  conteudoNome?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const calcularHorasEntreTempo = (inicio: string, fim: string): number => {
  if (!inicio || !fim) return 0;
  
  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);
  
  const totalMinutosInicio = horaInicio * 60 + minInicio;
  const totalMinutosFim = horaFim * 60 + minFim;
  
  const diferencaMinutos = totalMinutosFim - totalMinutosInicio;
  return diferencaMinutos > 0 ? diferencaMinutos / 60 : 0;
};

export const ConteudoCustosTab = ({ conteudoId, conteudoNome }: ConteudoCustosTabProps) => {
  const { toast } = useToast();
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoFisico[]>([]);
  const [allRecursos, setAllRecursos] = useState<Record<string, RecursoAlocado[]>>({});
  const [allTerceiros, setAllTerceiros] = useState<Record<string, TerceiroAlocado[]>>({});

  useEffect(() => {
    // Carregar gravações do conteúdo
    const storedGravacoes = localStorage.getItem('kreato_gravacoes');
    const allGravacoes: Gravacao[] = storedGravacoes ? JSON.parse(storedGravacoes) : [];
    const gravacoesDoConteudo = allGravacoes.filter((g) => g.conteudoId === conteudoId);
    setGravacoes(gravacoesDoConteudo);

    // Carregar cadastro de recursos humanos
    const storedRH = localStorage.getItem('kreato_recursos_humanos');
    if (storedRH) {
      setRecursosHumanos(JSON.parse(storedRH));
    }

    // Carregar cadastro de recursos físicos
    const storedFisicos = localStorage.getItem('kreato_recursos_fisicos');
    if (storedFisicos) {
      setRecursosFisicos(JSON.parse(storedFisicos));
    }

    // Carregar recursos e terceiros de cada gravação
    const recursos: Record<string, RecursoAlocado[]> = {};
    const terceiros: Record<string, TerceiroAlocado[]> = {};

    gravacoesDoConteudo.forEach((gravacao) => {
      const storedRecursos = localStorage.getItem(`kreato_gravacao_recursos_${gravacao.id}`);
      if (storedRecursos) {
        recursos[gravacao.id] = JSON.parse(storedRecursos);
      }

      const storedTerceiros = localStorage.getItem(`kreato_gravacao_terceiros_${gravacao.id}`);
      if (storedTerceiros) {
        terceiros[gravacao.id] = JSON.parse(storedTerceiros);
      }
    });

    setAllRecursos(recursos);
    setAllTerceiros(terceiros);
  }, [conteudoId]);

  const custos = useMemo(() => {
    const itens: CustoItem[] = [];

    gravacoes.forEach((gravacao) => {
      const recursos = allRecursos[gravacao.id] || [];
      const terceiros = allTerceiros[gravacao.id] || [];

      recursos.forEach((recurso) => {
        if (recurso.tipo === 'fisico') {
          const recursoFisico = recursosFisicos.find((rf) => rf.id === recurso.recursoId);
          const custoHora = recursoFisico?.custoHora || 0;

          let totalHoras = 0;
          const diasUtilizados: string[] = [];

          Object.entries(recurso.horarios || {}).forEach(([dia, horario]) => {
            const horas = calcularHorasEntreTempo(horario.horaInicio, horario.horaFim);
            if (horas > 0) {
              totalHoras += horas;
              diasUtilizados.push(dia);
            }
          });

          if (totalHoras > 0) {
            itens.push({
              gravacaoNome: gravacao.nome,
              categoria: 'Recursos Físicos',
              recurso: recurso.recursoNome,
              descricao: `${diasUtilizados.length} dia(s) de ocupação`,
              horas: totalHoras,
              custoUnitario: custoHora,
              custoTotal: totalHoras * custoHora,
              tipo: 'fisico',
            });
          }
        } else if (recurso.tipo === 'tecnico') {
          const rhPorColaborador: Record<string, { nome: string; horas: number; dias: number }> = {};

          Object.entries(recurso.recursosHumanos || {}).forEach(([dia, rhList]) => {
            rhList.forEach((rh) => {
              const horas = calcularHorasEntreTempo(rh.horaInicio, rh.horaFim);
              if (!rhPorColaborador[rh.recursoHumanoId]) {
                rhPorColaborador[rh.recursoHumanoId] = { nome: rh.nome, horas: 0, dias: 0 };
              }
              rhPorColaborador[rh.recursoHumanoId].horas += horas;
              rhPorColaborador[rh.recursoHumanoId].dias += 1;
            });
          });

          Object.entries(rhPorColaborador).forEach(([rhId, dados]) => {
            const colaborador = recursosHumanos.find((rh) => rh.id === rhId);
            const custoHora = colaborador?.custoHora || 0;

            if (dados.horas > 0) {
              itens.push({
                gravacaoNome: gravacao.nome,
                categoria: 'Recursos Humanos',
                recurso: dados.nome,
                descricao: `${dados.dias} dia(s) em ${recurso.recursoNome}`,
                horas: dados.horas,
                custoUnitario: custoHora,
                custoTotal: dados.horas * custoHora,
                tipo: 'humano',
              });
            }
          });
        }
      });

      terceiros.forEach((terceiro) => {
        itens.push({
          gravacaoNome: gravacao.nome,
          categoria: 'Terceiros',
          recurso: terceiro.fornecedorNome,
          descricao: terceiro.servicoNome,
          horas: 0,
          custoUnitario: terceiro.custo,
          custoTotal: terceiro.custo,
          tipo: 'terceiro',
        });
      });
    });

    return itens;
  }, [gravacoes, allRecursos, allTerceiros, recursosHumanos, recursosFisicos]);

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

  const custosPorGravacao = useMemo(() => {
    const porGravacao: Record<string, { horas: number; custo: number }> = {};
    custos.forEach((item) => {
      if (!porGravacao[item.gravacaoNome]) {
        porGravacao[item.gravacaoNome] = { horas: 0, custo: 0 };
      }
      porGravacao[item.gravacaoNome].horas += item.horas;
      porGravacao[item.gravacaoNome].custo += item.custoTotal;
    });
    return porGravacao;
  }, [custos]);

  const totalGeral = useMemo(() => {
    return {
      horas: custos.reduce((acc, item) => acc + item.horas, 0),
      custo: custos.reduce((acc, item) => acc + item.custoTotal, 0),
    };
  }, [custos]);

  const getIconCategoria = (categoria: string) => {
    if (categoria === 'Recursos Humanos') return <Users className="h-4 w-4" />;
    if (categoria === 'Recursos Físicos') return <MapPin className="h-4 w-4" />;
    if (categoria === 'Terceiros') return <Building2 className="h-4 w-4" />;
    return <Calculator className="h-4 w-4" />;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const titulo = conteudoNome || 'Conteúdo';
    const dataExport = new Date().toLocaleDateString('pt-BR');
    
    // Header com gradiente simulado
    doc.setFillColor(26, 54, 93); // kreato-blue-dark
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setFillColor(79, 70, 229); // kreato-purple
    doc.rect(70, 0, 70, 35, 'F');
    
    doc.setFillColor(234, 88, 12); // kreato-orange
    doc.rect(140, 0, 70, 35, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Custos', 14, 15);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Conteúdo: ${titulo}`, 14, 23);
    doc.text(`Data: ${dataExport}`, 14, 30);
    
    let yPos = 45;
    
    // Resumo Geral
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 14, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Gravações', 'Total Horas', 'Custo Total']],
      body: [[
        gravacoes.length.toString(),
        `${totalGeral.horas.toFixed(1)}h`,
        formatCurrency(totalGeral.custo)
      ]],
      headStyles: { 
        fillColor: [26, 54, 93],
        textColor: [255, 255, 255],
        fontSize: 9
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 12;
    
    // Custos por Gravação
    if (Object.keys(custosPorGravacao).length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Custos por Gravação', 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Gravação', 'Horas', 'Custo Total']],
        body: [
          ...Object.entries(custosPorGravacao).map(([nome, dados]) => [
            nome,
            `${dados.horas.toFixed(1)}h`,
            formatCurrency(dados.custo)
          ]),
          ['TOTAL GERAL', `${totalGeral.horas.toFixed(1)}h`, formatCurrency(totalGeral.custo)]
        ],
        headStyles: { 
          fillColor: [26, 54, 93],
          textColor: [255, 255, 255],
          fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14 },
        didParseCell: (data) => {
          if (data.row.index === Object.keys(custosPorGravacao).length) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 12;
    }
    
    // Detalhamento por Categoria
    Object.entries(custosPorCategoria).forEach(([categoria, itens]) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${categoria} - ${formatCurrency(totaisPorCategoria[categoria]?.custo || 0)}`, 14, yPos);
      yPos += 8;
      
      const headers = categoria === 'Terceiros' 
        ? [['Gravação', 'Recurso', 'Descrição', 'Custo Total']]
        : [['Gravação', 'Recurso', 'Descrição', 'Horas', 'Custo/Hora', 'Custo Total']];
      
      const body = itens.map(item => 
        categoria === 'Terceiros'
          ? [item.gravacaoNome, item.recurso, item.descricao, formatCurrency(item.custoTotal)]
          : [item.gravacaoNome, item.recurso, item.descricao, `${item.horas.toFixed(1)}h`, formatCurrency(item.custoUnitario), formatCurrency(item.custoTotal)]
      );
      
      autoTable(doc, {
        startY: yPos,
        head: headers,
        body: body,
        headStyles: { 
          fillColor: [26, 54, 93],
          textColor: [255, 255, 255],
          fontSize: 8
        },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14 },
        columnStyles: categoria === 'Terceiros' 
          ? { 3: { halign: 'right' } }
          : { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 12;
    });
    
    doc.save(`custos-${titulo.toLowerCase().replace(/\s+/g, '-')}-${dataExport.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: 'PDF exportado',
      description: 'O relatório de custos foi exportado com sucesso.',
    });
  };

  const handleExportExcel = () => {
    const titulo = conteudoNome || 'Conteúdo';
    const dataExport = new Date().toLocaleDateString('pt-BR');
    
    // Planilha de Resumo
    const resumoData = [
      ['RELATÓRIO DE CUSTOS'],
      [`Conteúdo: ${titulo}`],
      [`Data: ${dataExport}`],
      [],
      ['RESUMO GERAL'],
      ['Gravações', 'Total Horas', 'Custo Total'],
      [gravacoes.length, totalGeral.horas.toFixed(1), totalGeral.custo],
      [],
      ['CUSTOS POR GRAVAÇÃO'],
      ['Gravação', 'Horas', 'Custo Total'],
      ...Object.entries(custosPorGravacao).map(([nome, dados]) => [
        nome,
        dados.horas.toFixed(1),
        dados.custo
      ]),
      ['TOTAL GERAL', totalGeral.horas.toFixed(1), totalGeral.custo],
    ];
    
    // Planilha de Detalhamento
    const detalheData = [
      ['DETALHAMENTO DE CUSTOS'],
      [],
      ['Gravação', 'Categoria', 'Recurso', 'Descrição', 'Horas', 'Custo/Hora', 'Custo Total'],
      ...custos.map(item => [
        item.gravacaoNome,
        item.categoria,
        item.recurso,
        item.descricao,
        item.tipo === 'terceiro' ? '' : item.horas.toFixed(1),
        item.tipo === 'terceiro' ? '' : item.custoUnitario,
        item.custoTotal
      ]),
      [],
      ['', '', '', '', '', 'TOTAL GERAL:', totalGeral.custo]
    ];
    
    const wb = XLSX.utils.book_new();
    
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    const wsDetalhe = XLSX.utils.aoa_to_sheet(detalheData);
    XLSX.utils.book_append_sheet(wb, wsDetalhe, 'Detalhamento');
    
    // Ajustar largura das colunas
    wsResumo['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
    wsDetalhe['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 15 }];
    
    XLSX.writeFile(wb, `custos-${titulo.toLowerCase().replace(/\s+/g, '-')}-${dataExport.replace(/\//g, '-')}.xlsx`);
    
    toast({
      title: 'Excel exportado',
      description: 'O relatório de custos foi exportado com sucesso.',
    });
  };

  if (gravacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma gravação associada</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Gere gravações para este conteúdo para visualizar os custos acumulados.
        </p>
      </div>
    );
  }

  if (custos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum custo estimado</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Aloque recursos nas gravações associadas para visualizar os custos acumulados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header com botão de exportação */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Custos do Conteúdo
        </h2>
        <ExportDropdown 
          onExportPDF={handleExportPDF} 
          onExportExcel={handleExportExcel}
        />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gravações</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gravacoes.length}</div>
            <p className="text-xs text-muted-foreground">Episódios com custos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGeral.horas.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Horas estimadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalGeral.custo)}</div>
            <p className="text-xs text-muted-foreground">Custo acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens de Custo</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custos.length}</div>
            <p className="text-xs text-muted-foreground">Recursos alocados</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por gravação */}
      {Object.keys(custosPorGravacao).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-4 w-4" />
              Custos por Gravação
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gravação</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(custosPorGravacao).map(([nome, dados]) => (
                  <TableRow key={nome}>
                    <TableCell className="font-medium">{nome}</TableCell>
                    <TableCell className="text-right">{dados.horas.toFixed(1)}h</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(dados.custo)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Total Geral</TableCell>
                  <TableCell className="text-right font-medium">{totalGeral.horas.toFixed(1)}h</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalGeral.custo)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
                  <TableHead>Gravação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Descrição</TableHead>
                  {categoria !== 'Terceiros' && (
                    <>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-right">Custo/Hora</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Custo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-muted-foreground text-sm">{item.gravacaoNome}</TableCell>
                    <TableCell className="font-medium">{item.recurso}</TableCell>
                    <TableCell className="text-muted-foreground">{item.descricao}</TableCell>
                    {categoria !== 'Terceiros' && (
                      <>
                        <TableCell className="text-right">{item.horas.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.custoUnitario)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right font-medium">{formatCurrency(item.custoTotal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="font-medium">
                    Subtotal - {categoria}
                  </TableCell>
                  {categoria !== 'Terceiros' && (
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
                <p className="text-sm text-muted-foreground">Custo Total do Conteúdo</p>
                <p className="text-sm text-muted-foreground">
                  {gravacoes.length} gravações • {totalGeral.horas.toFixed(1)} horas
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
