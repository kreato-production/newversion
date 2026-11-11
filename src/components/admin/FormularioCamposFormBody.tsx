import { useEffect, useMemo, useState } from 'react';
import { Check, Info, Loader2, Lock, RotateCcw, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormularioPreview } from '@/components/admin/FormularioPreview';
import {
  changedCampos,
  defaultRows,
  moveCampo,
  withEffectivePositions,
  type FormularioCampoRow,
} from '@/components/admin/formularioLayout';
import {
  FORM_GRID_COLUMNS,
  TAMANHO_OPTIONS,
  tamanhoToSpan,
  type FormDefinition,
} from '@/data/formsRegistry';
import type { FieldValidationType } from '@/modules/admin/admin-config.api';
import { languageLabels, type Language } from '@/contexts/LanguageContext';
import {
  DEFAULT_STRIPE_COLOR,
  FORMS_WITH_LIST_STYLE,
  LIST_STRIPE_COLORS,
  stripeColorOf,
  type FormularioListaConfig,
} from '@/data/listStripeColors';
import { zebraBodyProps } from '@/lib/listZebra';
import { cn } from '@/lib/utils';

/** Lista como é gravada: sem zebra não tem cor; zebrada sempre tem uma cor da paleta. */
function normalizeLista(lista: FormularioListaConfig): FormularioListaConfig {
  return lista.zebrado
    ? { zebrado: true, corZebra: lista.corZebra ?? DEFAULT_STRIPE_COLOR }
    : { zebrado: false, corZebra: null };
}

function sameLista(a: FormularioListaConfig, b: FormularioListaConfig): boolean {
  const left = normalizeLista(a);
  const right = normalizeLista(b);
  return left.zebrado === right.zebrado && left.corZebra === right.corZebra;
}

/** Idiomas do sistema (colunas do tabulador Tradução). */
const LANGUAGES = Object.entries(languageLabels) as Array<
  [Language, { name: string; flag: string }]
>;

export type { FormularioCampoRow } from '@/components/admin/formularioLayout';

/** Largura padrão de um campo, para o item "Padrão" do Tamanho. */
function defaultWidthLabel(form: FormDefinition, campo: string): string {
  const span =
    tamanhoToSpan(form.campos.find((field) => field.campo === campo)?.tamanhoPadrao) ??
    FORM_GRID_COLUMNS;
  return `Padrão (${Math.round((span * 100) / FORM_GRID_COLUMNS)}%)`;
}

/**
 * Posição de um campo. Confirma ao sair do campo ou com Enter e move o campo para essa posição
 * (como arrastar no Preview): os demais se reorganizam e as posições continuam 1..n.
 */
const PosicaoInput = ({
  label,
  value,
  max,
  disabled,
  onCommit,
}: {
  label: string;
  value: number | null;
  max: number;
  disabled: boolean;
  onCommit: (posicao: number) => void;
}) => {
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => setText(value == null ? '' : String(value)), [value]);

  const commit = () => {
    const posicao = Number(text);
    if (text.trim() === '' || !Number.isInteger(posicao) || posicao < 1) {
      setText(value == null ? '' : String(value));
      return;
    }
    const clamped = Math.min(posicao, max);
    setText(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <Input
      type="number"
      min={1}
      max={max}
      className="h-8 w-20"
      aria-label={label}
      value={text}
      placeholder="—"
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
    />
  );
};

/** Formulário do registro com a configuração publicada de cada campo (para o tenant em uso). */
export interface FormularioConfig {
  form: FormDefinition;
  rows: FormularioCampoRow[];
  /** Aparência da lista do módulo (tabulador Lista). */
  lista: FormularioListaConfig;
}

/** O que o "Publicar alterações" grava. */
export interface FormularioPublicacao {
  rows: FormularioCampoRow[];
  lista: FormularioListaConfig;
}

