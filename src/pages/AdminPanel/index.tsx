import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spacer,
  Text,
  VStack,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogContent,
  ButtonGroup,
  Divider,
} from '@chakra-ui/react'
import {
  MdSearch,
  MdNotificationsNone,
  MdExitToApp,
  MdDashboard,
  MdBusiness,
  MdSettings,
  MdAddCircleOutline,
  MdArrowBack,
  MdVisibility,
  MdAdd,
  MdBarChart,
  MdLogout,
  MdContentCopy,
  MdClose,
  MdRefresh,
  MdVisibilityOff,
} from 'react-icons/md'
import { FiGrid } from 'react-icons/fi'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

// Atualizando a URL da API para a porta 3002
const API_URL = 'http://localhost:3002/api';

// Helper function to format CNPJ for display - MOVED HERE
const formatCnpjForDisplay = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/);
  if (!match) return cleaned;
  const [, p1, p2, p3, p4, p5] = match;
  let formatted = '';
  if (p1) formatted += p1;
  if (p2) formatted += `.${p2}`;
  if (p3) formatted += `.${p3}`;
  if (p4) formatted += `/${p4}`;
  if (p5) formatted += `-${p5}`;
  return formatted;
};

// Tipo para os dados da empresa (reutilizável) - Matches backend Empresa model
export interface EmpresaData {
  id: string;
  razaoSocial: string;
  cnpj: string;
  emailCorporativoLogin: string;
  nomeFantasia?: string | null;
  limiteAcessosSimultaneos: number;
  tokenAcesso: string;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// Interface para dados de sessão ativa - Keep for now
interface SessaoAtivaData {
  id: string;
  empresaNome: string;
  usuario: string;
  token: string;
  tempoOnline: string;
  inicioSessao: Date;
}

// Dados mockados para a tabela de monitoramento (reintroduzido) - Keep for now
const mockSessoesAtivas: SessaoAtivaData[] = [
  { id: 'sessao1', empresaNome: 'Avesani e Correa Ltda', usuario: 'Usuário A', token: 'TOKEN_AVESANI_123', tempoOnline: '2h 15m', inicioSessao: new Date(Date.now() - (2 * 60 + 15) * 60000) },
  { id: 'sessao2', empresaNome: 'test test limitados', usuario: 'Usuário B', token: 'TOKEN_TEST_456', tempoOnline: '0h 45m', inicioSessao: new Date(Date.now() - 45 * 60000) },
  { id: 'sessao3', empresaNome: 'Avesani e Correa Ltda', usuario: 'Usuário C', token: 'TOKEN_AVESANI_789', tempoOnline: '5h 02m', inicioSessao: new Date(Date.now() - (5 * 60 + 2) * 60000) },
];

// Componente para o Drawer de Cadastro de Empresa
const CadastroEmpresaDrawer = ({ isOpen, onClose, onEmpresaCreated }: { isOpen: boolean; onClose: () => void; onEmpresaCreated: () => void; }) => {
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [emailCorporativoLogin, setEmailCorporativoLogin] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [limiteAcessosSimultaneos, setLimiteAcessosSimultaneos] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 14) {
      setCnpj(rawValue);
    }
  };

  const clearForm = () => {
    setRazaoSocial('');
    setCnpj('');
    setEmailCorporativoLogin('');
    setNomeFantasia('');
    setLimiteAcessosSimultaneos('1');
  }

  const handleSave = async () => {
    if (!razaoSocial || !cnpj || !emailCorporativoLogin) {
        toast({
            title: "Campos obrigatórios",
            description: "Razão Social, CNPJ e E-mail Corporativo são obrigatórios.",
            status: "warning",
            duration: 5000,
            isClosable: true,
        });
        return;
    }
    // Basic CNPJ validation (length)
    if (cnpj.length !== 14) {
        toast({
            title: "CNPJ inválido",
            description: "O CNPJ deve conter 14 dígitos.",
            status: "warning",
            duration: 5000,
            isClosable: true,
        });
        return;
    }

    setIsSaving(true);
    try {
      const payload = {
        razaoSocial,
        cnpj,
        emailCorporativoLogin,
        nomeFantasia: nomeFantasia || undefined, // Send undefined if empty, so TypeORM default can be used
        limiteAcessosSimultaneos: parseInt(limiteAcessosSimultaneos, 10),
      };
      await axios.post(`${API_URL}/empresas`, payload);
      toast({
        title: 'Empresa Criada!',
        description: `A empresa ${razaoSocial} foi cadastrada com sucesso.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onEmpresaCreated();
      onClose();
      clearForm();
    } catch (error: any) {
      let errorMessage = 'Não foi possível cadastrar a empresa.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast({
        title: 'Erro ao Cadastrar Empresa',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      console.error("Erro ao salvar empresa:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={() => { onClose(); clearForm(); }} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">Cadastrar Nova Empresa</DrawerHeader>
        <DrawerBody>
          <Text fontSize="sm" mb={6}>Adicione uma nova empresa ao sistema. Um token de acesso será gerado automaticamente.</Text>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Razão Social</FormLabel>
              <Input
                placeholder="Digite a razão social"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                focusBorderColor="blue.500"
                borderRadius="md"
                _focus={{ boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Nome Fantasia (Opcional)</FormLabel>
              <Input
                placeholder="Digite o nome fantasia"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">CNPJ</FormLabel>
              <Input
                placeholder="00.000.000/0000-00"
                value={formatCnpjForDisplay(cnpj)}
                onChange={handleCnpjChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">E-mail Corporativo (para login da empresa)</FormLabel>
              <Input
                type="email"
                placeholder="contato@empresa.com.br"
                value={emailCorporativoLogin}
                onChange={(e) => setEmailCorporativoLogin(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Limite de Acessos Simultâneos</FormLabel>
              <NumberInput
                min={1}
                value={limiteAcessosSimultaneos}
                onChange={(valueString) => setLimiteAcessosSimultaneos(valueString)}
              >
                <NumberInputField placeholder="1" />
              </NumberInput>
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button 
            variant="outline" 
            mr={3} 
            onClick={() => { onClose(); clearForm(); }} 
            size="sm" 
            disabled={isSaving}
            borderRadius="md"
            transition="all 0.2s"
            _hover={{ bg: "gray.50" }}
          >
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSave} 
            size="sm" 
            isLoading={isSaving} 
            loadingText="Salvando..."
            borderRadius="md"
            transition="all 0.2s"
            _hover={{ transform: "translateY(-1px)" }}
          >
            Salvar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// Componente para o Drawer de Gerenciamento de Tokens - Placeholder, to be developed
const ManageTokensDrawer = ({ isOpen, onClose, empresa }: { isOpen: boolean; onClose: () => void; empresa: EmpresaData | null }) => {
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tokens, setTokens] = useState<Array<{id: string, valor: string, status: 'Ativo' | 'Inativo'}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);
  const toast = useToast();

  // Função para buscar os tokens da empresa
  const fetchTokens = useCallback(async () => {
    if (!empresa) return;

    setIsLoading(true);
    try {
      // Simulação - Em uma implementação real, isso seria uma chamada API
      // const response = await axios.get(`${API_URL}/empresas/${empresa.id}/tokens`);
      // setTokens(response.data);
      
      // Por enquanto, usamos apenas o token principal
      setTokens([
        { 
          id: 'main-token', 
          valor: empresa.tokenAcesso, 
          status: 'Ativo' 
        }
      ]);
    } catch (error) {
      console.error("Erro ao buscar tokens:", error);
      toast({
        title: "Erro ao carregar tokens",
        description: "Não foi possível obter os tokens desta empresa.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [empresa, toast]);

  // Carregar os tokens quando o drawer abrir
  useEffect(() => {
    if (isOpen && empresa) {
      fetchTokens();
    }
  }, [isOpen, empresa, fetchTokens]);

  // Função para criar um novo token
  const handleNovoToken = async () => {
    if (!empresa) return;

    setIsCreatingToken(true);
    try {
      // Em uma implementação real, isso seria uma chamada à API
      // const response = await axios.post(`${API_URL}/empresas/${empresa.id}/tokens`);
      // const novoToken = response.data;
      
      // Simulação de resposta do servidor
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A criação de tokens adicionais será implementada em breve.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      
      // fetchTokens(); // Recarregar os tokens após a criação
    } catch (error) {
      console.error("Erro ao criar novo token:", error);
      toast({
        title: "Erro ao criar token",
        description: "Não foi possível criar um novo token.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleCopyToken = (tokenValor: string) => {
    navigator.clipboard.writeText(tokenValor)
      .then(() => {
        toast({
          title: "Token copiado",
          description: "O token foi copiado para a área de transferência.",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom-right"
        });
      })
      .catch(err => {
        console.error('Erro ao copiar token:', err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o token.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  // Função para revogar/excluir um token
  const handleDeleteToken = async (tokenId: string) => {
    if (!empresa || tokenId === 'main-token') {
      toast({
        title: "Operação não permitida",
        description: "O token principal não pode ser excluído. Para regenerá-lo, acesse as configurações da empresa.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Em uma implementação real, isso seria uma chamada à API
      // await axios.delete(`${API_URL}/empresas/${empresa.id}/tokens/${tokenId}`);
      
      // Simulação
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A revogação de tokens será implementada em breve.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      
      // fetchTokens(); // Recarregar os tokens após a exclusão
    } catch (error) {
      console.error("Erro ao excluir token:", error);
      toast({
        title: "Erro ao excluir token",
        description: "Não foi possível excluir o token.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para regenerar o token principal
  const handleRegenerateMainToken = async () => {
    if (!empresa) return;

    try {
      // Em uma implementação real, isso seria uma chamada à API
      // await axios.post(`${API_URL}/empresas/${empresa.id}/regenerate-token`);
      
      // Simulação
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A regeneração de token será implementada em breve.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      
      // fetchTokens(); // Recarregar os tokens após a regeneração
    } catch (error) {
      console.error("Erro ao regenerar token:", error);
      toast({
        title: "Erro ao regenerar token",
        description: "Não foi possível regenerar o token principal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };



  if (!empresa) return null;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          Gerenciamento de Tokens
          <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
            {empresa.razaoSocial}
          </Text>
        </DrawerHeader>
        <DrawerBody>
          {isLoading ? (
            <Flex justify="center" align="center" minH="200px">
              <Spinner />
            </Flex>
          ) : (
            <>
              <Box mb={6}>
                <Heading size="sm" mb={2}>Token de Acesso Principal</Heading>
                <Box 
                  p={3} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  bg="gray.50" 
                  fontFamily="mono" 
                  fontSize="sm"
                  position="relative"
                  boxShadow="sm"
                  transition="all 0.2s"
                  _hover={{ boxShadow: "md", borderColor: "blue.200" }}
                >
                  <Flex alignItems="center" mb={2}>
                    <Text flex="1" isTruncated={!showFullToken}>
                      {showFullToken ? empresa.tokenAcesso : `${empresa.tokenAcesso.substring(0, 15)}...`}
                    </Text>
                    <ButtonGroup size="sm" isAttached variant="outline">
                      <IconButton 
                        aria-label="Copiar token" 
                        icon={<Icon as={MdContentCopy} />} 
                        onClick={() => handleCopyToken(empresa.tokenAcesso)}
                        borderRadius="md"
                        transition="all 0.2s"
                        _hover={{ bg: "blue.50" }}
                      />
                      <IconButton 
                        aria-label="Mostrar/Ocultar token completo" 
                        icon={<Icon as={showFullToken ? MdVisibilityOff : MdVisibility} />}
                        onClick={() => setShowFullToken(!showFullToken)}
                        borderRadius="md"
                        transition="all 0.2s"
                        _hover={{ bg: "blue.50" }}
                      />
                      <IconButton 
                        aria-label="Regenerar token" 
                        icon={<Icon as={MdRefresh} />}
                        onClick={handleRegenerateMainToken}
                        title="Regenerar token (cuidado: invalida o token atual)"
                        borderRadius="md"
                        transition="all 0.2s"
                        _hover={{ bg: "red.50", color: "red.500" }}
                      />
                    </ButtonGroup>
                  </Flex>

                </Box>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Este é o token principal que a empresa utiliza para acessar o sistema.
                </Text>
                <Alert status="warning" size="sm" mt={3} borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Regenerar o token invalidará imediatamente o token atual, desconectando todos os usuários.
                  </Text>
                </Alert>
              </Box>

              <Divider my={4} />

              <Flex justify="space-between" align="center" mb={3}>
                <Heading size="sm">Tokens Adicionais</Heading>
                <Button
                  leftIcon={<Icon as={MdAdd} />}
                  colorScheme="blue"
                  size="sm"
                  onClick={handleNovoToken}
                  isLoading={isCreatingToken}
                  borderRadius="md"
                  transition="all 0.2s"
                  _hover={{ transform: "translateY(-1px)" }}
                >
              Novo Token
            </Button>
          </Flex>

              <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                <Table size="sm" variant="simple">
              <Thead bg="gray.50">
                <Tr>
                      <Th>Token</Th>
                      <Th textAlign="center">Status</Th>
                      <Th textAlign="right">Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                    {tokens.length > 1 ? (
                      tokens.slice(1).map(token => (
                        <Tr key={token.id}>
                          <Td fontFamily="mono" fontSize="xs" maxW="200px" isTruncated>
                            {token.valor}
                          </Td>
                          <Td textAlign="center">
                            <Badge colorScheme={token.status === 'Ativo' ? 'green' : 'red'}>
                        {token.status}
                      </Badge>
                    </Td>
                          <Td textAlign="right">
                            <ButtonGroup size="xs" isAttached>
                        <IconButton
                          aria-label="Copiar token"
                                icon={<Icon as={MdContentCopy} />}
                          variant="ghost"
                          onClick={() => handleCopyToken(token.valor)}
                        />
                          <IconButton
                            aria-label="Excluir token"
                                icon={<Icon as={MdClose} color="red.500" />}
                            variant="ghost"
                            onClick={() => handleDeleteToken(token.id)}
                                isLoading={isDeleting}
                          />
                            </ButtonGroup>
                    </Td>
                  </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={3} textAlign="center" py={4}>
                          <Text fontSize="sm">Nenhum token adicional criado.</Text>
                          <Text fontSize="xs" color="gray.500">
                            Tokens adicionais permitem controlar acessos com permissões diferentes ou revogar acessos individuais.
                          </Text>
                        </Td>
                      </Tr>
                )}
              </Tbody>
            </Table>
              </Box>
            </>
          )}
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose} size="sm">
            Fechar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// View para Gerenciamento de Empresas
const ManageEmpresasView = ({ 
    onBack, 
    onOpenCadastro, 
    onViewTokens
}: {
  onBack: () => void;
  onOpenCadastro: () => void;
  onViewTokens: (empresa: EmpresaData) => void;
}) => {
  const toast = useToast();
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [empresaParaDeletar, setEmpresaParaDeletar] = useState<{id: string, nome: string} | null>(null);
  const { isOpen: isDeleteConfirmOpen, onOpen: onOpenDeleteConfirm, onClose: onCloseDeleteConfirm } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Função para carregar as empresas do backend
  const fetchEmpresas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/empresas`);
      setEmpresas(response.data);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      setError("Não foi possível carregar a lista de empresas. Tente novamente mais tarde.");
    toast({
        title: "Erro ao carregar empresas",
        description: "Ocorreu um problema ao buscar os dados das empresas.",
        status: "error",
        duration: 5000,
      isClosable: true,
    });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar as empresas quando o componente montar
  useEffect(() => {
    fetchEmpresas();
  }, []);

  // Função para filtrar as empresas por texto
  const empresasFiltradas = useMemo(() => {
    if (!filtroTexto) return empresas;
    const termoLowerCase = filtroTexto.toLowerCase();
    return empresas.filter(
      (empresa: EmpresaData) => 
        empresa.razaoSocial.toLowerCase().includes(termoLowerCase) || 
        empresa.nomeFantasia?.toLowerCase().includes(termoLowerCase) ||
        empresa.cnpj.includes(termoLowerCase) ||
        empresa.emailCorporativoLogin.toLowerCase().includes(termoLowerCase)
    );
  }, [empresas, filtroTexto]);

  // Função para lidar com a edição de uma empresa
  const handleEditEmpresa = (empresaId: string) => {
    toast({
      title: 'Função em desenvolvimento',
      description: `A edição da empresa será implementada em breve.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Função para confirmar a exclusão de uma empresa
  const handleConfirmDelete = (empresa: EmpresaData) => {
    setEmpresaParaDeletar({id: empresa.id, nome: empresa.razaoSocial});
    onOpenDeleteConfirm();
  };

  // Função para executar a exclusão da empresa
  const executeDeleteEmpresa = async () => {
    if (!empresaParaDeletar) return;
    
    try {
      await axios.delete(`${API_URL}/empresas/${empresaParaDeletar.id}`);
      toast({
        title: 'Empresa excluída',
        description: `A empresa ${empresaParaDeletar.nome} foi excluída com sucesso.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Atualizar a lista de empresas após a exclusão
      fetchEmpresas();
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
      toast({
        title: 'Erro ao excluir empresa',
        description: `Não foi possível excluir a empresa. Tente novamente.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEmpresaParaDeletar(null);
      onCloseDeleteConfirm();
    }
  };

  return (
    <Box>
      <Flex mb={6} alignItems="center">
        <Heading size="lg">Gerenciar Empresas</Heading>
        <Spacer />
        <Button
          leftIcon={<MdAdd />}
          colorScheme="blue"
          onClick={onOpenCadastro}
          size="sm"
          borderRadius="md"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)" }}
        >
          Nova Empresa
        </Button>
      </Flex>

      {/* Área de Busca e Filtragem */}
      <Flex mb={4} gap={4}>
        <InputGroup maxW="500px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Buscar empresas por nome, CNPJ ou e-mail..." 
            value={filtroTexto}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFiltroTexto(e.target.value)}
            borderRadius="md"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
          />
        </InputGroup>
        <Button 
          leftIcon={<Icon as={MdRefresh} />} 
          onClick={fetchEmpresas} 
          isLoading={isLoading}
          size="sm"
          borderRadius="md"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)" }}
        >
          Atualizar
      </Button>
      </Flex>

      {/* Tabela de Empresas */}
      {error ? (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <TableContainer 
          borderWidth="1px" 
          borderColor="gray.200" 
          borderRadius="md"
          boxShadow="sm"
          transition="all 0.3s"
          _hover={{ boxShadow: "md" }}
        >
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Empresa</Th>
                <Th>CNPJ</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Acessos</Th>
                <Th textAlign="right">Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8}>
                    <Spinner size="md" mr={2} />
                    <Text display="inline">Carregando empresas...</Text>
                  </Td>
                </Tr>
              ) : empresasFiltradas.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8}>
                    {filtroTexto ? "Nenhuma empresa encontrada com os critérios de busca." : "Nenhuma empresa cadastrada."}
                  </Td>
                </Tr>
              ) : (
                empresasFiltradas.map((empresa: EmpresaData) => (
                  <Tr key={empresa.id} _hover={{ bg: "gray.50" }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{empresa.razaoSocial}</Text>
                        {empresa.nomeFantasia && (
                          <Text fontSize="sm" color="gray.600">{empresa.nomeFantasia}</Text>
                        )}
                      </VStack>
                    </Td>
                    <Td fontFamily="mono" fontSize="sm">
                      {formatCnpjForDisplay(empresa.cnpj)}
                    </Td>
                    <Td fontSize="sm">{empresa.emailCorporativoLogin}</Td>
                    <Td>
                      <Badge colorScheme={empresa.ativa ? "green" : "red"}>
                        {empresa.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </Td>
                    <Td>{empresa.limiteAcessosSimultaneos}</Td>
                    <Td textAlign="right">
                      <HStack spacing={1} justify="flex-end">
                        <IconButton
                          aria-label="Ver tokens"
                          icon={<Icon as={MdVisibility} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewTokens(empresa)}
                          title="Ver tokens"
                          borderRadius="md"
                          color="blue.500"
                          _hover={{ bg: "blue.50" }}
                        />
                        <IconButton
                          aria-label="Editar empresa"
                          icon={<Icon as={MdSettings} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditEmpresa(empresa.id)}
                          title="Editar empresa"
                          borderRadius="md"
                          color="green.500"
                          _hover={{ bg: "green.50" }}
                        />
                        <IconButton
                          aria-label="Excluir empresa"
                          icon={<Icon as={MdClose} color="red.500" />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleConfirmDelete(empresa)}
                          title="Excluir empresa"
                          borderRadius="md"
                          _hover={{ bg: "red.50" }}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* Modal de confirmação de exclusão */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteConfirm}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Empresa
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir a empresa "{empresaParaDeletar?.nome}"? 
              Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={onCloseDeleteConfirm}
                size="sm"
                borderRadius="md"
              >
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={executeDeleteEmpresa} 
                ml={3}
                size="sm"
                borderRadius="md"
                leftIcon={<Icon as={MdClose} />}
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

const MonitoringView = ({ onBack }: { onBack: () => void }) => {
  // Placeholder for logoff/notify functions
  const handleForceLogoff = (sessionId: string) => {
    console.log(`Forçar logoff da sessão ${sessionId}`);
    // Implement API call here
  };

  const handleSendNotification = (sessionId: string) => {
    console.log(`Enviar notificação para sessão ${sessionId}`);
    // Implement API call here
  };
  return (
    <Box>
      <Flex mb={6} alignItems="center">
        <IconButton icon={<MdArrowBack />} aria-label="Voltar" onClick={onBack} mr={4} variant="ghost" />
        <Heading size="lg">Monitoramento de Acessos</Heading>
      </Flex>
      <Text mb={4}>Acompanhe as sessões ativas das empresas em tempo real.</Text>
      <TableContainer 
        borderWidth="1px" 
        borderColor="gray.200" 
        borderRadius="md"
        boxShadow="sm"
        transition="all 0.3s"
        _hover={{ boxShadow: "md" }}
      >
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Empresa</Th>
              <Th>Usuário</Th>
              <Th>Token Utilizado</Th>
              <Th>Tempo Online</Th>
              <Th>Início da Sessão</Th>
              <Th textAlign="right">Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {mockSessoesAtivas.map((sessao) => (
              <Tr key={sessao.id} _hover={{ bg: "gray.50" }}>
                <Td>{sessao.empresaNome}</Td>
                <Td>{sessao.usuario}</Td>
                <Td fontFamily="monospace" fontSize="xs">{sessao.token}</Td>
                <Td>{sessao.tempoOnline}</Td>
                <Td>{sessao.inicioSessao.toLocaleString('pt-BR')}</Td>
                <Td textAlign="right">
                  <HStack spacing={2}>
                    <Button 
                      size="xs" 
                      colorScheme="orange" 
                      onClick={() => handleForceLogoff(sessao.id)}
                      leftIcon={<Icon as={MdLogout} />}
                      borderRadius="md"
                      transition="all 0.2s"
                      _hover={{ transform: "translateY(-1px)" }}
                    >
                      Forçar Logoff
                    </Button>
                    <Button 
                      size="xs" 
                      colorScheme="teal" 
                      onClick={() => handleSendNotification(sessao.id)}
                      leftIcon={<Icon as={MdNotificationsNone} />}
                      borderRadius="md"
                      transition="all 0.2s"
                      _hover={{ transform: "translateY(-1px)" }}
                    >
                      Notificar
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
            {mockSessoesAtivas.length === 0 && (
              <Tr><Td colSpan={6} textAlign="center">Nenhuma sessão ativa no momento.</Td></Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const ManagePlanosView = ({ onBack }: { onBack: () => void }) => {
  // Mock data for plans - replace with API data later
  const mockPlanos = [
    { id: 'plano1', nome: 'Básico', precoMensal: 99.90, limiteNotas: 1000, limiteEmpresas: 1, features: ['Suporte Básico', 'Acesso API'] },
    { id: 'plano2', nome: 'Profissional', precoMensal: 199.90, limiteNotas: 5000, limiteEmpresas: 5, features: ['Suporte Prioritário', 'Acesso API', 'Relatórios Avançados'] },
    { id: 'plano3', nome: 'Enterprise', precoMensal: 399.90, limiteNotas: -1, limiteEmpresas: -1, features: ['Suporte Dedicado', 'Acesso API Completo', 'Customizações'] }, // -1 for unlimited
  ];

  return (
    <Box>
      <Flex mb={6} alignItems="center">
        <Heading size="lg">Gerenciar Planos e Assinaturas</Heading>
        <Spacer />
        <Button 
          leftIcon={<Icon as={MdAddCircleOutline} />} 
          colorScheme="teal"
          size="sm"
          borderRadius="md"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)" }}
        >
          Novo Plano
        </Button>
      </Flex>
      <Text mb={4}>Configure os planos disponíveis e gerencie as assinaturas das empresas.</Text>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {mockPlanos.map((plano) => (
          <Card 
            key={plano.id} 
            borderWidth="1px" 
            borderColor="gray.200" 
            boxShadow="sm"
            transition="all 0.3s ease"
            _hover={{ 
              transform: "translateY(-4px)", 
              boxShadow: "md", 
              borderColor: "teal.300" 
            }}
          >
            <CardHeader pb={2} bg="teal.50">
              <Heading size="md" color="teal.600">{plano.nome}</Heading>
            </CardHeader>
            <CardBody pt={3} pb={4}>
              <Text fontSize="2xl" fontWeight="bold" mb={3}>
                R$ {plano.precoMensal.toFixed(2)}<Text as="span" fontSize="sm" color="gray.500">/mês</Text>
              </Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text>Limite de Notas: {plano.limiteNotas === -1 ? 'Ilimitado' : plano.limiteNotas.toLocaleString('pt-BR')}</Text>
                <Text>Limite de Empresas Vinculadas: {plano.limiteEmpresas === -1 ? 'Ilimitado' : plano.limiteEmpresas}</Text>
                <Text fontWeight="medium" mt={2}>Recursos:</Text>
                {plano.features.map(feature => <Text key={feature}>- {feature}</Text>)}
              </VStack>
              <Button 
                mt={4} 
                colorScheme="teal" 
                variant="outline" 
                width="full" 
                size="sm"
                borderRadius="md"
                transition="all 0.2s"
                _hover={{ bg: "teal.50", transform: "translateY(-1px)" }}
              >
                Gerenciar Assinantes
              </Button>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default function AdminPanel() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('overview'); // overview, manageEmpresas, monitoring, planos
  const { isOpen: isCadastroOpen, onOpen: onOpenCadastro, onClose: onCloseCadastro } = useDisclosure();
  const { isOpen: isTokensOpen, onOpen: onOpenTokens, onClose: onCloseTokens } = useDisclosure();
  const [selectedEmpresaForTokens, setSelectedEmpresaForTokens] = useState<EmpresaData | null>(null);
  const toast = useToast();

  const handleLogout = () => {
    signOut();
    navigate('/admin-login');
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard'); // Atualizado para a rota correta do dashboard
  };

  const handleEmpresaCreated = () => {
    toast({
      title: "Empresa cadastrada",
      description: "A empresa foi cadastrada com sucesso.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleViewTokens = (empresa: EmpresaData) => {
    setSelectedEmpresaForTokens(empresa);
    onOpenTokens();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'manageEmpresas':
        return (
          <ManageEmpresasView
            onBack={() => setCurrentView('overview')}
            onOpenCadastro={onOpenCadastro}
            onViewTokens={handleViewTokens}
          />
        );
      case 'monitoring':
        return <MonitoringView onBack={() => setCurrentView('overview')} />;
      case 'planos':
        return <ManagePlanosView onBack={() => setCurrentView('overview')} />;
      case 'overview':
      default:
  return (
          <Box>
            <VStack spacing={5} align="stretch" mt={5}>
              {/* Linha de cards principais */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                {/* Card de Empresas */}
                <Box 
        p={4}
                  borderWidth="1px" 
                  borderRadius="lg" 
                  bg="white" 
                  boxShadow="sm"
                  transition="all 0.3s ease"
                  _hover={{ 
                    transform: "translateY(-4px)", 
                    boxShadow: "md", 
                    borderColor: "blue.300" 
                  }}
                >
                  <Flex align="center" mb={2}>
                    <Icon as={MdBusiness} boxSize={5} mr={2} color="blue.500" />
                    <Heading size="md">Empresas Cadastradas</Heading>
                  </Flex>
                  <Text color="gray.600" fontSize="sm" mb={3}>Gerencie as empresas que têm acesso ao sistema</Text>
                  
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<Icon as={MdBusiness} />}
                    onClick={() => setCurrentView('manageEmpresas')}
                    size="sm"
                    mt={2}
                  >
                    Gerenciar Empresas
        </Button>
                </Box>

                {/* Card de Planos */}
                <Box 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  bg="white" 
                  boxShadow="sm"
                  transition="all 0.3s ease"
                  _hover={{ 
                    transform: "translateY(-4px)", 
                    boxShadow: "md", 
                    borderColor: "teal.300" 
                  }}
                >
                  <Flex align="center" mb={2}>
                    <Icon as={FiGrid} boxSize={5} mr={2} color="teal.500" />
                    <Heading size="md">Planos de Assinatura</Heading>
                  </Flex>
                  <Text color="gray.600" fontSize="sm" mb={3}>Configure os planos disponíveis para as empresas</Text>
                  
                  <Button 
                    colorScheme="teal" 
                    leftIcon={<Icon as={FiGrid} />}
                    onClick={() => setCurrentView('planos')}
                    size="sm"
                    mt={2}
                  >
                    Gerenciar Planos
                  </Button>
      </Box>
              </SimpleGrid>

              {/* Card de Monitoramento */}
              <Box 
                p={4} 
                borderWidth="1px" 
                borderRadius="lg" 
                bg="white" 
                boxShadow="sm"
                transition="all 0.3s ease"
                _hover={{ 
                  transform: "translateY(-4px)", 
                  boxShadow: "md", 
                  borderColor: "purple.300" 
                }}
              >
                <Flex align="center" mb={2}>
                  <Icon as={MdBarChart} boxSize={5} mr={2} color="purple.500" />
                  <Heading size="md">Monitoramento</Heading>
    </Flex>
                <Text color="gray.600" fontSize="sm" mb={3}>Acompanhe o uso do sistema em tempo real</Text>
                
                <Button 
                  colorScheme="purple" 
                  leftIcon={<Icon as={MdBarChart} />}
                  onClick={() => setCurrentView('monitoring')}
                  size="sm"
                  mt={2}
                >
                  Ver Relatórios
                </Button>
              </Box>
            </VStack>
          </Box>
        );
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Flex 
        as="header" 
        align="center" 
        justify="space-between" 
        px={6} 
        py={4} 
        bg="white" 
        borderBottomWidth="1px" 
        borderBottomColor="gray.200"
        boxShadow="sm"
      >
        <Heading size="lg">Painel de Administração</Heading>
        <HStack spacing={3}>
          <Button 
            leftIcon={<Icon as={MdDashboard} />} 
            variant="outline" 
            onClick={handleNavigateToDashboard}
            size="sm"
            borderRadius="md"
            _hover={{ bg: 'gray.50' }}
          >
            Ir para Dashboard
          </Button>
          <Button 
            leftIcon={<Icon as={MdExitToApp} />} 
            colorScheme="red" 
            onClick={handleLogout}
            size="sm"
            borderRadius="md"
          >
            Sair
          </Button>
        </HStack>
    </Flex>
    
      {/* Menu de Navegação Horizontal */}
      <Box 
        px={6} 
        py={3} 
        bg="white" 
        mb={5}
        boxShadow="xs"
        position="sticky"
        top="0"
        zIndex="sticky"
        borderBottomWidth="1px"
        borderBottomColor="gray.100"
      >
        <HStack spacing={6}>
          <Button 
            variant={currentView === 'overview' ? "solid" : "ghost"} 
            colorScheme={currentView === 'overview' ? "blue" : "gray"}
            onClick={() => setCurrentView('overview')}
            leftIcon={<Icon as={MdDashboard} />}
            size="sm"
            borderRadius="md"
            fontWeight="medium"
            transition="all 0.2s"
            _hover={{ transform: currentView !== 'overview' ? "translateY(-1px)" : "none" }}
          >
            Visão Geral
      </Button>
          <Button 
            variant={currentView === 'manageEmpresas' ? "solid" : "ghost"} 
            colorScheme={currentView === 'manageEmpresas' ? "blue" : "gray"}
            onClick={() => setCurrentView('manageEmpresas')}
            leftIcon={<Icon as={MdBusiness} />}
            size="sm"
            borderRadius="md"
            fontWeight="medium"
            transition="all 0.2s"
            _hover={{ transform: currentView !== 'manageEmpresas' ? "translateY(-1px)" : "none" }}
          >
            Empresas
      </Button>
          <Button 
            variant={currentView === 'planos' ? "solid" : "ghost"} 
            colorScheme={currentView === 'planos' ? "blue" : "gray"}
            onClick={() => setCurrentView('planos')}
            leftIcon={<Icon as={FiGrid} />}
            size="sm"
            borderRadius="md"
            fontWeight="medium"
            transition="all 0.2s"
            _hover={{ transform: currentView !== 'planos' ? "translateY(-1px)" : "none" }}
          >
            Planos
      </Button>
    </HStack>
      </Box>

      {/* Conteúdo Principal */}
      <Box px={6} pb={12}>
        <Container maxW="container.xl">
          {renderContent()}
        </Container>
      </Box>

      {/* Drawers */}
      <CadastroEmpresaDrawer 
        isOpen={isCadastroOpen} 
        onClose={onCloseCadastro} 
        onEmpresaCreated={handleEmpresaCreated} 
      />
      <ManageTokensDrawer 
        isOpen={isTokensOpen} 
        onClose={onCloseTokens} 
        empresa={selectedEmpresaForTokens} 
      />
  </Box>
); 
} 