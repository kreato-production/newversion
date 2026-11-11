import ParametroListPage from '@/components/shared/ParametroListPage';
import { PARAMETROS } from '@/modules/parametros/parametros.config';

const TiposGravacao = () => <ParametroListPage {...PARAMETROS.tiposGravacao} />;

export default TiposGravacao;
