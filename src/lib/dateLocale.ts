import { ptBR, enUS, es } from 'date-fns/locale';
import type { Language } from '@/contexts/LanguageContext';

export const getDateLocale = (language: Language) => {
  switch (language) {
    case 'en': return enUS;
    case 'es': return es;
    default: return ptBR;
  }
};

export const getDayAbbreviations = (language: Language): string[] => {
  switch (language) {
    case 'en': return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    case 'es': return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    default: return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  }
};
