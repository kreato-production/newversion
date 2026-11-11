import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { GripVertical, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FormDefinition } from '@/data/formsRegistry';
import {
  computeFormLayout,
  GRID_COLUMNS,
  moveCampo,
  resizeCampo,
  snapSpan,
  stepSpan,
  type FormularioCampoRow,
} from '@/components/admin/formularioLayout';

const ROW_HEIGHT = 84;
// Linha com o título de um grupo (seção ou tabulador próprio do formulário).
const HEADING_HEIGHT = 28;
const COLUMNS = Array.from({ length: GRID_COLUMNS }, (_, index) => index);
// Same column gap as the real form grid (.configurable-field-grid: 1rem).
const GAP_PX = 16;
const GRID_GAP = `${GAP_PX}px`;
// Hachura leve nas células de apoio (cores do tema).
const GUIDE_PATTERN =
  'repeating-linear-gradient(45deg, transparent, transparent 6px, hsl(var(--muted) / 0.6) 6px, hsl(var(--muted) / 0.6) 7px)';

const percent = (cols: number) => Math.round((cols * 100) / GRID_COLUMNS);

interface FormularioPreviewProps {
  form: FormDefinition;
  rows: FormularioCampoRow[];
  /** Campos alterados em relação ao que está publicado (destacados). */
  changed: Set<string>;
  readOnly?: boolean;
  /** Nova configuração após mover ou redimensionar um campo (atualiza Tamanho / Posição). */
  onRowsChange?: (rows: FormularioCampoRow[]) => void;
}

interface DropTarget {
  campo: string;
  side: 'before' | 'after';
}

interface Resizing {
  campo: string;
  startX: number;
  startSpan: number;
  span: number;
}

/**
 * Como o formulário fica com a configuração atual: a mesma grade de 12 colunas do formulário
 * do módulo, com linhas de apoio (quadriculado) e cada campo no tamanho e na posição
 * configurados. A área lateral fixa (ex.: foto da Pessoa) aparece à esquerda, como no módulo.
 *
 * Editável: arrastar um campo (antes / depois de outro, ou para o fim numa área vazia) muda a
 * Posição; a alça da borda direita muda o Tamanho, encaixando nos tamanhos permitidos.
 * Teclado: setas movem o campo em foco; Shift + seta esquerda/direita diminui/aumenta.
 */
