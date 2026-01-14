import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, languageLabels, Language } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSelector = ({
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  className = '',
}: LanguageSelectorProps) => {
  const { language, setLanguage, t } = useLanguage();
  const languages: Language[] = ['pt', 'en', 'es'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Globe className="h-5 w-5" />
          {showLabel && (
            <span className="ml-2">{languageLabels[language].flag}</span>
          )}
          <span className="sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer gap-2 ${language === lang ? 'bg-accent' : ''}`}
          >
            <span className="text-lg">{languageLabels[lang].flag}</span>
            <span>{languageLabels[lang].name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
