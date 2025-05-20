import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Card,
  CardBody,
  Heading,
} from '@chakra-ui/react'
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md'
import { useForm } from 'react-hook-form'

type EmpresaForm = {
  nome: string
  cnpj: string
  email: string
  limiteSessoes: number
}

export default function Empresas() {
  const [empresas, setEmpresas] = useState<EmpresaForm[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { register, handleSubmit, reset, formState: { errors: _errors } } = useForm<EmpresaForm>()

  const onSubmit = (data: EmpresaForm) => {
    // TODO: Implementar integração com backend
    setEmpresas([...empresas, data])
    toast({
      title: 'Empresa cadastrada com sucesso',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
    reset()
    onClose()
  }

  return (
    <Box>
      <Card>
        <CardBody>
          <HStack justify="space-between" mb={6}>
            <Heading size="md">Empresas Cadastradas</Heading>
            <Button
              leftIcon={<MdAdd />}
              colorScheme="blue"
              onClick={onOpen}
            >
              Cadastrar Empresa
            </Button>
          </HStack>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome da Empresa</Th>
                <Th>CNPJ</Th>
                <Th>E-mail</Th>
                <Th>Limite de Acessos</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {empresas.map((empresa, index) => (
                <Tr key={index}>
                  <Td>{empresa.nome}</Td>
                  <Td>{empresa.cnpj}</Td>
                  <Td>{empresa.email}</Td>
                  <Td>{empresa.limiteSessoes}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Editar"
                        icon={<MdEdit />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                      />
                      <IconButton
                        aria-label="Excluir"
                        icon={<MdDelete />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cadastrar Nova Empresa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack as="form" spacing={4} pb={6} onSubmit={handleSubmit(onSubmit)}>
              <FormControl isRequired>
                <FormLabel>Nome da Empresa</FormLabel>
                <Input
                  placeholder="Digite o nome da empresa"
                  {...register('nome', { required: true })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>CNPJ</FormLabel>
                <Input
                  placeholder="00.000.000/0000-00"
                  {...register('cnpj', { required: true })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>E-mail Corporativo</FormLabel>
                <Input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  {...register('email', { required: true })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Limite de Acessos Simultâneos</FormLabel>
                <Input
                  type="number"
                  min={1}
                  defaultValue={1}
                  {...register('limiteSessoes', { required: true })}
                />
              </FormControl>

              <Button type="submit" colorScheme="blue" width="full">
                Salvar
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
} 