export const FormularioPreview = ({
  form,
  rows,
  changed,
  readOnly = false,
  onRowsChange,
}: FormularioPreviewProps) => {
  const editable = !readOnly && !!onRowsChange;
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [resizing, setResizing] = useState<Resizing | null>(null);
  // Keeps keyboard focus on the field that was just moved / resized.
  const focusAfterChange = useRef<string | null>(null);

  // While resizing, the layout reflows live; the change is committed on release.
  const shownRows = resizing ? resizeCampo(form, rows, resizing.campo, resizing.span) : rows;
  const layout = computeFormLayout(form, shownRows);
  const order = layout.cells.map((cell) => cell.campo);
  const grupoOf = new Map(layout.cells.map((cell) => [cell.campo, cell.grupo]));
  const headingRows = new Map(layout.headings.map((heading) => [heading.row, heading.label]));
  // Campos só se movem dentro do próprio grupo, como no formulário (cada seção é uma grade).
  const sameGroup = (a: string, b: string) => grupoOf.get(a) === grupoOf.get(b);
  const rowHeights = Array.from({ length: layout.rowCount + (dragging ? 1 : 0) }, (_, row) =>
    headingRows.has(row) ? HEADING_HEIGHT : ROW_HEIGHT,
  );
  // Rótulo L1, L2... só nas linhas de campos.
  const rowLabels = rowHeights.map((_, row) =>
    headingRows.has(row)
      ? null
      : row - [...headingRows.keys()].filter((heading) => heading < row).length + 1,
  );

  useEffect(() => {
    const campo = focusAfterChange.current;
    if (!campo) return;
    focusAfterChange.current = null;
    gridRef.current?.querySelector<HTMLElement>(`[data-campo="${campo}"]`)?.focus();
  });

  const commit = (next: FormularioCampoRow[], focusCampo?: string) => {
    if (!onRowsChange) return;
    if (focusCampo) focusAfterChange.current = focusCampo;
    onRowsChange(next);
  };

  const moveTo = (campo: string, targetIndex: number, focus = false) => {
    const next = moveCampo(form, rows, campo, targetIndex);
    commit(next, focus ? campo : undefined);
  };

  // ── Drag and drop (posição) ────────────────────────────────────────────────
  const endDrag = () => {
    setDragging(null);
    setDropTarget(null);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, campo: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', campo);
    setDragging(campo);
  };

  const sideOf = (event: DragEvent<HTMLElement>): DropTarget['side'] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
  };

  const handleDragOverCell = (event: DragEvent<HTMLDivElement>, campo: string) => {
    if (!dragging || !sameGroup(dragging, campo)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const side = sideOf(event);
    if (dropTarget?.campo !== campo || dropTarget.side !== side) setDropTarget({ campo, side });
  };

  const handleDropOnCell = (event: DragEvent<HTMLDivElement>, campo: string) => {
    event.preventDefault();
    event.stopPropagation();
    const moved = dragging ?? event.dataTransfer.getData('text/plain');
    endDrag();
    if (!moved || moved === campo || !sameGroup(moved, campo)) return;
    const without = order.filter((item) => item !== moved);
    const index = without.indexOf(campo) + (sideOf(event) === 'after' ? 1 : 0);
    moveTo(moved, index);
  };

  // Dropped on an empty area of the grid: goes to the end of its group.
  const handleDropOnGrid = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const moved = dragging ?? event.dataTransfer.getData('text/plain');
    endDrag();
    if (!moved || !grupoOf.has(moved)) return;
    const without = order.filter((item) => item !== moved);
    let last = -1;
    without.forEach((item, index) => {
      if (sameGroup(item, moved)) last = index;
    });
    moveTo(moved, last + 1);
  };

  // ── Redimensionar (tamanho) ────────────────────────────────────────────────
  const columnWidth = () => {
    const width = gridRef.current?.getBoundingClientRect().width ?? 0;
    return (width - GAP_PX * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  };

  const handleResizeStart = (event: PointerEvent<HTMLDivElement>, campo: string, span: number) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setResizing({ campo, startX: event.clientX, startSpan: span, span });
  };

  const handleResizeMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!resizing) return;
    const col = columnWidth();
    if (col <= 0) return;
    const startWidth = resizing.startSpan * col + (resizing.startSpan - 1) * GAP_PX;
    const raw = (startWidth + (event.clientX - resizing.startX) + GAP_PX) / (col + GAP_PX);
    const span = snapSpan(Math.min(GRID_COLUMNS, Math.max(1, raw)));
    if (span !== resizing.span) setResizing({ ...resizing, span });
  };

  const handleResizeEnd = () => {
    if (!resizing) return;
    const { campo, span, startSpan } = resizing;
    setResizing(null);
    if (span !== startSpan) commit(resizeCampo(form, rows, campo, span));
  };

  // ── Teclado ────────────────────────────────────────────────────────────────
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, campo: string, span: number) => {
    const index = order.indexOf(campo);
    if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const next = stepSpan(span, event.key === 'ArrowRight' ? 1 : -1);
      if (next !== span) commit(resizeCampo(form, rows, campo, next), campo);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (index > 0 && sameGroup(order[index - 1], campo)) moveTo(campo, index - 1, true);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (index < order.length - 1 && sameGroup(order[index + 1], campo)) {
        moveTo(campo, index + 1, true);
      }
    }
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
    gridTemplateRows: rowHeights.map((height) => `${height}px`).join(' '),
    gridAutoRows: `${ROW_HEIGHT}px`,
    gap: GRID_GAP,
  };

  return (
    <div className="space-y-2">
      {editable && (
        <p className="text-xs text-muted-foreground">
          Arraste um campo para mudar a posição e use a alça da borda direita para mudar o tamanho.
          Pelo teclado: setas movem o campo em foco; Shift + ← / → diminui ou aumenta.
        </p>
      )}
      <div className="overflow-x-auto">
        <div className={cn('flex min-w-[720px] gap-4', resizing && 'cursor-ew-resize select-none')}>
          {form.areaLateral && (
            <div className="flex w-32 shrink-0 flex-col items-center gap-2 pt-6">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted/40 text-muted-foreground"
                aria-label={`${form.areaLateral} (área fixa)`}
              >
                <ImageIcon className="h-6 w-6" />
              </div>
              <span className="text-center text-[11px] text-muted-foreground">
                {form.areaLateral} (área fixa)
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            {/* Régua das colunas */}
            <div className="grid grid-cols-[2rem_1fr] gap-2">
              <span />
              <div
                className="grid"
                style={{ gridTemplateColumns: gridStyle.gridTemplateColumns, gap: GRID_GAP }}
              >
                {COLUMNS.map((col) => {
                  const quarter = (col + 1) % 3 === 0;
                  return (
                    <span
                      key={col}
                      className={cn(
                        'border-r text-right text-[10px] tabular-nums',
                        quarter
                          ? 'border-muted-foreground/50 font-semibold text-foreground/70'
                          : 'border-transparent text-muted-foreground',
                      )}
                      title={`Coluna ${col + 1} de ${GRID_COLUMNS}`}
                    >
                      {quarter ? `${percent(col + 1)}%` : col + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-[2rem_1fr] gap-2">
              {/* Numeração das linhas */}
              <div
                className="grid"
                style={{
                  gridTemplateRows: gridStyle.gridTemplateRows,
                  gridAutoRows: gridStyle.gridAutoRows,
                  gap: GRID_GAP,
                }}
              >
                {rowLabels.slice(0, layout.rowCount).map((label, row) => (
                  <span
                    key={row}
                    className="flex items-center justify-center text-[11px] font-medium text-muted-foreground"
                  >
                    {label !== null && `L${label}`}
                  </span>
                ))}
              </div>

              <div
                ref={gridRef}
                className="relative grid"
                style={gridStyle}
                role="list"
                aria-label="Preview do formulário"
                onDragOver={(event) => {
                  if (dragging) event.preventDefault();
                }}
                onDrop={handleDropOnGrid}
              >
                {/* Linhas de apoio: uma célula tracejada por coluna em cada linha (+1 livre ao arrastar) */}
                {layout.headings.map((heading) => (
                  <div
                    key={`grupo-${heading.row}`}
                    className="flex items-end border-b border-muted-foreground/30 pb-1 text-xs font-semibold text-foreground/80"
                    style={{ gridRow: heading.row + 1, gridColumn: '1 / -1' }}
                  >
                    {heading.label}
                  </div>
                ))}
                {rowHeights.map((_, row) =>
                  headingRows.has(row)
                    ? null
                    : COLUMNS.map((col) => (
                        <div
                          key={`guia-${row}-${col}`}
                          aria-hidden
                          className="rounded border border-dashed border-muted-foreground/30"
                          style={{
                            gridRow: row + 1,
                            gridColumn: col + 1,
                            backgroundImage: GUIDE_PATTERN,
                          }}
                        />
                      )),
                )}

                {layout.cells.map((cell) => {
                  const isChanged = changed.has(cell.campo);
                  const isTarget = dropTarget?.campo === cell.campo && dragging !== cell.campo;
                  const isResizing = resizing?.campo === cell.campo;
                  return (
                    <div
                      key={cell.campo}
                      role="listitem"
                      tabIndex={editable ? 0 : undefined}
                      aria-label={`${cell.label}: ${percent(cell.cols)}%, posição ${cell.posicao}`}
                      aria-roledescription={editable ? 'campo arrastável' : undefined}
                      data-campo={cell.campo}
                      data-linha={cell.row + 1}
                      data-coluna={cell.colStart + 1}
                      data-colunas={cell.cols}
                      draggable={editable && !resizing}
                      onDragStart={
                        editable ? (event) => handleDragStart(event, cell.campo) : undefined
                      }
                      onDragEnd={endDrag}
                      onDragOver={
                        editable ? (event) => handleDragOverCell(event, cell.campo) : undefined
                      }
                      onDragLeave={() => {
                        if (dropTarget?.campo === cell.campo) setDropTarget(null);
                      }}
                      onDrop={editable ? (event) => handleDropOnCell(event, cell.campo) : undefined}
                      onKeyDown={
                        editable
                          ? (event) => handleKeyDown(event, cell.campo, cell.cols)
                          : undefined
                      }
                      className={cn(
                        'group relative z-10 m-1 flex min-w-0 flex-col justify-between rounded-md border bg-background/95 py-2 pl-3 pr-4 shadow-sm outline-none',
                        editable && 'cursor-grab focus-visible:ring-2 focus-visible:ring-primary',
                        isChanged
                          ? 'border-amber-500 ring-1 ring-amber-500/40'
                          : 'border-primary/40',
                        dragging === cell.campo && 'opacity-40',
                        isResizing && 'ring-2 ring-primary',
                      )}
                      style={{
                        gridRow: cell.row + 1,
                        gridColumn: `${cell.colStart + 1} / span ${cell.cols}`,
                      }}
                    >
                      {isTarget && (
                        <span
                          aria-hidden
                          className={cn(
                            'absolute inset-y-0 w-1 rounded bg-primary',
                            dropTarget?.side === 'before' ? '-left-2' : '-right-2',
                          )}
                        />
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1 truncate text-sm font-medium">
                          {editable && (
                            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate">
                            {cell.label}
                            {cell.tipoValidacao === 'obrigatorio' && (
                              <span className="ml-0.5 text-destructive">*</span>
                            )}
                            {cell.tipoValidacao === 'sugerido' && (
                              <span className="ml-0.5 text-blue-500">*</span>
                            )}
                          </span>
                        </span>
                        {isChanged && !isResizing && (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-500 px-1.5 py-0 text-[10px] text-amber-600"
                          >
                            alterado
                          </Badge>
                        )}
                        {isResizing && (
                          <Badge className="shrink-0 px-1.5 py-0 text-[10px]">
                            {percent(cell.cols)}%
                          </Badge>
                        )}
                      </div>
                      <div className="h-7 rounded border border-input bg-muted/40" />
                      <span className="truncate text-[11px] text-muted-foreground">
                        {percent(cell.cols)}% · posição {cell.posicao}
                      </span>

                      {editable && (
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Redimensionar ${cell.label}`}
                          title="Arraste para redimensionar"
                          className="absolute inset-y-1 right-0 flex w-3 cursor-ew-resize touch-none items-center justify-center rounded-r-md opacity-60 hover:bg-primary/15 hover:opacity-100 group-hover:opacity-100"
                          onPointerDown={(event) => handleResizeStart(event, cell.campo, cell.cols)}
                          onPointerMove={handleResizeMove}
                          onPointerUp={handleResizeEnd}
                          onPointerCancel={() => setResizing(null)}
                          // Not a drag source: resizing must not start a move.
                          draggable={false}
                          onDragStart={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        >
                          <span className="h-6 w-0.5 rounded bg-primary/60" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
