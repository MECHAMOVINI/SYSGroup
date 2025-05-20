import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Icon,
  Flex,
  useToast,
  Container,
  HStack,
  Alert,
  AlertIcon,
  AlertDescription,
  Code,
  IconButton,
  SimpleGrid,
  Card,
  CardBody,
  Center,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { MdArrowForward, MdBusiness, MdContentCopy, MdHelpOutline, MdReceipt, MdDirectionsCar, MdAttachMoney, MdInventory } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/Logo';

export default function SistemaSelecao() {
  const { user } = useAuth();
  const toast = useToast();

  const handleCopyToken = () => {
    if (user?.type === 'empresa' && (user as any).tokenAcesso) {
      navigator.clipboard.writeText((user as any).tokenAcesso)
        .then(() => {
          toast({
            title: 'Token copiado',
            description: 'O token de acesso foi copiado para a área de transferência.',
            status: 'success',
            duration: 2000,
            isClosable: true,
            position: 'bottom-right',
          });
        })
        .catch(() => {
      toast({
            title: 'Erro ao copiar',
            description: 'Não foi possível copiar o token para a área de transferência.',
            status: 'error',
        duration: 3000,
        isClosable: true,
      });
        });
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={8} px={4}>
      <Container maxW="xl">
        <VStack spacing={6}>
          <Box textAlign="center">
            <Logo size="lg" showTagline />
            <HStack justify="center" mt={2}>
              <Text color="gray.600" fontSize="md">
                {user?.type === 'empresa' 
                  ? `${(user as any).razaoSocial}` 
                  : 'Selecione o sistema que deseja acessar'}
              </Text>
              {user?.type === 'empresa' && (
                <Icon as={MdBusiness} color="blue.500" boxSize={5} />
              )}
            </HStack>
          </Box>

          {user?.type === 'empresa' && (user as any).tokenAcesso && (
            <Alert status="info" borderRadius="md" size="sm">
              <AlertIcon />
              <Box flex="1">
                <AlertDescription display="block">
                  <Text mb={1}>Seu token de acesso:</Text>
                  <Flex align="center" background="gray.50" p={2} borderRadius="md">
                    <Code flex="1" fontSize="xs" wordBreak="break-all">
                      {(user as any).tokenAcesso}
                    </Code>
                    <IconButton
                      aria-label="Copiar token"
                      icon={<Icon as={MdContentCopy} />}
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyToken}
                      ml={2}
                    />
                  </Flex>
                  <Text mt={1} fontSize="xs">
                    Guarde este token para futuros acessos.
                  </Text>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          <Box w="full">
            <Text mb={2} fontWeight="medium" color="gray.700" fontSize="sm">Sistemas disponíveis:</Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full" maxW="800px" mx="auto">
              {/* NFSys Card */}
              <Card 
                as={Link} 
                to="/dashboard"
                borderRadius="md" 
                overflow="hidden" 
                variant="outline"
                _hover={{ transform: "translateY(-2px)", boxShadow: "sm" }}
                transition="all 0.2s"
                bg="white"
                height="75px"
              >
                <CardBody py={3} px={4} display="flex" alignItems="center">
                  <Icon as={MdReceipt} boxSize={8} color="blue.500" mr={3} />
                  <Box flex="1">
                    <Heading size="sm">NFSys</Heading>
                    <Text fontSize="xs" color="gray.600">Notas Fiscais e HL</Text>
                  </Box>
                  <Icon as={MdArrowForward} color="blue.500" boxSize={5} />
                </CardBody>
              </Card>

              {/* FROTSys Card - Disabled */}
              <Card 
                borderRadius="md" 
                overflow="hidden" 
                variant="outline"
                opacity="0.6"
                cursor="not-allowed"
                bg="white"
                height="75px"
              >
                <CardBody py={3} px={4} display="flex" alignItems="center">
                  <Icon as={MdDirectionsCar} boxSize={8} color="gray.400" mr={3} />
                  <Box flex="1">
                    <Heading size="sm">FROTSys</Heading>
                    <Text fontSize="xs" color="gray.600">Frotas e Abastecimentos</Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500">Em breve</Text>
                </CardBody>
              </Card>

              {/* GESTSys Card - Disabled */}
              <Card 
                borderRadius="md" 
                overflow="hidden" 
                variant="outline"
                opacity="0.6"
                cursor="not-allowed"
                bg="white"
                height="75px"
              >
                <CardBody py={3} px={4} display="flex" alignItems="center">
                  <Icon as={MdAttachMoney} boxSize={8} color="gray.400" mr={3} />
                  <Box flex="1">
                    <Heading size="sm">GESTSys</Heading>
                    <Text fontSize="xs" color="gray.600">Gastos e Ordens</Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500">Em breve</Text>
                </CardBody>
              </Card>
              
              {/* ATIVSys Card - Disabled */}
              <Card 
                borderRadius="md" 
                overflow="hidden" 
                variant="outline"
                opacity="0.6"
                cursor="not-allowed"
                bg="white"
                height="75px"
              >
                <CardBody py={3} px={4} display="flex" alignItems="center">
                  <Icon as={MdInventory} boxSize={8} color="gray.400" mr={3} />
                  <Box flex="1">
                    <Heading size="sm">ATIVSys</Heading>
                    <Text fontSize="xs" color="gray.600">Controle de Ativos</Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500">Em breve</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          <Center w="full" pt={2}>
            <Button 
              leftIcon={<Icon as={MdHelpOutline} />}
              variant="ghost"
              size="xs"
              as="a"
              href="https://docs.example.com/nfsys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ajuda
            </Button>
          </Center>
        </VStack>
      </Container>
    </Box>
  );
} 