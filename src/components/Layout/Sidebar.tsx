import { Box, VStack, Icon, Text, Link, Flex, Spacer } from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  FiGrid,
  FiFileText,
  FiArchive,
  FiSettings,
  FiShield,
  FiLogOut,
  FiChevronRight
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../Logo'

// Definindo os itens de navegação comuns (para todos os usuários)
const COMMON_NAV_ITEMS = [
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiFileText, label: 'Integração NF', path: '/integracao-notas' },
  { icon: FiArchive, label: 'Cadastro de SKUs', path: '/skus' },
  { icon: FiSettings, label: 'Configurações', path: '/configuracoes' },
]

// Item de navegação apenas para administradores
const ADMIN_NAV_ITEM = { icon: FiShield, label: 'Administração', path: '/admin' }

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  
  // Determinar o nome a ser exibido com base no tipo de usuário
  const userDisplayName = user?.type === 'admin' 
    ? user.nome || 'Admin' 
    : user?.type === 'empresa'
      ? user.nomeFantasia || user.razaoSocial
      : 'Usuário'
  
  // Determinar os itens de navegação com base no tipo de usuário
  const navItems = [...COMMON_NAV_ITEMS]
  if (user?.type === 'admin') {
    navItems.push(ADMIN_NAV_ITEM)
  }

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <Box
      w="250px"
      bg="gray.900"
      color="gray.100"
      py={6}
      h="100vh"
      position="fixed"
      top={0}
      left={0}
      zIndex="sticky"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={1} mb={10} px={6} align="center">
        <Logo size="sm" color="white" />
        <Text fontSize="xs" color="gray.400">{getGreeting()}</Text>
        <Text fontSize="sm" color="gray.200" fontWeight="medium">{userDisplayName}</Text>
      </VStack>

      <VStack spacing={1} align="stretch" px={4}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              as={RouterLink}
              to={item.path}
              role="group"
              display="block"
              _hover={{ 
                textDecoration: 'none', 
                bg: 'gray.700',
                color: 'white',
                borderRadius: 'md' 
              }}
              bg={isActive ? 'blue.500' : 'transparent'}
              color={isActive ? 'white' : 'gray.100'}
              p={3}
              borderRadius="md"
              overflow="hidden"
            >
              <Flex
                align="center"
                transition="transform 0.2s ease-in-out"
                _groupHover={{ transform: 'translateX(3px)' }}
              >
                <Icon as={item.icon} boxSize={4.5} mr={3} />
                <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'normal'} flexGrow={1}>{item.label}</Text>
                <Icon as={FiChevronRight} boxSize={4} opacity={0.6} />
              </Flex>
            </Link>
          )
        })}
      </VStack>

      <Spacer />

      <Box px={4} mb={3}>
        <Link
          role="group"
          display="block"
          _hover={{ 
            textDecoration: 'none', 
            bg: 'gray.700', 
            color: 'white',
            borderRadius: 'md'
          }}
          p={3}
          borderRadius="md"
          overflow="hidden"
          onClick={handleLogout}
          cursor="pointer"
        >
          <Flex
            align="center"
            transition="transform 0.2s ease-in-out"
            _groupHover={{ transform: 'translateX(3px)' }}
          >
            <Icon as={FiLogOut} boxSize={4.5} mr={3} />
            <Text fontSize="sm" flexGrow={1}>Logout</Text>
            <Icon as={FiChevronRight} boxSize={4} opacity={0.6} />
          </Flex>
        </Link>
      </Box>
    </Box>
  )
} 