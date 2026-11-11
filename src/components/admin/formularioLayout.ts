import {
  FORM_GRID_COLUMNS,
  TAMANHO_OPTIONS,
  tamanhoToSpan,
  type FormDefinition,
  type TamanhoCampo,
} from '@/data/formsRegistry';
import type { FieldTraducoes, FieldValidationType } from '@/modules/admin/admin-config.api';

export const GRID_COLUMNS = FORM_GRID_COLUMNS;

/** Configuração editável de um campo (o que é publicado). */
export interface FormularioCampoRow {
  campo: string;
  label: string;
  tipoValidacao: FieldValidationType;
  tamanho: string | null;
  posicao: number | null;
  /** Rótulo por idioma (tabulador Tradução); sem tradução, o formulário usa o padrão. */
  traducoes: FieldTraducoes | null;
}

/** Só as traduções preenchidas (sem espaços nas pontas); null quando não há nenhuma. */
export function cleanTraducoes(
  traducoes: FieldTraducoes | null | undefined,
): FieldTraducoes | null {
  const entries = Object.entries(traducoes ?? {})
    .map(([idioma, label]) => [idioma, label.trim()] as const)
    .filter(([, label]) => label !== '');
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function sameTraducoes(a: FieldTraducoes | null, b: FieldTraducoes | null): boolean {
  const left = cleanTraducoes(a) ?? {};
  const right = cleanTraducoes(b) ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => left[key] === right[key]);
}

/** Campo posicionado na grade do preview (linha e coluna começam em 0). */
export interface LayoutCell {
  campo: string;
  label: string;
  tipoValidacao: FieldValidationType;
  /** Colunas ocupadas (de 12), já resolvido o "Padrão". */
  cols: number;
  /** Posição efetiva (a configurada, ou a padrão pela ordem do formulário). */
  posicao: number;
  row: number;
  colStart: number;
  /** Seção do formulário (`grupo` do registro); undefined = área principal. */
  grupo?: string;
}

export interface FormLayout {
  cells: LayoutCell[];
  /** Linhas da grade, contando as de título dos grupos. */
  rowCount: number;
  /** Linhas de título: cada grupo começa numa linha nova, depois do seu título. */
  headings: Array<{ row: number; label: string }>;
}

/** Configuração padrão: sem validação, tamanho e posição padrão (as traduções ficam). */
export function defaultRows(rows: FormularioCampoRow[]): FormularioCampoRow[] {
  return rows.map(
    (row): FormularioCampoRow => ({ ...row, tipoValidacao: null, tamanho: null, posicao: null }),
  );
}

/**
 * Campos cuja configuração difere entre `a` e `b`. Tamanho e posição comparam o valor efetivo
 * (em branco = padrão do formulário): "3" na posição de quem já é o 3º não é alteração.
 */
export function changedCampos(
  form: FormDefinition,
  a: FormularioCampoRow[],
  b: FormularioCampoRow[],
): Set<string> {
  const defaults = new Map(
    form.campos.map((field, index) => [
      field.campo,
      { span: tamanhoToSpan(field.tamanhoPadrao) ?? GRID_COLUMNS, posicao: index + 1 },
    ]),
  );
  const span = (row: FormularioCampoRow) =>
    tamanhoToSpan(row.tamanho) ?? defaults.get(row.campo)?.span ?? GRID_COLUMNS;
  const posicao = (row: FormularioCampoRow) => row.posicao ?? defaults.get(row.campo)?.posicao;

  const byCampo = new Map(b.map((row) => [row.campo, row]));
  const changed = new Set<string>();
  for (const row of a) {
    const other = byCampo.get(row.campo);
    if (
      !other ||
      other.tipoValidacao !== row.tipoValidacao ||
      span(other) !== span(row) ||
      posicao(other) !== posicao(row) ||
      !sameTraducoes(other.traducoes, row.traducoes)
    ) {
      changed.add(row.campo);
    }
  }
  return changed;
}

/**
 * Posiciona os campos como o formulário do módulo faz: grade de 12 colunas, cada campo com
 * `col-span` = tamanho e CSS `order` = posição. A grade CSS (sem `dense`) ordena pela posição
 * (empate: ordem do formulário) e coloca cada campo logo após o anterior; quando ele não cabe
 * no resto da linha, vai para o início da linha seguinte. Campos de um `grupo` (seção ou
 * tabulador próprio) ficam na grade da seção: só se ordenam entre si e começam numa linha nova,
 * depois de uma linha com o título do grupo.
 */
