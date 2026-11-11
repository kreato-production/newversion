import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const PRESET_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#6b7280',
  '#000000',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  /** Texto exibido no Badge de prévia. Se omitido, o Badge não é renderizado. */
  previewLabel?: string;
  /**
   * Variante de uma linha (altura de um input): mostra a cor atual e abre a paleta num popover.
   * Use em grids em que o campo ocupa uma coluna estreita.
   */
  compact?: boolean;
}

type SwatchProps = Pick<ColorPickerProps, 'value' | 'onChange' | 'disabled'>;

const PresetSwatches = ({ value, onChange, disabled }: SwatchProps) => (
  <div className="flex gap-2 flex-wrap">
    {PRESET_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        aria-label={color}
        className={`w-8 h-8 rounded-full border-2 transition-all ${
          value === color
            ? 'border-primary ring-2 ring-primary/50 scale-110'
            : 'border-border hover:scale-105'
        }`}
        style={{ backgroundColor: color }}
        onClick={() => onChange(color)}
        disabled={disabled}
      />
    ))}
  </div>
);

const CustomColorInputs = ({ value, onChange, disabled }: SwatchProps) => (
  <>
    <Input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      className="w-14 h-10 p-1 cursor-pointer"
      disabled={disabled}
    />
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="#000000"
      className="w-28 font-mono text-xs"
      disabled={disabled}
    />
  </>
);

export const ColorPicker = ({
  value,
  onChange,
  disabled,
  previewLabel,
  compact,
}: ColorPickerProps) => {
  const safeValue = value || '#000000';

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Escolher cor"
              className={cn(
                'flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm',
                'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: safeValue }}
              />
              <span className="truncate font-mono text-xs">{value}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto max-w-[19rem] space-y-3">
            <PresetSwatches value={value} onChange={onChange} disabled={disabled} />
            <div className="flex items-center gap-3">
              <CustomColorInputs value={value} onChange={onChange} disabled={disabled} />
            </div>
          </PopoverContent>
        </Popover>
        {previewLabel !== undefined && (
          <Badge
            style={{ backgroundColor: safeValue }}
            className="max-w-[50%] shrink truncate text-white"
            title={previewLabel || 'Preview'}
          >
            <span className="truncate">{previewLabel || 'Preview'}</span>
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PresetSwatches value={value} onChange={onChange} disabled={disabled} />

      <div className="flex items-center gap-3">
        <CustomColorInputs value={value} onChange={onChange} disabled={disabled} />
        {previewLabel !== undefined && (
          <Badge style={{ backgroundColor: safeValue }} className="text-white ml-auto">
            {previewLabel || 'Preview'}
          </Badge>
        )}
      </div>
    </div>
  );
};
