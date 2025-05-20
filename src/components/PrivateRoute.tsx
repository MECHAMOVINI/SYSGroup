import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function PrivateRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    // Aguardar carregamento da autenticação
    return null;
  }

  if (!isAuthenticated) {
    // Não está autenticado, redirecionar para login
    return <Navigate to="/login" replace />
  }

  // Verificar se é uma empresa tentando acessar rotas de admin
  if (user?.type === 'empresa' && location.pathname.includes('/admin')) {
    // Empresas não podem acessar rotas admin
    return <Navigate to="/selecao-sistema" replace />
  }

  // Verificar se é um usuário administrador tentando acessar rotas de empresa
  // Removemos o redirecionamento forçado, pois pode estar causando problemas
  // Os administradores também podem visualizar as rotas comuns se necessário
  
  return <Outlet />
} 