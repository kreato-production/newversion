import type { ElementType, ReactNode } from 'react';
import { ArrowLeft, FileQuestion, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FormPageProps {
  title: string;
  description?: string;
  /** id of the `<form>` inside `children`; the Save button submits it. */
  formId: string;
  onBack: () => void;
  isEditing: boolean;
  readOnly?: boolean;
  isLoading?: boolean;
  isSubmitting?: boolean;
  /** When set, the record could not be loaded: shows the not-found state instead of the form. */
  loadError?: string | null;
  notFoundTitle?: string;
  notFoundIcon?: ElementType;
  /** Previous/next navigation between records of the list the user came from. */
  navigation?: ModalNavigationProps;
  /** Label of the save button when creating (default "Cadastrar"). */
  createLabel?: string;
  /** Extra actions rendered before the navigation (e.g. export, duplicate). */
  actions?: ReactNode;
  /** Hides the Save button, for pages that save through their own action (e.g. Publicar). */
  hideSubmit?: boolean;
  children: ReactNode;
}

/**
 * Standard layout of a cadastro rendered as a page (instead of a modal):
 * header, action bar (back, prev/next, cancel, save) and the form inside a card.
 */
export const FormPage = ({
  title,
  description,
  formId,
  onBack,
  isEditing,
  readOnly = false,
  isLoading = false,
  isSubmitting = false,
  loadError,
  notFoundTitle = 'Registro não encontrado',
  notFoundIcon = FileQuestion,
  navigation,
  createLabel = 'Cadastrar',
  actions,
  hideSubmit = false,
  children,
}: FormPageProps) => {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader title={title} description={description} />

      <ListActionBar className="justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          {actions}
          {navigation && <ModalNavigation {...navigation} />}
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            {readOnly || hideSubmit ? 'Fechar' : t('common.cancel')}
          </Button>
          {!readOnly && !hideSubmit && (
            <Button
              type="submit"
              form={formId}
              size="sm"
              disabled={isSubmitting || isLoading || !!loadError}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? t('common.save') : createLabel}
            </Button>
          )}
        </div>
      </ListActionBar>

      <Card>
        <CardContent className="form-page-content p-6">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-12"
              role="status"
              aria-label="Carregando"
            >
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <EmptyState title={notFoundTitle} description={loadError} icon={notFoundIcon} />
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
};
