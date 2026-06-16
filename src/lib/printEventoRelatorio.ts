import type {
  Evento,
  SaveEventoInput,
  AgendaDia,
  OrcamentoEventoItem,
} from '@/modules/gestao-eventos/gestao-eventos.api.repository';

interface PrintEventoOptions {
  form: SaveEventoInput;
  evento: Evento; // fonte autoritativa (vem do backend)
  tipoEventoNome: string | null;
}

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDatetime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function printEventoRelatorio({ form, evento, tipoEventoNome }: PrintEventoOptions) {
  const lat = form.latitude ? parseFloat(form.latitude) : NaN;
  const lon = form.longitude ? parseFloat(form.longitude) : NaN;
  const hasMap = !isNaN(lat) && !isNaN(lon);

  // Expositores: usa o estado atual do formulário (pode ter itens ainda não salvos),
  // mas se estiver vazio cai para o que veio do backend
  const expositores =
    (form.expositores?.length ? form.expositores : null) ?? evento.expositores ?? [];

  const tags = form.tags ?? [];
  const isLayoutImage = form.layoutTipo?.startsWith('image/') ?? false;
  const isLayoutPdf = form.layoutTipo === 'application/pdf';
  const agenda: AgendaDia[] = (form.agenda?.length ? form.agenda : null) ?? evento.agenda ?? [];
  const orcamentoItens: OrcamentoEventoItem[] =
    (form.orcamentoItens?.length ? form.orcamentoItens : null) ?? evento.orcamentoItens ?? [];

  const mapImgUrl = hasMap
    ? `https://maps.wikimedia.org/img/osm-intl,14,${lat},${lon},800x400.png`
    : null;

  /* ── helpers de duração ── */
  function duracaoMin(inicio: string, fim: string): number | null {
    if (!inicio || !fim) return null;
    const [hI, mI] = inicio.split(':').map(Number);
    const [hF, mF] = fim.split(':').map(Number);
    const diff = hF * 60 + mF - (hI * 60 + mI);
    return diff > 0 ? diff : null;
  }
  function fmtDur(min: number | null): string {
    if (!min) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  /* ── helpers de moeda ── */
  const MOEDA_SYM: Record<string, string> = {
    BRL: 'R$',
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'Fr',
    ARS: '$',
    MXN: '$',
  };
  function moedaSym(m: string | null | undefined) {
    return MOEDA_SYM[m ?? ''] ?? (m || 'R$');
  }
  function fmtValorOrc(valor: number, moeda: string) {
    return `${moedaSym(moeda)}&nbsp;${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function fmtDataOrc(iso: string | null | undefined) {
    if (!iso) return '&mdash;';
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
  }

  /* ── Orçamento HTML ── */
  const orcamentoHtml = (() => {
    if (orcamentoItens.length === 0) return '';

    const rows = orcamentoItens
      .map(
        (item) => `<tr>
  <td>${esc(item.fornecedorNome)}</td>
  <td class="orc-servicos">${item.servicoNomes.length > 0 ? item.servicoNomes.map(esc).join(', ') : '&mdash;'}</td>
  <td>${item.centroLucroNome ? esc(item.centroLucroNome) : '&mdash;'}</td>
  <td class="orc-valor">${fmtValorOrc(item.valor, item.moeda)}</td>
  <td class="orc-data">${fmtDataOrc(item.dataPagamento)}</td>
</tr>`,
      )
      .join('');

    // totals grouped by moeda
    const totaisMap: Record<string, number> = {};
    for (const item of orcamentoItens) {
      const m = item.moeda || 'BRL';
      totaisMap[m] = (totaisMap[m] ?? 0) + item.valor;
    }
    const totalRows = Object.entries(totaisMap)
      .map(
        ([moeda, total]) => `<tr class="orc-total-row">
  <td colspan="3" style="text-align:right;color:#6b7280;">Total (${esc(moeda)})</td>
  <td class="orc-valor">${fmtValorOrc(total, moeda)}</td>
  <td></td>
</tr>`,
      )
      .join('');

    return `<hr/><div class="sec">Or&ccedil;amento</div>
<table class="orc-table">
  <thead>
    <tr>
      <th>Fornecedor</th>
      <th>Servi&ccedil;os</th>
      <th>Centro de Custo</th>
      <th class="orc-valor">Valor</th>
      <th class="orc-data">Data Pag.</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>${totalRows}</tfoot>
</table>`;
  })();

  /* ── Agenda HTML ── */
  const totalAtividades = agenda.reduce((s, d) => s + d.atividades.length, 0);
  const totalExecutadas = agenda.reduce(
    (s, d) => s + d.atividades.filter((a) => a.executada).length,
    0,
  );
  const percentual =
    totalAtividades > 0 ? Math.round((totalExecutadas / totalAtividades) * 100) : 0;

  const fmtDia = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const agendaHtml =
    agenda.length > 0
      ? `<hr/><div class="sec">Agenda Detalhada</div>
${
  totalAtividades > 0
    ? `<div class="agenda-progresso">
  <div class="agenda-progresso-label"><span>Progresso</span><span>${totalExecutadas}/${totalAtividades} atividades (${percentual}%)</span></div>
  <div class="agenda-progresso-bar"><div class="agenda-progresso-fill" style="width:${percentual}%"></div></div>
</div>`
    : ''
}
${agenda
  .map((dia) => {
    const totalMinDia = dia.atividades.reduce(
      (s, a) => s + (duracaoMin(a.horarioInicio, a.horarioFim) ?? 0),
      0,
    );
    const totalDiaStr = fmtDur(totalMinDia || null);
    return `<div class="agenda-dia">
  <div class="agenda-dia-header">${esc(fmtDia(dia.data))}${totalDiaStr ? ` <span style="font-weight:400;color:#6b7280;">&nbsp;·&nbsp;${esc(totalDiaStr)} total</span>` : ''}</div>
  ${
    dia.atividades.length === 0
      ? '<div class="agenda-atv"><span style="font-size:10px;color:#9ca3af;">Nenhuma atividade cadastrada</span></div>'
      : dia.atividades
          .map((atv) => {
            const dur = fmtDur(duracaoMin(atv.horarioInicio, atv.horarioFim));
            return `<div class="agenda-atv">
    <div class="agenda-atv-cor" style="background:${esc(atv.cor)}"></div>
    <div class="agenda-atv-hora">
      <strong>${esc(atv.horarioInicio || '—')}</strong>${atv.horarioFim ? `<br/>${esc(atv.horarioFim)}` : ''}
      ${dur ? `<div class="agenda-atv-dur">${esc(dur)}</div>` : ''}
    </div>
    <div class="agenda-atv-corpo">
      <div class="agenda-atv-titulo${atv.executada ? ' executada' : ''}">${esc(atv.titulo)}</div>
      ${atv.descricao ? `<div class="agenda-atv-desc">${esc(atv.descricao)}</div>` : ''}
    </div>
    <div class="agenda-atv-check${atv.executada ? ' ok' : ''}">${atv.executada ? '&#10003;' : ''}</div>
  </div>`;
          })
          .join('')
  }
</div>`;
  })
  .join('')}`
      : '';

  /* ── HTML ── */
  const expositorRows = expositores
    .map(
      (exp, i) => `
<div class="exp-row">
  <span class="exp-num">${i + 1}</span>
  ${exp.logo ? `<img class="exp-logo" src="${exp.logo}" alt="${esc(exp.nome)}"/>` : `<div class="exp-ph"></div>`}
  <div>
    <div class="exp-nome">${esc(exp.nome)}</div>
    ${exp.tipoExpositorNome ? `<div class="exp-tipo">${esc(exp.tipoExpositorNome)}</div>` : ''}
  </div>
</div>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Ficha do Evento — ${esc(form.nome)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;padding:28px 36px;max-width:860px;margin:0 auto;}
.lbl-top{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;}
h1{font-size:24px;font-weight:700;margin-bottom:6px;line-height:1.25;color:#111827;}
.tipo-badge{display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:20px;padding:2px 12px;font-size:10px;color:#1d4ed8;margin-bottom:10px;}
.desc{font-size:12px;color:#4b5563;margin-bottom:12px;line-height:1.6;}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;}
.tag{background:#f3f4f6;border:1px solid #d1d5db;border-radius:20px;padding:2px 10px;font-size:10px;color:#374151;}
hr{border:none;border-top:1px solid #e5e7eb;margin:16px 0;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
.cell{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;}
.cell .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:3px;}
.cell .val{font-size:13px;font-weight:600;color:#111827;}
.sec{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#374151;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e5e7eb;}
.map-img{width:100%;border-radius:6px;border:1px solid #e5e7eb;display:block;}
.coords{font-size:9px;color:#9ca3af;margin-top:4px;}
.exp-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f3f4f6;}
.exp-num{font-size:10px;font-weight:700;color:#9ca3af;width:20px;flex-shrink:0;text-align:right;}
.exp-logo{width:38px;height:38px;object-fit:contain;border-radius:4px;border:1px solid #e5e7eb;background:#fff;flex-shrink:0;}
.exp-ph{width:38px;height:38px;border-radius:4px;border:1px solid #e5e7eb;background:#f3f4f6;flex-shrink:0;}
.exp-nome{font-size:12px;font-weight:600;color:#111827;}
.exp-tipo{font-size:10px;color:#6b7280;}
.layout-sec{page-break-before:always;}
.layout-img{width:100%;border-radius:6px;border:1px solid #e5e7eb;display:block;}
.layout-pdf{background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:11px;color:#92400e;}
.agenda-dia{margin-bottom:16px;}
.agenda-dia-header{background:#f3f4f6;border-radius:6px 6px 0 0;padding:7px 12px;font-size:11px;font-weight:700;color:#374151;text-transform:capitalize;border:1px solid #e5e7eb;border-bottom:none;}
.agenda-atv{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;border:1px solid #e5e7eb;border-top:none;}
.agenda-atv:last-child{border-radius:0 0 6px 6px;}
.agenda-atv-cor{width:4px;align-self:stretch;border-radius:2px;flex-shrink:0;min-height:20px;print-color-adjust:exact;-webkit-print-color-adjust:exact;}
.agenda-atv-hora{font-size:11px;font-family:monospace;color:#6b7280;width:60px;flex-shrink:0;padding-top:1px;}
.agenda-atv-hora strong{font-weight:700;color:#374151;}
.agenda-atv-dur{font-size:9px;color:#9ca3af;margin-top:2px;}
.agenda-atv-corpo{flex:1;min-width:0;}
.agenda-atv-titulo{font-size:12px;font-weight:600;color:#111827;}
.agenda-atv-titulo.executada{text-decoration:line-through;color:#9ca3af;}
.agenda-atv-desc{font-size:10px;color:#6b7280;margin-top:1px;}
.agenda-atv-check{width:14px;height:14px;border-radius:3px;border:1.5px solid #d1d5db;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;}
.agenda-atv-check.ok{background:#111827;border-color:#111827;}
.agenda-progresso{margin-bottom:14px;padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;}
.agenda-progresso-label{font-size:10px;color:#374151;font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between;}
.agenda-progresso-bar{height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden;}
.agenda-progresso-fill{height:100%;background:#111827;border-radius:4px;}
.orc-table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;}
.orc-table th{background:#f3f4f6;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;padding:7px 10px;text-align:left;border-bottom:2px solid #e5e7eb;}
.orc-table td{padding:7px 10px;border-bottom:1px solid #f3f4f6;color:#374151;vertical-align:top;}
.orc-table tbody tr:last-child td{border-bottom:none;}
.orc-total-row td{background:#f9fafb;font-weight:700;border-top:2px solid #e5e7eb !important;}
.orc-valor{text-align:right;font-family:monospace;white-space:nowrap;}
.orc-data{text-align:center;white-space:nowrap;}
.orc-servicos{font-size:10px;color:#6b7280;}
.footer{margin-top:24px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;}
@media print{body{padding:0;}@page{margin:16mm 14mm;size:A4;}*{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}
</style>
</head>
<body>
<div class="lbl-top">Ficha do Evento</div>
<h1>${esc(form.nome)}</h1>
${tipoEventoNome ? `<div class="tipo-badge">${esc(tipoEventoNome)}</div><br/>` : ''}
${form.descricao ? `<p class="desc">${esc(form.descricao)}</p>` : ''}
${tags.length > 0 ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}

<div class="grid2">
  <div class="cell"><div class="lbl">In&iacute;cio</div><div class="val">${fmtDatetime(form.inicioEvento as string | null)}</div></div>
  <div class="cell"><div class="lbl">Fim</div><div class="val">${fmtDatetime(form.fimEvento as string | null)}</div></div>
  <div class="cell"><div class="lbl">Local</div><div class="val">${form.local ? esc(form.local) : '&mdash;'}</div></div>
  <div class="cell"><div class="lbl">P&uacute;blico Estimado</div><div class="val">${form.publicoEstimado ? esc(form.publicoEstimado) : '&mdash;'}</div></div>
</div>

${
  hasMap
    ? `<hr/><div class="sec">Localiza&ccedil;&atilde;o no Mapa</div>
<img class="map-img" src="${mapImgUrl}" alt="Mapa" onerror="this.style.display='none'"/>
<p class="coords">Coordenadas: ${lat}, ${lon}</p>`
    : ''
}

${expositores.length > 0 ? `<hr/><div class="sec">Expositores (${expositores.length})</div><div>${expositorRows}</div>` : ''}

${agendaHtml}

${orcamentoHtml}

${
  form.layoutArquivo && isLayoutImage
    ? `<div class="layout-sec"><div class="sec">Layout do Espa&ccedil;o</div>
<img class="layout-img" src="${form.layoutArquivo}" alt="${esc(form.layoutNome ?? 'Layout')}"/></div>`
    : ''
}

${
  form.layoutArquivo && isLayoutPdf
    ? `<div class="layout-sec"><div class="sec">Layout do Espa&ccedil;o</div>
<div class="layout-pdf">&#128196; Layout em PDF: <strong>${esc(form.layoutNome ?? 'arquivo.pdf')}</strong> &mdash; abra o arquivo separadamente para visualizar.</div></div>`
    : ''
}

<div class="footer">
  <span>${evento.createdAt ? `Cadastrado em ${new Date(evento.createdAt).toLocaleDateString('pt-BR')}${evento.createdBy ? ` por ${esc(evento.createdBy)}` : ''}` : ''}</span>
  <span>Impresso em: ${new Date().toLocaleString('pt-BR')}</span>
</div>
</body>
</html>`;

  // Blob URL — mais confiável que document.write() para HTML grande (logos em base64)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, '_blank');
  if (!win) {
    URL.revokeObjectURL(blobUrl);
    return;
  }
  win.addEventListener('load', () => {
    setTimeout(() => {
      win.focus();
      win.print();
      // Revoga após 5 min (tempo para o usuário re-imprimir se precisar)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
    }, 500);
  });
}
