import type {
  Evento,
  SaveEventoInput,
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

  const mapImgUrl = hasMap
    ? `https://maps.wikimedia.org/img/osm-intl,14,${lat},${lon},800x400.png`
    : null;

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
.layout-img{width:100%;border-radius:6px;border:1px solid #e5e7eb;display:block;}
.layout-pdf{background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:11px;color:#92400e;}
.footer{margin-top:24px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;}
@media print{body{padding:0;}@page{margin:16mm 14mm;size:A4;}}
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

${
  form.layoutArquivo && isLayoutImage
    ? `<hr/><div class="sec">Layout do Espa&ccedil;o</div>
<img class="layout-img" src="${form.layoutArquivo}" alt="${esc(form.layoutNome ?? 'Layout')}"/>`
    : ''
}

${
  form.layoutArquivo && isLayoutPdf
    ? `<hr/><div class="sec">Layout do Espa&ccedil;o</div>
<div class="layout-pdf">&#128196; Layout em PDF: <strong>${esc(form.layoutNome ?? 'arquivo.pdf')}</strong> &mdash; abra o arquivo separadamente para visualizar.</div>`
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
