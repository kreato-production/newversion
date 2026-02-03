import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGravacaoReportData, type GravacaoReportData } from '@/hooks/useGravacaoReportData';
import { formatCurrency } from '@/lib/currencies';

interface GravacaoReportGeneratorProps {
  gravacaoId: string;
  disabled?: boolean;
}

export const GravacaoReportGenerator = ({ gravacaoId, disabled }: GravacaoReportGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { fetchReportData } = useGravacaoReportData();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      // Handle ISO format
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
      }
      // Handle BR format
      if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        return dateStr;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Load image and convert to base64 for PDF
  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchReportData(gravacaoId);
      if (!data) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da gravação.',
          variant: 'destructive',
        });
        return;
      }

      // Get currency from business unit
      const currency = data.basicInfo.unidadeNegocioMoeda || 'BRL';
      const formatValue = (value: number) => formatCurrency(value, currency);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header with gradient
      pdf.setFillColor(124, 58, 237); // Primary purple
      pdf.rect(0, 0, pageWidth, 40, 'F');

      // Load and add logo if available
      let logoWidth = 0;
      if (data.basicInfo.unidadeNegocioLogo) {
        try {
          const logoBase64 = await loadImageAsBase64(data.basicInfo.unidadeNegocioLogo);
          if (logoBase64) {
            const logoHeight = 25;
            logoWidth = 30; // Will be adjusted based on aspect ratio
            pdf.addImage(logoBase64, 'PNG', pageWidth - margin - logoWidth, 7, logoWidth, logoHeight);
          }
        } catch (e) {
          console.log('Could not load logo:', e);
        }
      }

      // Title (adjusted for logo)
      const titleMaxWidth = pageWidth - margin * 2 - (logoWidth ? logoWidth + 10 : 0);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Plano de Gravação', margin, 18);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${data.basicInfo.codigo} - ${data.basicInfo.nome}`, margin, 28);

      pdf.setFontSize(9);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, 36);

      y = 50;
      pdf.setTextColor(0, 0, 0);

      // ==================== DADOS GERAIS ====================
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(124, 58, 237);
      pdf.text('1. Dados Gerais', margin, y);
      y += 8;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const generalInfo = [
        ['Código', data.basicInfo.codigo],
        ['Nome', data.basicInfo.nome],
        ['Data Prevista', formatDate(data.basicInfo.dataPrevista)],
        ['Status', data.basicInfo.status || '-'],
        ['Unidade de Negócio', data.basicInfo.unidadeNegocio || '-'],
        ['Centro de Lucro', data.basicInfo.centroLucro || '-'],
        ['Classificação', data.basicInfo.classificacao || '-'],
        ['Tipo de Conteúdo', data.basicInfo.tipoConteudo || '-'],
        ['Conteúdo', data.basicInfo.conteudo || '-'],
      ];

      autoTable(pdf, {
        startY: y,
        head: [],
        body: generalInfo,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: contentWidth - 45 },
        },
        margin: { left: margin, right: margin },
      });

      y = (pdf as any).lastAutoTable.finalY + 5;

      if (data.basicInfo.descricao) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Descrição:', margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(data.basicInfo.descricao, contentWidth);
        pdf.text(descLines, margin, y);
        y += descLines.length * 4 + 5;
      }

      // ==================== ROTEIRO (CENAS) ====================
      if (data.cenas.length > 0) {
        y = checkPageBreak(pdf, y, 40);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text('2. Roteiro (Cenas)', margin, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);

        data.cenas.forEach((cena, index) => {
          y = checkPageBreak(pdf, y, 35);

          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, y - 4, contentWidth, 8, 'F');
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          const cenaTitle = `Cena ${cena.ordem}${cena.capitulo ? ` - Cap. ${cena.capitulo}` : ''}${cena.numeroCena ? ` / Cena ${cena.numeroCena}` : ''}`;
          pdf.text(cenaTitle, margin + 2, y);
          y += 8;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');

          const cenaDetails = [];
          if (cena.ambiente) cenaDetails.push(`Ambiente: ${cena.ambiente}`);
          if (cena.tipoAmbiente) cenaDetails.push(`Tipo: ${cena.tipoAmbiente}`);
          if (cena.periodo) cenaDetails.push(`Período: ${cena.periodo}`);
          if (cena.ritmo) cenaDetails.push(`Ritmo: ${cena.ritmo}`);
          if (cena.localGravacao) cenaDetails.push(`Local: ${cena.localGravacao}`);
          if (cena.tempoAproximado) cenaDetails.push(`Tempo: ${cena.tempoAproximado}`);

          if (cenaDetails.length > 0) {
            pdf.text(cenaDetails.join(' | '), margin, y);
            y += 5;
          }

          if (cena.descricao) {
            const descText = stripHtml(cena.descricao);
            const descLines = pdf.splitTextToSize(descText, contentWidth);
            pdf.text(descLines.slice(0, 3), margin, y);
            y += Math.min(descLines.length, 3) * 4;
          }

          y += 5;
        });
      }

      // ==================== RECURSOS ====================
      if (data.recursos.length > 0) {
        y = checkPageBreak(pdf, y, 40);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text(`${data.cenas.length > 0 ? '3' : '2'}. Recursos Alocados`, margin, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);

        // Separate resources by type
        const recursosTecnicos = data.recursos.filter(r => r.tipo === 'tecnico');
        const recursosFisicos = data.recursos.filter(r => r.tipo === 'fisico');
        const recursosHumanosDiretos = data.recursos.filter(r => r.tipo === 'humano');

        // -------- Recursos Técnicos --------
        if (recursosTecnicos.length > 0 || recursosHumanosDiretos.length > 0) {
          y = checkPageBreak(pdf, y, 25);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Recursos Técnicos', margin, y);
          y += 6;

          // Group technical resources by function
          const tecnicosPorFuncao: Record<string, typeof recursosTecnicos> = {};
          recursosTecnicos.forEach(rt => {
            const funcao = rt.funcao || 'Sem Função';
            if (!tecnicosPorFuncao[funcao]) {
              tecnicosPorFuncao[funcao] = [];
            }
            tecnicosPorFuncao[funcao].push(rt);
          });

          // Also add direct HR resources grouped by their function
          recursosHumanosDiretos.forEach(rh => {
            const funcao = rh.funcao || 'Colaboradores';
            if (!tecnicosPorFuncao[funcao]) {
              tecnicosPorFuncao[funcao] = [];
            }
            tecnicosPorFuncao[funcao].push(rh);
          });

          Object.entries(tecnicosPorFuncao).forEach(([funcao, recursos]) => {
            y = checkPageBreak(pdf, y, 20);
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`  ${funcao}`, margin, y);
            y += 5;

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            
            recursos.forEach(recurso => {
              const horario = recurso.horaInicio && recurso.horaFim 
                ? ` (${recurso.horaInicio} - ${recurso.horaFim})` 
                : '';
              pdf.text(`      • ${recurso.nome}${horario}`, margin, y);
              y += 4;
            });
            y += 2;
          });
        }

        // -------- Recursos Físicos --------
        if (recursosFisicos.length > 0) {
          y = checkPageBreak(pdf, y, 25);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Recursos Físicos', margin, y);
          y += 6;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          recursosFisicos.forEach(rf => {
            const horario = rf.horaInicio && rf.horaFim 
              ? ` (${rf.horaInicio} - ${rf.horaFim})` 
              : '';
            pdf.text(`    • ${rf.nome}${horario}`, margin, y);
            y += 4;
          });
        }

        y += 5;
      }

      // ==================== ELENCO ====================
      if (data.elenco.length > 0) {
        y = checkPageBreak(pdf, y, 35);
        
        const sectionNum = getSectionNumber(data, 'elenco');
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text(`${sectionNum}. Elenco`, margin, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);

        const elencoTable = data.elenco.map(e => [
          e.nomeTrabalho || e.nome,
          e.personagem,
        ]);

        autoTable(pdf, {
          startY: y,
          head: [['Ator/Atriz', 'Personagem']],
          body: elencoTable,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [124, 58, 237] },
          margin: { left: margin, right: margin },
        });

        y = (pdf as any).lastAutoTable.finalY + 8;
      }

      // ==================== CONVIDADOS ====================
      if (data.convidados.length > 0) {
        y = checkPageBreak(pdf, y, 35);
        
        const sectionNum = getSectionNumber(data, 'convidados');
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text(`${sectionNum}. Convidados`, margin, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);

        const convidadosTable = data.convidados.map(c => [
          c.nomeTrabalho || c.nome,
          c.telefone || '-',
          c.email || '-',
          c.observacoes || '-',
        ]);

        autoTable(pdf, {
          startY: y,
          head: [['Nome', 'Telefone', 'E-mail', 'Observações']],
          body: convidadosTable,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [124, 58, 237] },
          margin: { left: margin, right: margin },
        });

        y = (pdf as any).lastAutoTable.finalY + 8;
      }

      // ==================== FIGURINOS ====================
      if (data.figurinos.length > 0) {
        y = checkPageBreak(pdf, y, 35);
        
        const sectionNum = getSectionNumber(data, 'figurinos');
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text(`${sectionNum}. Figurinos`, margin, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);

        const figurinosTable = data.figurinos.map(f => [
          f.codigoFigurino,
          f.descricao,
          f.tipoFigurino || '-',
          f.tamanhoPeca || '-',
          f.observacoes || '-',
        ]);

        autoTable(pdf, {
          startY: y,
          head: [['Código', 'Descrição', 'Tipo', 'Tamanho', 'Observações']],
          body: figurinosTable,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [124, 58, 237] },
          margin: { left: margin, right: margin },
        });

        y = (pdf as any).lastAutoTable.finalY + 8;
      }

      // ==================== TERCEIROS ====================
      if (data.terceiros.length > 0) {
        y = checkPageBreak(pdf, y, 35);
        
        const sectionNum = getSectionNumber(data, 'terceiros');
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text(`${sectionNum}. Serviços Terceirizados`, margin, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);

        const terceirosTable = data.terceiros.map(t => [
          t.fornecedorNome,
          t.servicoNome,
          formatValue(t.custo),
        ]);

        autoTable(pdf, {
          startY: y,
          head: [['Fornecedor', 'Serviço', 'Custo']],
          body: terceirosTable,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [124, 58, 237] },
          margin: { left: margin, right: margin },
        });

        y = (pdf as any).lastAutoTable.finalY + 8;
      }

      // ==================== CUSTOS (SEMPRE INCLUÍDO) ====================
      y = checkPageBreak(pdf, y, 50);
      
      const custosSectionNum = getSectionNumber(data, 'custos');
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(124, 58, 237);
      pdf.text(`${custosSectionNum}. Resumo de Custos`, margin, y);
      y += 8;
      pdf.setTextColor(0, 0, 0);

      if (data.custos.length > 0) {
        // Group costs by category
        const custosPorCategoria: Record<string, typeof data.custos> = {};
        data.custos.forEach(c => {
          if (!custosPorCategoria[c.categoria]) {
            custosPorCategoria[c.categoria] = [];
          }
          custosPorCategoria[c.categoria].push(c);
        });

        Object.entries(custosPorCategoria).forEach(([categoria, itens]) => {
          y = checkPageBreak(pdf, y, 25);

          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(categoria, margin, y);
          y += 5;

          const total = itens.reduce((acc, i) => acc + i.custoTotal, 0);
          
          const custosTable = itens.map(c => [
            c.recurso,
            c.descricao,
            c.horas > 0 ? `${c.horas.toFixed(1)}h` : '-',
            c.horas > 0 ? formatValue(c.custoUnitario) : '-',
            formatValue(c.custoTotal),
          ]);

          // Add subtotal row
          custosTable.push(['', '', '', 'Subtotal:', formatValue(total)]);

          autoTable(pdf, {
            startY: y,
            head: [['Recurso', 'Descrição', 'Horas', 'Custo/Hora', 'Total']],
            body: custosTable,
            theme: 'striped',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [124, 58, 237] },
            margin: { left: margin, right: margin },
            didParseCell: (data) => {
              // Style subtotal row
              if (data.row.index === custosTable.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [245, 245, 245];
              }
            },
          });

          y = (pdf as any).lastAutoTable.finalY + 8;
        });
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Nenhum custo registrado para esta gravação.', margin, y);
        y += 10;
      }

      // Total Geral
      y = checkPageBreak(pdf, y, 25);
      
      pdf.setFillColor(124, 58, 237);
      pdf.rect(margin, y - 2, contentWidth, 15, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CUSTO TOTAL ESTIMADO', margin + 5, y + 6);
      pdf.text(formatValue(data.totais.custoTotal), pageWidth - margin - 5, y + 6, { align: 'right' });

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${data.totais.horasTotais.toFixed(1)} horas de trabalho`, margin + 5, y + 11);

      // Footer on all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `plano_gravacao_${data.basicInfo.codigo}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'Relatório gerado',
        description: 'O plano de gravação foi exportado com sucesso.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar o relatório PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const checkPageBreak = (pdf: jsPDF, currentY: number, neededSpace: number): number => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (currentY + neededSpace > pageHeight - 20) {
      pdf.addPage();
      return 20;
    }
    return currentY;
  };

  const getSectionNumber = (data: GravacaoReportData, section: string): number => {
    let num = 2; // Starts at 2 (after Dados Gerais)
    
    if (data.cenas.length > 0) num++;
    if (section === 'recursos' && data.cenas.length > 0) return num;
    
    if (data.recursos.length > 0) num++;
    if (section === 'elenco') return num;
    
    if (data.elenco.length > 0) num++;
    if (section === 'convidados') return num;
    
    if (data.convidados.length > 0) num++;
    if (section === 'figurinos') return num;
    
    if (data.figurinos.length > 0) num++;
    if (section === 'terceiros') return num;
    
    if (data.terceiros.length > 0) num++;
    if (section === 'custos') return num;
    
    return num;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5 mr-1.5" />
          )}
          Relatórios
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={generatePDF} disabled={isGenerating}>
          <FileText className="h-3.5 w-3.5 mr-2" />
          Exportar Plano de Gravação (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
