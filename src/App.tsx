/*
 * App.tsx — rotas da plataforma Volta Express.
 * Páginas carregadas sob demanda (menor bundle inicial) e animações que respeitam "reduzir movimento" (DS5/DS6).
 */
import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
const Index = lazy(() => import("./pages/Index")); /*import Index from "./pages/Index";*/

const Buscar = lazy(() => import("./pages/Buscar"));
const CriarAnuncio = lazy(() => import("./pages/CriarAnuncio"));
const Matching = lazy(() => import("./pages/Matching"));
const Painel = lazy(() => import("./pages/Painel"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

/* Indicador exibido enquanto a página é carregada. */
const Carregando = () => (
  <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Carregando">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
  </div>
);

/* Aplicação com provedores, rotas públicas e rotas protegidas. */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<Carregando />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/buscar" element={<ProtectedRoute><Buscar /></ProtectedRoute>} />
                <Route path="/criar-anuncio" element={<ProtectedRoute><CriarAnuncio /></ProtectedRoute>} />
                <Route path="/matching" element={<ProtectedRoute><Matching /></ProtectedRoute>} />
                <Route path="/painel" element={<ProtectedRoute><Painel /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/termos" element={<Termos />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </MotionConfig>
  </QueryClientProvider>
);

export default App;

/* Fim de App.tsx */
