import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type Traducoes = {
  pt?: string;
  en?: string;
  es?: string;
};

const LANGUAGES: { code: keyof Traducoes; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

interface TraducaoTabProps {
  traducoes: Traducoes;
  onChange: (lang: keyof Traducoes, value: string) => void;
  readOnly?: boolean;
}

export const TraducaoTab = ({ traducoes, onChange, readOnly = false }: TraducaoTabProps) => {
  return (
    <div className="py-2">
      <p className="text-sm text-muted-foreground mb-4">
        Defina como este item será exibido quando o usuário utilizar cada idioma do sistema.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Idioma</TableHead>
            <TableHead>Tradução</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LANGUAGES.map(({ code, flag, label }) => (
            <TableRow key={code}>
              <TableCell>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-base">{flag}</span>
                  {label}
                </span>
              </TableCell>
              <TableCell>
                <Input
                  value={traducoes[code] ?? ''}
                  onChange={(e) => onChange(code, e.target.value)}
                  placeholder={`Nome em ${label}...`}
                  disabled={readOnly}
                  maxLength={100}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export function resolveNome(
  item: { nome?: string; titulo?: string; traducoes?: Traducoes | null },
  language: keyof Traducoes,
): string {
  const base = item.nome ?? item.titulo ?? '';
  if (!item.traducoes) return base;
  return item.traducoes[language]?.trim() || base;
}
