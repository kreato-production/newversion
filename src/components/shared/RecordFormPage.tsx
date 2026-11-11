import type { ElementType, ReactNode } from 'react';
import { FormPage } from '@/components/shared/FormPage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordNavigation, type RecordRouteConfig } from '@/hooks/useRecordNavigation';
import { useRecordPage } from '@/hooks/useRecordPage';

/** Props every form body rendered by `RecordFormPage` receives. */
export interface RecordFormBodyProps<TRecord, TInput> {
  /** id of the `<form>` the body must render; the page's Save button submits it. */
  formId: string;
  /** Loaded record, or null when creating. The body initializes its fields from it. */
  data: TRecord | null;
  readOnly: boolean;
  /** Saves the values; the page shows toasts and returns to the list on success. */
  onSubmit: (input: TInput) => Promise<void>;
}

export interface RecordFormPageProps<TRecord, TInput> {
  id?: string;
  routes: RecordRouteConfig;
  /** `[modulo, subModulo1, subModulo2?]` checked with canIncluir / canAlterar. */
  permission?: readonly [string, string, string?];
  newTitle: string;
  /** Title in edit mode; receives the loaded record (null while loading). */
  editTitle: (record: TRecord | null) => string;
  description?: (isEditing: boolean) => string;
  notFoundTitle?: string;
  notFoundIcon?: ElementType;
  load: (id: string) => Promise<TRecord>;
  save: (input: TInput) => Promise<unknown>;
  messages?: { created?: string; updated?: string };
  createLabel?: string;
  /** Renders the fields. Mounted only after the record is loaded. */
  children: (props: RecordFormBodyProps<TRecord, TInput>) => ReactNode;
}

const FORM_ID = 'record-form';

/**
 * Form page for cadastros whose fields keep their own state (complex forms with
 * sub-lists, calculated fields...): loads the record, checks permissions, saves with
 * toasts and handles back / previous-next navigation, around a body rendered by `children`.
 */
export function RecordFormPage<TRecord, TInput>({
  id,
  routes,
  permission,
  newTitle,
  editTitle,
  description,
  notFoundTitle,
  notFoundIcon,
  load,
  save,
  messages,
  createLabel = 'Salvar',
  children,
}: RecordFormPageProps<TRecord, TInput>) {
  const { canIncluir, canAlterar } = usePermissions();
  const { goBack, navigation } = useRecordNavigation(routes, id);

  const readOnly = permission
    ? id
      ? !canAlterar(permission[0], permission[1], permission[2] || '-')
      : !canIncluir(permission[0], permission[1], permission[2] || '-')
    : false;

  const page = useRecordPage<TRecord, TInput>({
    id,
    load,
    save,
    onSaved: goBack,
    readOnly,
    messages,
  });

  const onSubmit = async (input: TInput) => {
    if (page.isSubmitting) return;
    await page.submit(input);
  };

  return (
    <FormPage
      title={page.isEditing ? editTitle(page.record) : newTitle}
      description={description?.(page.isEditing)}
      formId={FORM_ID}
      onBack={goBack}
      isEditing={page.isEditing}
      readOnly={readOnly}
      isLoading={page.isLoading}
      isSubmitting={page.isSubmitting}
      loadError={page.loadError}
      notFoundTitle={notFoundTitle}
      notFoundIcon={notFoundIcon}
      navigation={navigation}
      createLabel={createLabel}
    >
      {children({ formId: FORM_ID, data: page.record, readOnly, onSubmit })}
    </FormPage>
  );
}
