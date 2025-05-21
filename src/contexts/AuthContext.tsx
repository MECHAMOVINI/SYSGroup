import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Atualizando para usar nosso servidor atual
const API_URL = '/api'

interface UserAdmin {
  id: string
  email: string
  nome?: string | null
  // Adicione outros campos específicos do admin se necessário
}

interface UserEmpresa {
  id: string
  emailCorporativoLogin: string
  razaoSocial: string
  nomeFantasia?: string | null
  tokenAcesso?: string // Adicionando o token de acesso para a empresa
  // Adicione outros campos específicos da empresa se necessário
}

// Um tipo unificado para o usuário, pode ser expandido
type User = (UserAdmin & { type: 'admin' }) | (UserEmpresa & { type: 'empresa' })

export interface AuthContextData {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  signInAdmin: (email: string, senhaPlainText: string) => Promise<void>
  signInEmpresa: (emailCorporativoLogin: string, tokenAcesso: string) => Promise<void>
  signOut: () => void
  isLoading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Efeito para carregar dados do localStorage na inicialização
  useEffect(() => {
    const storedToken = localStorage.getItem('@NFSys:token')
    const storedUser = localStorage.getItem('@NFSys:user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      // Configurar o header Authorization do axios para futuras requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setIsLoading(false)
  }, [])

  const handleSuccessfulLogin = useCallback((responseData: { token: string; user?: any; empresa?: any }, userType: 'admin' | 'empresa') => {
    const receivedToken = responseData.token
    let userDataToStore: User

    if (userType === 'admin' && responseData.user) {
      userDataToStore = { ...responseData.user, type: 'admin' }
      // Salvar ID do usuário admin no localStorage para uso na página de configurações
      localStorage.setItem('userId', responseData.user.id)
      localStorage.setItem('nomeUsuario', responseData.user.nome || 'Administrador')
      localStorage.setItem('emailUsuario', responseData.user.email)
    } else if (userType === 'empresa' && responseData.empresa) {
      // Ajustar para corresponder à estrutura de UserEmpresa
      const { emailCorporativoLogin, tokenAcesso, ...empresaRest } = responseData.empresa
      userDataToStore = { 
        ...empresaRest, 
        emailCorporativoLogin, 
        tokenAcesso, // Armazenar o token de acesso para uso posterior
        type: 'empresa' 
      }
      
      // Salvar ID e nome da empresa no localStorage para uso na página de configurações
      localStorage.setItem('userId', responseData.empresa.id)
      localStorage.setItem('nomeUsuario', responseData.empresa.nomeFantasia || responseData.empresa.razaoSocial)
      localStorage.setItem('emailUsuario', responseData.empresa.emailCorporativoLogin)
    } else {
      throw new Error('Dados do usuário/empresa não encontrados na resposta do login.')
    }

    localStorage.setItem('@NFSys:token', receivedToken)
    localStorage.setItem('@NFSys:user', JSON.stringify(userDataToStore))
    axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`
    
    setToken(receivedToken)
    setUser(userDataToStore)
  }, [])

  const signInAdmin = useCallback(async (email: string, senhaPlainText: string) => {
    setIsLoading(true)
    try {
      console.log('Tentando login admin:', { email })
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        senha: senhaPlainText // O backend espera 'senha'
      })
      
      console.log('Resposta do servidor:', response.data)
      
      // Adicionar verificação de segurança para o formato da resposta
      if (!response.data || !response.data.token) {
        throw new Error('Resposta do servidor inválida: token não encontrado')
      }
      
      handleSuccessfulLogin(response.data, 'admin')
      navigate('/admin') // Redirecionar para /admin após login bem-sucedido
    } catch (error) {
      console.error('Erro no login do admin:', error)
      
      // Log detalhado para depuração
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro Axios:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: error.config
        })
      }
      
      // Lançar o erro para que a página de login possa tratá-lo (ex: mostrar toast)
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao fazer login do admin.')
      } else {
        throw new Error('Ocorreu um erro desconhecido durante o login do admin.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleSuccessfulLogin, navigate])

  const signInEmpresa = useCallback(async (emailCorporativoLogin: string, tokenAcesso: string) => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email: emailCorporativoLogin, 
        senha: tokenAcesso 
      })
      handleSuccessfulLogin(response.data, 'empresa')
      navigate('/selecao-sistema') // Redirecionar para /selecao-sistema após login de empresa
    } catch (error) {
      console.error('Erro no login da empresa:', error)
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao fazer login da empresa.')
      } else {
        throw new Error('Ocorreu um erro desconhecido durante o login da empresa.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleSuccessfulLogin, navigate])

  const signOut = useCallback(() => {
    localStorage.removeItem('@NFSys:token')
    localStorage.removeItem('@NFSys:user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setToken(null)
    navigate('/login') // Redireciona para a página de login de empresa por padrão
  }, [navigate])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user, // Derivado da presença do usuário
      signInAdmin,
      signInEmpresa,
      signOut,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
} 