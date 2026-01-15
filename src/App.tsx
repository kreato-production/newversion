import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/hooks/use-theme";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import GravacaoList from "@/pages/producao/GravacaoList";
import Conteudo from "@/pages/producao/Conteudo";
import TiposGravacao from "@/pages/producao/TiposGravacao";
import Classificacao from "@/pages/producao/Classificacao";
import StatusGravacao from "@/pages/producao/StatusGravacao";
import Tarefas from "@/pages/producao/Tarefas";
import StatusTarefa from "@/pages/producao/StatusTarefa";
import Mapas from "@/pages/producao/Mapas";
import RecursosHumanos from "@/pages/recursos/RecursosHumanos";
import RecursosTecnicos from "@/pages/recursos/RecursosTecnicos";
import RecursosFisicos from "@/pages/recursos/RecursosFisicos";
import Fornecedores from "@/pages/recursos/Fornecedores";
import Pessoas from "@/pages/recursos/Pessoas";
import Cargos from "@/pages/recursos/Cargos";
import Departamentos from "@/pages/recursos/Departamentos";
import Funcoes from "@/pages/recursos/Funcoes";
import Servicos from "@/pages/recursos/Servicos";
import CategoriaFornecedores from "@/pages/recursos/CategoriaFornecedores";
import ClassificacaoPessoas from "@/pages/recursos/ClassificacaoPessoas";
import Figurinos from "@/pages/recursos/Figurinos";
import TipoFigurino from "@/pages/recursos/TipoFigurino";
import Material from "@/pages/recursos/Material";
import UnidadesNegocio from "@/pages/admin/UnidadesNegocio";
import Usuarios from "@/pages/admin/Usuarios";
import PerfisAcesso from "@/pages/admin/PerfisAcesso";
import CentrosLucro from "@/pages/admin/CentrosLucro";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/producao/conteudo" element={<Conteudo />} />
                <Route path="/producao/gravacao" element={<GravacaoList />} />
                <Route path="/producao/mapas" element={<Mapas />} />
                <Route path="/producao/tipos-gravacao" element={<TiposGravacao />} />
                <Route path="/producao/classificacao" element={<Classificacao />} />
                <Route path="/producao/status" element={<StatusGravacao />} />
                <Route path="/producao/tarefas" element={<Tarefas />} />
                <Route path="/producao/status-tarefa" element={<StatusTarefa />} />
                <Route path="/recursos/humanos" element={<RecursosHumanos />} />
                <Route path="/recursos/tecnicos" element={<RecursosTecnicos />} />
                <Route path="/recursos/fisicos" element={<RecursosFisicos />} />
                <Route path="/recursos/fornecedores" element={<Fornecedores />} />
                <Route path="/recursos/pessoas" element={<Pessoas />} />
                <Route path="/recursos/cargos" element={<Cargos />} />
                <Route path="/recursos/departamentos" element={<Departamentos />} />
                <Route path="/recursos/funcoes" element={<Funcoes />} />
                <Route path="/recursos/servicos" element={<Servicos />} />
                <Route path="/recursos/categoria-fornecedores" element={<CategoriaFornecedores />} />
                <Route path="/recursos/classificacao-pessoas" element={<ClassificacaoPessoas />} />
                <Route path="/recursos/figurinos" element={<Figurinos />} />
                <Route path="/recursos/tipo-figurino" element={<TipoFigurino />} />
                <Route path="/recursos/material" element={<Material />} />
                <Route path="/admin/unidades" element={<UnidadesNegocio />} />
                <Route path="/admin/usuarios" element={<Usuarios />} />
                <Route path="/admin/perfis" element={<PerfisAcesso />} />
                <Route path="/admin/centros-lucro" element={<CentrosLucro />} />
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