export interface FormularioCamposFormBodyProps {
  data: FormularioConfig;
  readOnly: boolean;
  /** Why the configuration is read-only (shown above the tabs). */
  readOnlyReason?: string;
  /** Publica a configuração; resolve true quando gravou (a página mostra as mensagens). */
  onPublish: (publicacao: FormularioPublicacao) => Promise<boolean>;
}

/**
 * Configuração de um formulário: "Campos" (validação, tamanho e posição de cada campo),
 * "Tradução" (nome do campo por idioma), "Lista" (lista do módulo zebrada ou não, e a cor) e
 * "Preview" (como o formulário fica, com publicar e voltar ao padrão).
 * As alterações ficam em rascunho até serem publicadas.
 */
export const FormularioCamposFormBody = ({
  data,
  readOnly,
  readOnlyReason,
  onPublish,
}: FormularioCamposFormBodyProps) => {
  // Posições sempre preenchidas (as em branco viram a ordem efetiva); `changedCampos` compara
  // valores efetivos, então isso não conta como alteração.
  const [initialRows] = useState(() => withEffectivePositions(data.form, data.rows));
  const [published, setPublished] = useState<FormularioCampoRow[]>(initialRows);
  const [rows, setRows] = useState<FormularioCampoRow[]>(initialRows);
  const [publishedLista, setPublishedLista] = useState<FormularioListaConfig>(data.lista);
  const [lista, setLista] = useState<FormularioListaConfig>(data.lista);
  const [isPublishing, setIsPublishing] = useState(false);
  const [confirmDefault, setConfirmDefault] = useState(false);

  const changed = useMemo(
    () => changedCampos(data.form, rows, published),
    [data.form, rows, published],
  );
  const listaChanged = !sameLista(lista, publishedLista);
  const hasChanges = changed.size > 0 || listaChanged;
  const stripeColor = stripeColorOf(normalizeLista(lista));
  const selectedColor = normalizeLista({ zebrado: true, corZebra: lista.corZebra }).corZebra;
  const listaAplicada = FORMS_WITH_LIST_STYLE.has(data.form.id);
  const isDefault = useMemo(
    () => changedCampos(data.form, rows, defaultRows(rows)).size === 0,
    [data.form, rows],
  );

  const updateRow = (campo: string, patch: Partial<FormularioCampoRow>) => {
    setRows((prev) => prev.map((row) => (row.campo === campo ? { ...row, ...patch } : row)));
  };

  const publish = async () => {
    if (readOnly || !hasChanges || isPublishing) return;
    setIsPublishing(true);
    try {
      // Grava a posição de todos os campos (1..n).
      const draft = withEffectivePositions(data.form, rows);
      const draftLista = normalizeLista(lista);
      if (await onPublish({ rows: draft, lista: draftLista })) {
        setPublished(draft);
        setRows(draft);
        setPublishedLista(draftLista);
        setLista(draftLista);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const restoreDefault = () => {
    setRows((prev) => withEffectivePositions(data.form, defaultRows(prev)));
    setConfirmDefault(false);
  };

  const publishButton = (
    <Button
      type="button"
      size="sm"
      onClick={() => void publish()}
      disabled={!hasChanges || isPublishing}
    >
      {isPublishing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Upload className="mr-2 h-4 w-4" />
      )}
      Publicar alterações
    </Button>
  );

  const setTraducao = (campo: string, idioma: Language, label: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.campo === campo ? { ...row, traducoes: { ...row.traducoes, [idioma]: label } } : row,
      ),
    );
  };

  const pendingParts = [
    changed.size === 1
      ? '1 campo alterado'
      : changed.size > 1
        ? `${changed.size} campos alterados`
        : '',
    listaChanged ? 'aparência da lista alterada' : '',
  ].filter(Boolean);
  const pendingNotice = hasChanges && (
    <Alert className="border-amber-500/50">
      <Info className="h-4 w-4" />
      <AlertDescription>
        Alterações ainda não publicadas: {pendingParts.join(' e ')}. Publique (tabulador Preview,
        Tradução ou Lista) para atualizar o módulo.
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Módulo <Badge variant="outline">{data.form.modulo}</Badge>
        <span>· {data.form.campos.length} campos</span>
      </div>

      {readOnly && readOnlyReason && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>{readOnlyReason}</AlertDescription>
        </Alert>
      )}

      {!data.form.layoutConfiguravel && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            O formulário de {data.form.nome} ainda não aplica Tamanho e Posição: ao publicar, só a
            validação (obrigatório / sugerido) tem efeito no módulo.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="campos">
        <TabsList>
          <TabsTrigger value="campos">Campos</TabsTrigger>
          <TabsTrigger value="traducao">Tradução</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="preview">
            Preview
            {hasChanges && (
              <span className="ml-2 h-2 w-2 rounded-full bg-amber-500" aria-label="alterações" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campos" className="space-y-4">
          {pendingNotice}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead className="w-[180px]">Validação</TableHead>
                <TableHead className="w-[160px]">Tamanho</TableHead>
                <TableHead className="w-[100px]">Posição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.campo}>
                  <TableCell className="font-medium">
                    {row.label}
                    {row.tipoValidacao === 'obrigatorio' && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                    {row.tipoValidacao === 'sugerido' && (
                      <span className="text-blue-500 ml-1">*</span>
                    )}
                    {changed.has(row.campo) && (
                      <Badge
                        variant="outline"
                        className="ml-2 border-amber-500 px-1.5 py-0 text-[10px] text-amber-600"
                      >
                        alterado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.tipoValidacao ?? 'none'}
                      disabled={readOnly}
                      onValueChange={(value) => {
                        // Radix pode disparar '' ao montar; não é uma escolha do usuário.
                        if (!value) return;
                        updateRow(row.campo, {
                          tipoValidacao: value === 'none' ? null : (value as FieldValidationType),
                        });
                      }}
                    >
                      <SelectTrigger className="h-8" aria-label={`Validação de ${row.label}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                        <SelectItem value="sugerido">Sugerido</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.tamanho ?? 'padrao'}
                      disabled={readOnly}
                      onValueChange={(value) => {
                        if (!value) return;
                        updateRow(row.campo, { tamanho: value === 'padrao' ? null : value });
                      }}
                    >
                      <SelectTrigger className="h-8" aria-label={`Tamanho de ${row.label}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="padrao">
                          {defaultWidthLabel(data.form, row.campo)}
                        </SelectItem>
                        {TAMANHO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <PosicaoInput
                      label={`Posição de ${row.label}`}
                      value={row.posicao}
                      max={rows.length}
                      disabled={readOnly}
                      onCommit={(posicao) =>
                        setRows((prev) => moveCampo(data.form, prev, row.campo, posicao - 1))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="text-xs text-muted-foreground flex flex-wrap gap-6 pt-1">
            <span>
              <span className="text-destructive font-bold">*</span> Obrigatório — impede a gravação
            </span>
            <span>
              <span className="text-blue-500 font-bold">*</span> Sugerido — indica preenchimento
              recomendado
            </span>
            <span>
              Tamanho em percentual da largura da área dos campos (Padrão = tamanho original).
              Posição é a ordem do campo no formulário: ao mudar, os demais se reorganizam.
            </span>
          </div>
        </TabsContent>

        <TabsContent value="traducao" className="space-y-4">
          {pendingNotice}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Nome do campo em cada idioma. Sem tradução, o formulário mostra o nome padrão.
            </p>
            {!readOnly && publishButton}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Padrão</TableHead>
                {LANGUAGES.map(([idioma, { name, flag }]) => (
                  <TableHead key={idioma} className="min-w-[180px]">
                    <span aria-hidden="true">{flag}</span> {name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.campo}>
                  <TableCell className="font-medium text-muted-foreground">
                    {row.label}
                    {changed.has(row.campo) && (
                      <Badge
                        variant="outline"
                        className="ml-2 border-amber-500 px-1.5 py-0 text-[10px] text-amber-600"
                      >
                        alterado
                      </Badge>
                    )}
                  </TableCell>
                  {LANGUAGES.map(([idioma, { name }]) => (
                    <TableCell key={idioma}>
                      <Input
                        className="h-8"
                        aria-label={`${row.label} em ${name}`}
                        value={row.traducoes?.[idioma] ?? ''}
                        placeholder={row.label}
                        maxLength={120}
                        disabled={readOnly}
                        onChange={(e) => setTraducao(row.campo, idioma, e.target.value)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="lista" className="space-y-4">
          {pendingNotice}
          {!listaAplicada && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A lista de {data.form.nome} ainda não aplica esta configuração.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Como as linhas da lista do módulo aparecem para os usuários.
            </p>
            {!readOnly && publishButton}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Estilo das linhas</Label>
                <RadioGroup
                  value={lista.zebrado ? 'zebrada' : 'simples'}
                  onValueChange={(value) => {
                    if (!value) return;
                    setLista((prev) => ({ ...prev, zebrado: value === 'zebrada' }));
                  }}
                  disabled={readOnly}
                  className="gap-2"
                  aria-label="Estilo das linhas"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="simples" id="lista-simples" />
                    <Label htmlFor="lista-simples" className="font-normal">
                      Sem zebra (todas as linhas brancas)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="zebrada" id="lista-zebrada" />
                    <Label htmlFor="lista-zebrada" className="font-normal">
                      Zebrada (intercala a linha branca com uma cor)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {lista.zebrado && (
                <div className="space-y-2">
                  <Label id="lista-cor">Cor das linhas intercaladas</Label>
                  <div
                    role="radiogroup"
                    aria-labelledby="lista-cor"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                  >
                    {LIST_STRIPE_COLORS.map((option) => {
                      const selected = option.value === selectedColor;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={option.label}
                          disabled={readOnly}
                          onClick={() => setLista({ zebrado: true, corZebra: option.value })}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                            selected
                              ? 'border-primary ring-2 ring-primary/40'
                              : 'border-border hover:border-primary/50',
                          )}
                        >
                          <span
                            className="flex h-7 w-full items-center justify-center rounded border border-black/5"
                            style={{ backgroundColor: option.color }}
                          >
                            {selected && <Check className="h-4 w-4 text-foreground/70" />}
                          </span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Pré-visualização</Label>
              <div className="overflow-hidden rounded-md border">
                <Table aria-label="Pré-visualização da lista">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody {...zebraBodyProps(stripeColor)}>
                    {['Registro 1', 'Registro 2', 'Registro 3', 'Registro 4', 'Registro 5'].map(
                      (nome) => (
                        <TableRow key={nome}>
                          <TableCell className="py-1">{nome}</TableCell>
                          <TableCell className="py-1 text-muted-foreground">Ativo</TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {hasChanges
                ? 'Preview com as alterações ainda não publicadas (destacadas).'
                : 'Configuração publicada no formulário do módulo.'}
            </p>
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDefault(true)}
                  disabled={isDefault || isPublishing}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Voltar ao padrão
                </Button>
                {publishButton}
              </div>
            )}
          </div>

          <FormularioPreview
            form={data.form}
            rows={rows}
            changed={changed}
            readOnly={readOnly || isPublishing}
            onRowsChange={setRows}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDefault} onOpenChange={setConfirmDefault}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar à configuração padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os campos de {data.form.nome} voltam ao padrão: sem validação configurada e com
              o tamanho e a posição originais do formulário. As traduções e a aparência da lista não
              mudam. O formulário do módulo só muda depois de publicar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={restoreDefault}>Voltar ao padrão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
