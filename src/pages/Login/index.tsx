import React, { useState } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Link,
  Stack,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { MdArrowForward } from 'react-icons/md'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signInEmpresa } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signInEmpresa(email, token)
      navigate('/selecao-sistema')
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: 'Verifique suas credenciais e tente novamente',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    toast({
      position: 'bottom-right',
      duration: 5000,
      isClosable: true,
      render: () => (
        <Box 
          color="black" 
          bg="white" 
          py={2}
          px={4}
          rounded="md" 
          boxShadow="md" 
          fontSize="sm"
        >
          Entre em contato com o administrador do sistema para obter seu token de acesso.
        </Box>
      ),
    })
  }

  return (
    <Box
      minH="100vh"
      py={8}
      bg="gray.100"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="md">
        <Box bg="white" p={6} rounded="lg" boxShadow="lg">
          <Stack spacing={4}>
            <Stack align="center" spacing={1}>
              <Logo size="lg" showTagline />
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">E-mail corporativo</FormLabel>
                  <Input
                    type="email"
                    placeholder="seu.email@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="md"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">
                    Token de acesso <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  <Input
                    type="text"
                    placeholder="Insira o token de acesso"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    size="md"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="md"
                  fontSize="sm"
                  isLoading={isLoading}
                  leftIcon={<Icon as={MdArrowForward} />}
                >
                  Entrar no sistema
                </Button>
              </Stack>
            </form>
            <Button
              variant="link"
              colorScheme="blue"
              fontWeight="medium"
              fontSize="sm"
              onClick={handleForgotPassword}
              alignSelf="center"
            >
              Esqueci meu token
            </Button>
            <Text fontSize="xs" color="gray.600" textAlign="center" mt={3}>
              Acesso exclusivo para usuários autorizados.
            </Text>
          </Stack>
        </Box>
        <VStack spacing={1} mt={8} color="gray.600" fontSize="xs" textAlign="center">
          <Text>© {new Date().getFullYear()} - Todos os direitos reservados</Text>
          <Text>Acesso restrito a funcionários autorizados</Text>
          <Link as={RouterLink} to="/admin" color="gray.600" _hover={{ textDecoration: 'underline' }}>
            Área administrativa
          </Link>
        </VStack>
      </Container>
    </Box>
  )
} 