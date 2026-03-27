import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { PageLoader } from '@/components/shared/PageLoader';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/hooks/use-theme';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ModuleHub = lazy(() => import('@/pages/ModuleHub'));

const Programas = lazy(() => import('@/pages/producao/Programas'));
const GravacaoList = lazy(() => import('@/pages/producao/GravacaoList'));
const Conteudo = lazy(() => import('@/pages/producao/Conteudo'));
const Mapas = lazy(() => import('@/pages/producao/Mapas'));
const TiposGravacao = lazy(() => import('@/pages/producao/TiposGravacao'));
const Classificacao = lazy(() => import('@/pages/producao/Classificacao'));
const CategoriasIncidencia = lazy(() => import('@/pages/producao/CategoriasIncidencia'));
const SeveridadesIncidencia = lazy(() => import('@/pages/producao/SeveridadesIncidencia'));
const ImpactosIncidencia = lazy(() => import('@/pages/producao/ImpactosIncidencia'));
const StatusGravacao = lazy(() => import('@/pages/producao/StatusGravacao'));
const Tarefas = lazy(() => import('@/pages/producao/Tarefas'));
const StatusTarefa = lazy(() => import('@/pages/producao/StatusTarefa'));
const TabelasPreco = lazy(() => import('@/pages/producao/TabelasPreco'));
const IncidenciasGravacao = lazy(() => import('@/pages/producao/IncidenciasGravacao'));

const RecursosHumanos = lazy(() => import('@/pages/recursos/RecursosHumanos'));
const RecursosTecnicos = lazy(() => import('@/pages/recursos/RecursosTecnicos'));
const RecursosFisicos = lazy(() => import('@/pages/recursos/RecursosFisicos'));
const Fornecedores = lazy(() => import('@/pages/recursos/Fornecedores'));
const Pessoas = lazy(() => import('@/pages/recursos/Pessoas'));
const Cargos = lazy(() => import('@/pages/recursos/Cargos'));
const Departamentos = lazy(() => import('@/pages/recursos/Departamentos'));
const Funcoes = lazy(() => import('@/pages/recursos/Funcoes'));
const Servicos = lazy(() => import('@/pages/recursos/Servicos'));
const CategoriaFornecedores = lazy(() => import('@/pages/recursos/CategoriaFornecedores'));
const ClassificacaoPessoas = lazy(() => import('@/pages/recursos/ClassificacaoPessoas'));
const Figurinos = lazy(() => import('@/pages/recursos/Figurinos'));
const TipoFigurino = lazy(() => import('@/pages/recursos/TipoFigurino'));
const Material = lazy(() => import('@/pages/recursos/Material'));
const Equipes = lazy(() => import('@/pages/recursos/Equipes'));

const UnidadesNegocio = lazy(() => import('@/pages/admin/UnidadesNegocio'));
const Usuarios = lazy(() => import('@/pages/admin/Usuarios'));
const PerfisAcesso = lazy(() => import('@/pages/admin/PerfisAcesso'));
const CentrosLucro = lazy(() => import('@/pages/admin/CentrosLucro'));
const Formularios = lazy(() => import('@/pages/admin/Formularios'));
const Tenants = lazy(() => import('@/pages/admin/Tenants'));
const GlobalUsers = lazy(() => import('@/pages/admin/GlobalUsers'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const withPageLoader = (element: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={withPageLoader(<Dashboard />)} />
                  <Route path="/module/:moduleName" element={withPageLoader(<ModuleHub />)} />

                  <Route path="/producao/programas" element={withPageLoader(<Programas />)} />
                  <Route path="/producao/conteudo" element={withPageLoader(<Conteudo />)} />
                  <Route path="/producao/gravacao" element={withPageLoader(<GravacaoList />)} />
                  <Route path="/producao/mapas" element={withPageLoader(<Mapas />)} />
                  <Route
                    path="/producao/tipos-gravacao"
                    element={withPageLoader(<TiposGravacao />)}
                  />
                  <Route
                    path="/producao/classificacao"
                    element={withPageLoader(<Classificacao />)}
                  />
                  <Route
                    path="/producao/categorias-incidencia"
                    element={withPageLoader(<CategoriasIncidencia />)}
                  />
                  <Route
                    path="/producao/severidades-incidencia"
                    element={withPageLoader(<SeveridadesIncidencia />)}
                  />
                  <Route
                    path="/producao/impactos-incidencia"
                    element={withPageLoader(<ImpactosIncidencia />)}
                  />
                  <Route path="/producao/status" element={withPageLoader(<StatusGravacao />)} />
                  <Route path="/producao/tarefas" element={withPageLoader(<Tarefas />)} />
                  <Route
                    path="/producao/status-tarefa"
                    element={withPageLoader(<StatusTarefa />)}
                  />
                  <Route
                    path="/producao/tabelas-preco"
                    element={withPageLoader(<TabelasPreco />)}
                  />
                  <Route
                    path="/producao/incidencias"
                    element={withPageLoader(<IncidenciasGravacao />)}
                  />

                  <Route path="/recursos/humanos" element={withPageLoader(<RecursosHumanos />)} />
                  <Route path="/recursos/tecnicos" element={withPageLoader(<RecursosTecnicos />)} />
                  <Route path="/recursos/fisicos" element={withPageLoader(<RecursosFisicos />)} />
                  <Route path="/recursos/fornecedores" element={withPageLoader(<Fornecedores />)} />
                  <Route path="/recursos/pessoas" element={withPageLoader(<Pessoas />)} />
                  <Route path="/recursos/cargos" element={withPageLoader(<Cargos />)} />
                  <Route
                    path="/recursos/departamentos"
                    element={withPageLoader(<Departamentos />)}
                  />
                  <Route path="/recursos/funcoes" element={withPageLoader(<Funcoes />)} />
                  <Route path="/recursos/servicos" element={withPageLoader(<Servicos />)} />
                  <Route
                    path="/recursos/categoria-fornecedores"
                    element={withPageLoader(<CategoriaFornecedores />)}
                  />
                  <Route
                    path="/recursos/classificacao-pessoas"
                    element={withPageLoader(<ClassificacaoPessoas />)}
                  />
                  <Route path="/recursos/figurinos" element={withPageLoader(<Figurinos />)} />
                  <Route
                    path="/recursos/tipo-figurino"
                    element={withPageLoader(<TipoFigurino />)}
                  />
                  <Route path="/recursos/material" element={withPageLoader(<Material />)} />
                  <Route path="/recursos/equipes" element={withPageLoader(<Equipes />)} />

                  <Route path="/admin/unidades" element={withPageLoader(<UnidadesNegocio />)} />
                  <Route path="/admin/usuarios" element={withPageLoader(<Usuarios />)} />
                  <Route path="/admin/perfis" element={withPageLoader(<PerfisAcesso />)} />
                  <Route path="/admin/centros-lucro" element={withPageLoader(<CentrosLucro />)} />
                  <Route path="/admin/formularios" element={withPageLoader(<Formularios />)} />
                  <Route path="/global/tenants" element={withPageLoader(<Tenants />)} />
                  <Route path="/global/usuarios" element={withPageLoader(<GlobalUsers />)} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
