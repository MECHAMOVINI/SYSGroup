import { useState, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  useToast,
  VStack,
  useColorModeValue,
  Spacer
} from '@chakra-ui/react';
import { FiCamera, FiMail, FiSave, FiUser, FiLock, FiHelpCircle } from 'react-icons/fi';

export default function Configuracoes() {
  const toast = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');

  // Estados para controle de dados
  const [nomeExibicao, setNomeExibicao] = useState('Usuário Exemplo');
  const [emailLogin, setEmailLogin] = useState('usuario@exemplo.com');
  const [imagemPerfil, setImagemPerfil] = useState<string | null>(null);
  const [mensagemSuporte, setMensagemSuporte] = useState('');

  const handleImageChangeClick = () => {
    inputFileRef.current?.click();
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Verificar o tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({ 
          title: 'Arquivo muito grande', 
          description: 'A imagem deve ter no máximo 2MB', 
          status: 'error', 
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPerfil(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarPerfil = () => {
    if (nomeExibicao.trim() === '') {
      toast({ 
        title: 'Nome inválido', 
        description: 'Por favor, informe um nome de exibição', 
        status: 'warning', 
        duration: 3000,
        isClosable: true 
      });
      return;
    }

    toast({ 
      title: 'Informações do perfil salvas!', 
      status: 'success', 
      duration: 3000, 
      isClosable: true 
    });
  };

  const handleSalvarEmail = () => {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLogin)) {
      toast({ 
        title: 'Email inválido', 
        description: 'Por favor, informe um email válido', 
        status: 'warning', 
        duration: 3000,
        isClosable: true 
      });
      return;
    }
    
    toast({ 
      title: 'Email de login atualizado!', 
      status: 'success', 
      duration: 3000, 
      isClosable: true 
    });
  };

  const handleEnviarContato = () => {
    if (!mensagemSuporte.trim()) {
        toast({ title: 'Mensagem vazia', description: 'Por favor, escreva sua mensagem.', status: 'warning', duration: 3000, isClosable: true });
        return;
    }
    console.log('Enviar Contato:', { mensagemSuporte });
    const emailAdmin = 'suporte@nfsys.com'; // Substituir pelo email real
    const assunto = 'Contato do Usuário - NFSys';
    const corpoEmail = encodeURIComponent(mensagemSuporte);
    window.location.href = `mailto:${emailAdmin}?subject=${assunto}&body=${corpoEmail}`;
    
    toast({ title: 'Abrindo cliente de email...', description: 'Sua mensagem está pronta para ser enviada.', status: 'info', duration: 4000, isClosable: true });
    setMensagemSuporte('');
  };

  return (
    <Box>
      <Heading mb={6} size="md" fontWeight="semibold">
        Configurações da Conta
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} alignItems="stretch">
        {/* Card de Informações do Perfil */}
        <Card 
          borderWidth="1px" 
          borderRadius="lg" 
          borderColor={cardBorderColor} 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "blue.300" 
          }}
          display="flex" 
          flexDirection="column" 
          height="100%"
        >
          <CardHeader pb={2}>
            <HStack>
              <Icon as={FiUser} w={5} h={5} color="blue.500" />
              <Heading size="sm">Informações do Perfil</Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={2} display="flex" flexDirection="column" flexGrow={1}>
            <VStack spacing={4} align="stretch" flexGrow={1}>
              <FormControl>
                <FormLabel fontSize="sm">Nome de Exibição</FormLabel>
                <Input 
                  value={nomeExibicao} 
                  onChange={(e) => setNomeExibicao(e.target.value)}
                  placeholder="Seu nome como aparecerá no sistema"
                  size="sm"
                  variant="outline"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Imagem de Perfil</FormLabel>
                <HStack spacing={4}>
                  <Avatar size="lg" name={nomeExibicao} src={imagemPerfil || undefined} />
                  <Button 
                    leftIcon={<Icon as={FiCamera}/>} 
                    onClick={handleImageChangeClick}
                    variant="outline"
                    size="sm"
                  >
                    Alterar Imagem
                  </Button>
                  <Input 
                    type="file" 
                    hidden 
                    ref={inputFileRef} 
                    accept="image/*" 
                    onChange={handleImageFileChange}
                  />
                </HStack>
              </FormControl>
              <Spacer />
              <Button 
                colorScheme="blue" 
                onClick={handleSalvarPerfil} 
                leftIcon={<Icon as={FiSave}/>} 
                size="sm"
              >
                Salvar Informações
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Card de Segurança da Conta */}
        <Card 
          borderWidth="1px" 
          borderRadius="lg" 
          borderColor={cardBorderColor} 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "purple.300" 
          }}
          display="flex" 
          flexDirection="column" 
          height="100%"
        >
          <CardHeader pb={2}>
            <HStack>
              <Icon as={FiLock} w={5} h={5} color="purple.500" />
              <Heading size="sm">Segurança da Conta</Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={2} display="flex" flexDirection="column" flexGrow={1}>
            <VStack spacing={4} align="stretch" flexGrow={1}>
              <FormControl>
                <FormLabel fontSize="sm">Email de Login</FormLabel>
                <Input 
                  type="email"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  placeholder="seu.email@provedor.com"
                  size="sm"
                  variant="outline"
                />
              </FormControl>
              <Text fontSize="xs" color="gray.500" mt={0} pt={0} textAlign="center">
                Para alterar seu token de acesso, por favor, entre em contato com a administração.
              </Text>
              <Spacer />
              <Button 
                colorScheme="blue" 
                onClick={handleSalvarEmail} 
                leftIcon={<Icon as={FiSave}/>} 
                size="sm"
              >
                Atualizar Email
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Card de Suporte */}
      <Card 
        borderWidth="1px" 
        borderRadius="lg" 
        mt={6} 
        borderColor={cardBorderColor} 
        boxShadow="sm"
        transition="all 0.3s ease"
        _hover={{ 
          transform: "translateY(-4px)", 
          boxShadow: "md", 
          borderColor: "teal.300" 
        }}
      >
        <CardHeader pb={2}>
          <HStack>
            <Icon as={FiHelpCircle} w={5} h={5} color="teal.500" />
            <Heading size="sm">Suporte e Contato</Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={2}>
            <VStack spacing={3} align="stretch">
                <Text fontSize="sm" color="gray.600">
                    Precisa de ajuda ou tem alguma dúvida sobre o sistema? Envie-nos uma mensagem.
                </Text>
                <FormControl>
                    <FormLabel fontSize="sm">Sua Mensagem</FormLabel>
                    <Textarea 
                        value={mensagemSuporte}
                        onChange={(e) => setMensagemSuporte(e.target.value)}
                        placeholder="Digite sua dúvida ou feedback aqui..."
                        rows={3}
                        size="sm"
                    />
                </FormControl>
                <Button colorScheme="blue" onClick={handleEnviarContato} leftIcon={<Icon as={FiMail}/>} size="sm">
                    Enviar Mensagem
                </Button>
            </VStack>
        </CardBody>
      </Card>
    </Box>
  );
} 