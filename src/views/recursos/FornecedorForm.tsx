import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { FornecedorFormBody } from '@/components/recursos/FornecedorFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { parentPath } from '@/hooks/useRecordNavigation';
import { fornecedoresRepository } from '@/modules/fornecedores/fornecedores.repository.provider';
import { fornecedoresRoutes } from '@/modules/fornecedores/fornecedores.navigation';
import type { Fornecedor, FornecedorInput } from '@/modules/fornecedores/fornecedores.types';

const FornecedorForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const routes = useMemo(() => fornecedoresRoutes(parentPath(pathname)), [pathname]);

  return (
    <RecordFormPage<Fornecedor, FornecedorInput>
      id={id}
      routes={routes}
      permission={['Recursos', 'Fornecedores']}
      newTitle={t('field.newSupplier')}
      editTitle={(record) => record?.nome || t('field.editSupplier')}
      description={() => t('field.fillSupplierData')}
      notFoundTitle="Fornecedor não encontrado"
      load={(recordId) => fornecedoresRepository.getById(recordId)}
      save={(input) => fornecedoresRepository.save({ ...input, tenantId: user?.tenantId ?? null })}
      messages={{ created: t('field.supplierCreated'), updated: t('field.supplierUpdated') }}
    >
      {(props) => <FornecedorFormBody {...props} />}
    </RecordFormPage>
  );
};

export default FornecedorForm;