export function computeFormLayout(form: FormDefinition, rows: FormularioCampoRow[]): FormLayout {
  const byCampo = new Map(rows.map((row) => [row.campo, row]));

  const items = form.campos.map((field, index) => {
    const row = byCampo.get(field.campo);
    return {
      campo: field.campo,
      label: row?.label ?? field.label,
      tipoValidacao: row?.tipoValidacao ?? null,
      cols: tamanhoToSpan(row?.tamanho) ?? tamanhoToSpan(field.tamanhoPadrao) ?? GRID_COLUMNS,
      posicao: row?.posicao ?? index + 1,
      index,
      grupo: field.grupo,
    };
  });
  // Grupos na ordem em que aparecem no registro (a área principal primeiro).
  const groups = [...new Set(items.map((item) => item.grupo))];

  const cells: LayoutCell[] = [];
  const headings: FormLayout['headings'] = [];
  let row = -1;
  for (const grupo of groups) {
    const groupItems = items
      .filter((item) => item.grupo === grupo)
      .sort((a, b) => a.posicao - b.posicao || a.index - b.index);
    if (grupo !== undefined) {
      row += 1;
      headings.push({ row, label: grupo });
    }
    row += 1;
    let col = 0;
    for (const { index: _index, ...item } of groupItems) {
      if (col + item.cols > GRID_COLUMNS) {
        row += 1;
        col = 0;
      }
      cells.push({ ...item, row, colStart: col });
      col += item.cols;
    }
  }

  return { cells, rowCount: row + 1, headings };
}

/**
 * Preenche a posição de todos os campos com a ordem efetiva (1..n), sem mudar o layout: a
 * coluna Posição mostra a ordem completa, inclusive dos campos na posição padrão.
 */
export function withEffectivePositions(
  form: FormDefinition,
  rows: FormularioCampoRow[],
): FormularioCampoRow[] {
  const position = new Map(
    computeFormLayout(form, rows).cells.map((cell, index) => [cell.campo, index + 1]),
  );
  return rows.map((row) => {
    const posicao = position.get(row.campo);
    return posicao === undefined ? row : { ...row, posicao };
  });
}

/** Colunas permitidas (as do "Tamanho"), em ordem crescente. */
export const ALLOWED_SPANS = TAMANHO_OPTIONS.map((option) => option.span).sort((a, b) => a - b);

/** Tamanho permitido mais próximo de `raw` colunas (no empate, o maior). */
export function snapSpan(raw: number): number {
  return ALLOWED_SPANS.reduce((best, span) =>
    Math.abs(span - raw) <= Math.abs(best - raw) ? span : best,
  );
}

/** Próximo tamanho permitido acima (+1) ou abaixo (-1) de `span`. */
export function stepSpan(span: number, direction: 1 | -1): number {
  const index = ALLOWED_SPANS.indexOf(snapSpan(span));
  const next = Math.min(ALLOWED_SPANS.length - 1, Math.max(0, index + direction));
  return ALLOWED_SPANS[next];
}

function spanToTamanho(span: number): TamanhoCampo {
  return TAMANHO_OPTIONS.find((option) => option.span === span)?.value ?? '4';
}

/**
 * Define o tamanho de um campo em colunas (já encaixado). Igual ao padrão do formulário →
 * tamanho em branco ("Padrão"), para não marcar como alterado o que não mudou.
 */
export function resizeCampo(
  form: FormDefinition,
  rows: FormularioCampoRow[],
  campo: string,
  span: number,
): FormularioCampoRow[] {
  const field = form.campos.find((item) => item.campo === campo);
  const defaultSpan = tamanhoToSpan(field?.tamanhoPadrao) ?? GRID_COLUMNS;
  const snapped = snapSpan(span);
  const tamanho = snapped === defaultSpan ? null : spanToTamanho(snapped);
  return rows.map((row) => (row.campo === campo ? { ...row, tamanho } : row));
}

/**
 * Move um campo para `targetIndex` na ordem atual do formulário (índice já sem o campo
 * movido) e grava a posição de todos os campos (1..n), para a coluna Posição mostrar a ordem
 * completa. Só conta como alteração a posição que difere da efetiva (ver `changedCampos`).
 */
export function moveCampo(
  form: FormDefinition,
  rows: FormularioCampoRow[],
  campo: string,
  targetIndex: number,
): FormularioCampoRow[] {
  const order = computeFormLayout(form, rows).cells.map((cell) => cell.campo);
  const from = order.indexOf(campo);
  if (from < 0) return rows;
  order.splice(from, 1);
  order.splice(Math.max(0, Math.min(targetIndex, order.length)), 0, campo);

  const position = new Map(order.map((item, index) => [item, index + 1]));
  return rows.map((row) => {
    const posicao = position.get(row.campo);
    return posicao === undefined ? row : { ...row, posicao };
  });
}
