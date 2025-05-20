import { 
  Box, 
  Flex, 
  Input, 
  InputGroup, 
  InputLeftElement,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Icon,
  VStack,
  HStack,
  Spacer,
  IconButton,
  MenuDivider,
  Button,
  Tag,
  TagLeftIcon,
  TagLabel
} from '@chakra-ui/react'
import { MdLogout, MdNotificationsNone, MdSettings, MdPerson, MdCalendarToday, MdFilterList, MdClear } from 'react-icons/md'
import { FiChevronDown } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const formatDate = () => {
  const now = new Date();
  const day = now.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const date = now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${date} - ${time}`;
};

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Determine display name and email based on user type
  const userName = user?.type === 'admin' 
    ? user.nome || 'Admin'
    : user?.type === 'empresa'
      ? user.nomeFantasia || user.razaoSocial
      : 'Usuário';

  const userEmail = user?.type === 'admin'
    ? user.email
    : user?.type === 'empresa'
      ? user.emailCorporativoLogin
      : '';

  const userAvatarName = userName.substring(0,2).toUpperCase();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <VStack 
      as="header"
      align="stretch" 
      py={3} 
      px={6} 
      borderBottomWidth={1} 
      borderColor="gray.200"
      position="fixed"
      top={0}
      left="250px" 
      right={0}
      bg="white" 
      zIndex={1100} 
    >
      <Flex align="center" justify="space-between">
        <VStack align="flex-start" spacing={0}>
          <Text fontSize="xl" fontWeight="semibold" color="gray.700">Visão Geral</Text>
          <Text fontSize="sm" color="gray.500">{formatDate()}</Text>
        </VStack>

        <Spacer />

        <HStack spacing={2} align="center">
          <IconButton
            aria-label="Notifications"
            icon={<Icon as={MdNotificationsNone} boxSize={5} />}
            variant="ghost"
            color="gray.600"
            position="relative"
            size="sm"
          >
            <Box 
              as="span" 
              position="absolute" 
              top="1.5px" 
              right="2.5px" 
              w={1.5} 
              h={1.5} 
              bg="red.500" 
              borderRadius="full" 
            />
          </IconButton>

          <Menu>
            <MenuButton as={Button} variant="ghost" p={0} rounded="full" size="sm" _hover={{bg: 'transparent'}} _active={{bg: 'transparent'}}>
              <HStack spacing={2}>
                 <Avatar size="sm" name={userAvatarName} bg="green.500" color="white" />
                <VStack align="flex-end" spacing={0} display={{ base: 'none', md: 'flex' }}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {userName} {user?.type === 'admin' ? '(Admin)' : ''}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {userEmail}
                  </Text>
                </VStack>
              </HStack>
            </MenuButton>
            <MenuList fontSize="sm">
              <MenuItem icon={<Icon as={MdPerson} boxSize={4}/>}>Minha Conta</MenuItem>
              <MenuItem icon={<Icon as={MdSettings} boxSize={4}/>}>Configurações</MenuItem>
              <MenuDivider />
              <MenuItem icon={<Icon as={MdLogout} boxSize={4}/>} onClick={handleLogout}>Sair</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </VStack>
  )
} 