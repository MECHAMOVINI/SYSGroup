import { useState } from 'react'
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Text,
  Icon,
  Button,
  useToast,
  Input,
} from '@chakra-ui/react'
import { MdUpload } from 'react-icons/md'

export default function NotasFiscais() {
  const [isDragging, setIsDragging] = useState(false)
  const toast = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const xmlFiles = files.filter(file => file.name.endsWith('.xml'))

    if (xmlFiles.length === 0) {
      toast({
        title: 'Erro no upload',
        description: 'Por favor, selecione apenas arquivos XML',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // TODO: Implementar o upload dos arquivos
    console.log('Arquivos para upload:', xmlFiles)
  }

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>Upload de XML</Tab>
          <Tab>Número/Chave de Acesso</Tab>
          <Tab>Integração Manual</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack
              spacing={4}
              p={8}
              border="2px dashed"
              borderColor={isDragging ? 'blue.500' : 'gray.200'}
              borderRadius="lg"
              bg={isDragging ? 'blue.50' : 'white'}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: 'blue.500', bg: 'blue.50' }}
            >
              <Icon as={MdUpload} boxSize={12} color="gray.400" />
              <Text color="gray.600" textAlign="center">
                Arraste e solte o arquivo XML da nota fiscal ou clique para selecionar
              </Text>
              <Text fontSize="sm" color="gray.500">
                Apenas arquivos .xml são aceitos
              </Text>
              <Input
                type="file"
                accept=".xml"
                display="none"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  // TODO: Implementar o upload dos arquivos
                  console.log('Arquivos selecionados:', files)
                }}
              />
              <Button colorScheme="blue" size="lg">
                Selecionar Arquivo
              </Button>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Text>Em desenvolvimento...</Text>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Text>Em desenvolvimento...</Text>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
} 