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
import { Link as RouterLink } from 'react-router-dom'
import { MdArrowForward } from 'react-icons/md'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../../components/Logo'

export default function AdminLogin() {
  const [email, setEmail] = useState('nfsys.admin@nfsys.com')
  const [senha, setSenha] = useState('221113vg')
  const { signInAdmin, isLoading } = useAuth()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await signInAdmin(email, senha)
      toast({
        title: 'Login de Admin Bem-sucedido',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais e tente novamente',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      })
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
          Funcionalidade de "Esqueci minha senha" ainda não implementada.
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
        <Box 
          bg="white" 
          p={6} 
          rounded="lg" 
          boxShadow="md"
          transition="all 0.3s ease"
          _hover={{
            boxShadow: "lg"
          }}
        >
          <Stack spacing={4}>
            <Stack align="center" spacing={1}>
              <Logo size="md" showTagline={false} />
              <Text color="gray.500" fontSize="sm" mt={2}>
                Painel Administrativo
              </Text>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">E-mail</FormLabel> 
                  <Input
                    type="email"
                    placeholder="admin@nfsys.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="md"
                    borderRadius="md"
                    _focus={{ 
                      borderColor: "blue.400", 
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" 
                    }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">
                    Senha <Text as="span" color="red.500">*</Text>
                  </FormLabel>
                  <Input
                    type="password"
                    placeholder="Insira sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    size="md"
                    borderRadius="md"
                    _focus={{ 
                      borderColor: "blue.400", 
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" 
                    }}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="teal"
                  size="md"
                  fontSize="sm"
                  isLoading={isLoading}
                  leftIcon={<Icon as={MdArrowForward} />}
                  borderRadius="md"
                  transition="all 0.2s"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                >
                  Acessar Painel
                </Button>
              </Stack>
            </form>
            <Button
              variant="link"
              colorScheme="teal"
              fontWeight="medium"
              fontSize="sm"
              onClick={handleForgotPassword}
              alignSelf="center"
              transition="all 0.2s"
              _hover={{ textDecoration: "none", color: "teal.600" }}
            >
              Esqueci minha senha
            </Button>
            <Text fontSize="xs" color="gray.600" textAlign="center" mt={3}>
              Acesso exclusivo para administradores.
            </Text>
          </Stack>
        </Box>
        <VStack spacing={1} mt={8} color="gray.600" fontSize="xs" textAlign="center">
          <Text>© {new Date().getFullYear()} - Todos os direitos reservados</Text>
          <Logo size="sm" color="gray.600" />
          <Link 
            as={RouterLink} 
            to="/login" 
            color="gray.600" 
            _hover={{ textDecoration: 'underline', color: "blue.500" }}
            transition="color 0.2s"
          >
            Acesso Empresa
          </Link>
        </VStack>
      </Container>
    </Box>
  )
} 