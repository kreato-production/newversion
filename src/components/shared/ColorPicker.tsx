import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
}

export const ColorPicker = ({ value, onChange, disabled, previewLabel }: ColorPickerProps) => {
  const safeValue = value || '#000000';

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
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

      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={safeValue}
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
        {previewLabel !== undefined && (
          <Badge style={{ backgroundColor: safeValue }} className="text-white ml-auto">
            {previewLabel || 'Preview'}
          </Badge>
        )}
      </div>
    </div>
  );
};
