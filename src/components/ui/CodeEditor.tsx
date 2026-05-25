'use client';

import { useEffect } from 'react';
import SimpleCodeEditor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Core languages
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup'; // html + xml
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-javascript';

// Minimal Prism theme injected once via a style tag
const PRISM_THEME = `
.token.comment,.token.prolog,.token.doctype,.token.cdata{color:#6b7280}
.token.punctuation{color:#9ca3af}
.token.property,.token.tag,.token.boolean,.token.number,.token.constant,.token.symbol,.token.deleted{color:#f87171}
.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.inserted{color:#34d399}
.token.operator,.token.entity,.token.url,.language-css .token.string,.style .token.string{color:#fbbf24}
.token.atrule,.token.attr-value,.token.keyword{color:#60a5fa}
.token.function,.token.class-name{color:#c084fc}
.token.regex,.token.important,.token.variable{color:#fb923c}
`;

function ensureTheme() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('prism-inline-theme')) return;
  const style = document.createElement('style');
  style.id = 'prism-inline-theme';
  style.textContent = PRISM_THEME;
  document.head.appendChild(style);
}

type SupportedLanguage = 'json' | 'xml' | 'html' | 'yaml' | 'javascript' | 'plain';

function resolveGrammar(lang: SupportedLanguage) {
  switch (lang) {
    case 'json':
      return Prism.languages.json;
    case 'xml':
      return Prism.languages.xml;
    case 'html':
      return Prism.languages.html;
    case 'yaml':
      return Prism.languages.yaml;
    case 'javascript':
      return Prism.languages.javascript;
    default:
      return undefined;
  }
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  placeholder,
  minHeight = 160,
  className,
}: CodeEditorProps) {
  useEffect(() => {
    ensureTheme();
  }, []);

  const grammar = resolveGrammar(language);

  const highlight = (code: string) => (grammar ? Prism.highlight(code, grammar, language) : code);

  return (
    <div
      className={`rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring overflow-hidden ${className ?? ''}`}
      style={{ minHeight }}
    >
      <SimpleCodeEditor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={10}
        placeholder={placeholder}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 12,
          minHeight,
          lineHeight: '1.6',
          background: 'transparent',
        }}
        textareaClassName="focus:outline-none"
      />
    </div>
  );
}

/** Maps the user-facing linguagem label to a Prism language key */
export function linguagemToLang(linguagem: string | null | undefined): SupportedLanguage {
  switch (linguagem) {
    case 'JSON':
      return 'json';
    case 'XML':
      return 'xml';
    case 'HTML':
      return 'html';
    case 'YAML':
      return 'yaml';
    case 'API':
      return 'javascript';
    default:
      return 'plain';
  }
}
