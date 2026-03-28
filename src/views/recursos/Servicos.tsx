import ParametroListPage from '@/components/shared/ParametroListPage';

const Servicos = () => (
  <ParametroListPage
    title="Serviços"
    description="Gerencie os serviços oferecidos"
    entityName="Serviço"
    storageKey="kreato_servicos"
    permissionPath={['Recursos', 'Parametrizações', 'Serviços']}
  />
);

export default Servicos;
