import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import NotasFiscais from './pages/NotasFiscais'
import NovaIntegracaoNotasFiscais from './pages/NovaIntegracaoNotasFiscais'
import Empresas from './pages/Empresas'
import CadastroSKUs from './pages/CadastroSKUs'
import Configuracoes from './pages/Configuracoes'
import SistemaSelecao from './pages/SistemaSelecao'
import theme from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { AdminRoute } from './components/AdminRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Rotas de administrador */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/*" element={<AdminPanel />} />
              </Route>
              
              {/* Rotas de empresa (usuários comuns) */}
              <Route element={<PrivateRoute />}>
                <Route path="/selecao-sistema" element={<SistemaSelecao />} />
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/notas-fiscais" element={<NotasFiscais />} />
                  <Route path="/integracao-notas" element={<NovaIntegracaoNotasFiscais />} />
                  <Route path="/empresas" element={<Empresas />} />
                  <Route path="/skus" element={<CadastroSKUs />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

export default App 