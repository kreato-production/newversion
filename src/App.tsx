import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/hooks/use-theme";
import { PageLoader } from "@/components/shared/PageLoader";
import MainLayout from "@/components/layout/MainLayout";

// Eager — usadas imediatamente no boot
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// Lazy — Geral
const Dashboard  = lazy(() => import("@/pages/Dashboard"));
const ModuleHub  = lazy(() => import("@/pages/ModuleHub"));

// Lazy — Produção
const Programas             = lazy(() => import("@/pages/producao/Programas"));
const GravacaoList          = lazy(() => import("@/pages/producao/GravacaoList"));
const Conteudo              = lazy(() => import("@/pages/producao/Conteudo"));
const Mapas                 = lazy(() => import("@/pages/producao/Mapas"));
const TiposGravacao         = lazy(() => import("@/pages/producao/TiposGravacao"));
const Classificacao         = lazy(() => import("@/pages/producao/Classificacao"));
const CategoriasIncidencia  = lazy(() => import("@/pages/producao/CategoriasIncidencia"));
const SeveridadesIncidencia = lazy(() => import("@/pages/producao/SeveridadesIncidencia"));
const ImpactosIncidencia    = lazy(() => import("@/pages/producao/ImpactosIncidencia"));
const StatusGravacao        = lazy(() => import("@/pages/producao/StatusGravacao"));
const Tarefas               = lazy(() => import("@/pages/producao/Tarefas"));
const StatusTarefa          = lazy(() => import("@/pages/producao/StatusTarefa"));
const TabelasPreco          = lazy(() => import("@/pages/producao/TabelasPreco"));
const IncidenciasGravacao   = lazy(() => import("@/pages/producao/IncidenciasGravacao"));

// Lazy — Recursos
const RecursosHumanos       = lazy(() => import("@/pages/recursos/RecursosHumanos"));
const RecursosTecnicos      = lazy(() => import("@/pages/recursos/RecursosTecnicos"));
const RecursosFisicos       = lazy(() => import("@/pages/recursos/RecursosFisicos"));
const Fornecedores          = lazy(() => import("@/pages/recursos/Fornecedores"));
const Pessoas               = lazy(() => import("@/pages/recursos/Pessoas"));
const Cargos                = lazy(() => import("@/pages/recursos/Cargos"));
const Departamentos         = lazy(() => import("@/pages/recursos/Departamentos"));
const Funcoes               = lazy(() => import("@/pages/recursos/Funcoes"));
const Servicos              = lazy(() => import("@/pages/recursos/Servicos"));
const CategoriaFornecedores = lazy(() => import("@/pages/recursos/CategoriaFornecedores"));
const ClassificacaoPessoas  = lazy(() => import("@/pages/recursos/ClassificacaoPessoas"));
const Figurinos             = lazy(() => import("@/pages/recursos/Figurinos"));
const TipoFigurino          = lazy(() => import("@/pages/recursos/TipoFigurino"));
const Material              = lazy(() => import("@/pages/recursos/Material"));
const Equipes               = lazy(() => import("@/pages/recursos/Equipes"));

// Lazy — Administração / Global
const UnidadesNegocio = lazy(() => import("@/pages/admin/UnidadesNegocio"));
const Usuarios        = lazy(() => import("@/pages/admin/Usuarios"));
const PerfisAcesso    = lazy(() => import("@/pages/admin/PerfisAcesso"));
const CentrosLucro    = lazy(() => import("@/pages/admin/CentrosLucro"));
const Formularios     = lazy(() => import("@/pages/admin/Formularios"));
const Tenants         = lazy(() => import("@/pages/admin/Tenants"));
const GlobalUsers     = lazy(() => import("@/pages/admin/GlobalUsers"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
                  <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />

                  {/* Module Hub Pages */}
                  <Route path="/module/:moduleName" element={<Suspense fallback={<PageLoader />}><ModuleHub /></Suspense>} />

                  {/* Produção */}
                  <Suspense fallback={<PageLoader />}>
                    <Route path="/producao/programas"              element={<Programas />} />
                    <Route path="/producao/conteudo"               element={<Conteudo />} />
                    <Route path="/producao/gravacao"               element={<GravacaoList />} />
                    <Route path="/producao/mapas"                  element={<Mapas />} />
                    <Route path="/producao/tipos-gravacao"         element={<TiposGravacao />} />
                    <Route path="/producao/classificacao"          element={<Classificacao />} />
                    <Route path="/producao/categorias-incidencia"  element={<CategoriasIncidencia />} />
                    <Route path="/producao/severidades-incidencia" element={<SeveridadesIncidencia />} />
                    <Route path="/producao/impactos-incidencia"    element={<ImpactosIncidencia />} />
                    <Route path="/producao/status"                 element={<StatusGravacao />} />
                    <Route path="/producao/tarefas"                element={<Tarefas />} />
                    <Route path="/producao/status-tarefa"          element={<StatusTarefa />} />
                    <Route path="/producao/tabelas-preco"          element={<TabelasPreco />} />
                    <Route path="/producao/incidencias"            element={<IncidenciasGravacao />} />
                  </Suspense>

                  {/* Recursos */}
                  <Suspense fallback={<PageLoader />}>
                    <Route path="/recursos/humanos"               element={<RecursosHumanos />} />
                    <Route path="/recursos/tecnicos"              element={<RecursosTecnicos />} />
                    <Route path="/recursos/fisicos"               element={<RecursosFisicos />} />
                    <Route path="/recursos/fornecedores"          element={<Fornecedores />} />
                    <Route path="/recursos/pessoas"               element={<Pessoas />} />
                    <Route path="/recursos/cargos"                element={<Cargos />} />
                    <Route path="/recursos/departamentos"         element={<Departamentos />} />
                    <Route path="/recursos/funcoes"               element={<Funcoes />} />
                    <Route path="/recursos/servicos"              element={<Servicos />} />
                    <Route path="/recursos/categoria-fornecedores" element={<CategoriaFornecedores />} />
                    <Route path="/recursos/classificacao-pessoas" element={<ClassificacaoPessoas />} />
                    <Route path="/recursos/figurinos"             element={<Figurinos />} />
                    <Route path="/recursos/tipo-figurino"         element={<TipoFigurino />} />
                    <Route path="/recursos/material"              element={<Material />} />
                    <Route path="/recursos/equipes"               element={<Equipes />} />
                  </Suspense>

                  {/* Administração / Global */}
                  <Suspense fallback={<PageLoader />}>
                    <Route path="/admin/unidades"      element={<UnidadesNegocio />} />
                    <Route path="/admin/usuarios"      element={<Usuarios />} />
                    <Route path="/admin/perfis"        element={<PerfisAcesso />} />
                    <Route path="/admin/centros-lucro" element={<CentrosLucro />} />
                    <Route path="/admin/formularios"   element={<Formularios />} />
                    <Route path="/global/tenants"      element={<Tenants />} />
                    <Route path="/global/usuarios"     element={<GlobalUsers />} />
                  </Suspense>
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
