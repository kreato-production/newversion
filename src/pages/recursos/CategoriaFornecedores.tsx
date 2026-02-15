import ParametroListPage from '@/components/shared/ParametroListPage';

const CategoriaFornecedores = () => (
  <ParametroListPage
    title="Categoria de Fornecedores"
    description="Gerencie as categorias de fornecedores"
    entityName="Categoria"
    storageKey="kreato_categoria_fornecedores"
    permissionPath={['Recursos', 'Parametrizações', 'Categoria Fornecedores']}
  />
);

export default CategoriaFornecedores;
