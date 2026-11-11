import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { TenantFormBody } from '@/components/admin/TenantFormBody';
import {
  ApiTenantsRepository,
  type TenantApiInput,
} from '@/modules/tenants/tenants.api.repository';
import { TENANTS_ROUTES } from '@/modules/tenants/tenants.navigation';
import type { Tenant } from '@/views/admin/Tenants';

const repository = new ApiTenantsRepository();

/** Global > Tenants (GLOBAL_ADMIN only; the API enforces it). */
const TenantForm = ({ id }: { id?: string }) => (
  <RecordFormPage<Tenant, TenantApiInput>
    id={id}
    routes={TENANTS_ROUTES}
    newTitle="Novo Tenant"
    editTitle={(record) => record?.nome || 'Editar Tenant'}
    notFoundTitle="Tenant não encontrado"
    load={async (recordId) => (await repository.getById(recordId)) as Tenant}
    save={(input) => repository.save({ ...input, id })}
    messages={{ created: 'Tenant criado com sucesso!', updated: 'Tenant atualizado com sucesso!' }}
  >
    {(props) => <TenantFormBody {...props} />}
  </RecordFormPage>
);

export default TenantForm;
