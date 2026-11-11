import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** Existing tags offered as autocomplete. */
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  maxLength?: number;
  className?: string;
}

const normalize = (tag: string) => tag.trim().replace(/\s+/g, ' ');
const sameTag = (a: string, b: string) =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'accent' }) === 0;

export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Digite e pressione Enter',
  disabled = false,
  maxTags = 30,
  maxLength = 40,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const listId = useId();
  const limitReached = value.length >= maxTags;

  const availableSuggestions = useMemo(
    () => suggestions.filter((tag) => !value.some((current) => sameTag(current, tag))),
    [suggestions, value],
  );

  const addTags = (raw: string) => {
    const next = [...value];
    for (const part of raw.split(',')) {
      const tag = normalize(part).slice(0, maxLength);
      if (!tag || next.length >= maxTags || next.some((current) => sameTag(current, tag))) continue;
      // Reuse the spelling of an existing tag so filters group them together.
      next.push(suggestions.find((s) => sameTag(s, tag)) ?? tag);
    }
    if (next.length !== value.length) onChange(next);
    setDraft('');
  };

  const removeTag = (tag: string) => onChange(value.filter((current) => current !== tag));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTags(draft);
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1 font-normal">
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Remover tag ${tag}`}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <input
          id={id}
          value={draft}
          list={availableSuggestions.length > 0 ? listId : undefined}
          maxLength={maxLength}
          disabled={limitReached}
          placeholder={limitReached ? `Limite de ${maxTags} tags` : value.length ? '' : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          onChange={(event) => {
            const next = event.target.value;
            // Picking a datalist option is not a typed keystroke (no "insertText" input type).
            const inputType = (event.nativeEvent as InputEvent).inputType;
            const pickedSuggestion =
              (!inputType || inputType === 'insertReplacementText') && suggestions.includes(next);
            if (pickedSuggestion) addTags(next);
            else setDraft(next);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && addTags(draft)}
        />
      )}
      {disabled && value.length === 0 && <span className="text-muted-foreground">-</span>}
      {availableSuggestions.length > 0 && (
        <datalist id={listId}>
          {availableSuggestions.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      )}
    </div>
  );
}
