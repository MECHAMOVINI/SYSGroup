import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Center,
  Icon,
  Input,
  useToast,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { FiUpload, FiFile } from 'react-icons/fi';

// Atualizando para usar caminho relativo da API
const API_URL = '/api';

const NFeUploader = ({ onProcessedData }) => {
  const [xmlFile, setXmlFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const dropzoneBg = useColorModeValue('gray.50', 'gray.700');
  const dropzoneHoverBg = useColorModeValue('gray.100', 'gray.600');
  const borderColor = useColorModeValue('gray.300', 'gray.600');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xml')) {
      toast({
        title: "Arquivo inválido",
        description: "Apenas arquivos XML são permitidos.",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setXmlFile(file);
    await processXmlFile(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xml')) {
      toast({
        title: "Arquivo inválido",
        description: "Apenas arquivos XML são permitidos.",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setXmlFile(file);
    await processXmlFile(file);
  };
  
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const processXmlFile = async (file) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('xml', file);
      
      const response = await fetch(`${API_URL}/parse-xml`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar o arquivo XML');
      }
      
      const data = await response.json();
      
      toast({
        title: "XML processado com sucesso",
        description: `Nota Fiscal ${data.numero} processada.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Chamar o callback com os dados processados
      if (typeof onProcessedData === 'function') {
        onProcessedData(data);
      }
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      setError(error.message || "Ocorreu um erro ao processar o arquivo XML");
      toast({
        title: "Erro ao processar XML",
        description: error.message || "Não foi possível processar o arquivo XML",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg="white">
      <Heading as="h2" size="md" mb={4} textAlign="center">
        Upload de XML de Nota Fiscal
      </Heading>
      
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Erro ao processar XML</AlertTitle>
            <AlertDescription fontSize="sm">{error}</AlertDescription>
          </Box>
        </Alert>
      )}
      
      <Center
        p={8}
        borderWidth="2px"
        borderColor={borderColor}
        borderStyle="dashed"
        borderRadius="lg"
        bg={dropzoneBg}
        _hover={{ bg: dropzoneHoverBg, cursor: 'pointer' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('xml-upload')?.click()}
        minH="200px"
        flexDirection="column"
      >
        {isProcessing ? (
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Processando arquivo...</Text>
          </VStack>
        ) : (
          <VStack spacing={4}>
            <Icon as={xmlFile ? FiFile : FiUpload} boxSize={12} color="blue.500" />
            <Text fontWeight="medium" textAlign="center">
              {xmlFile 
                ? `Arquivo selecionado: ${xmlFile.name}` 
                : 'Arraste e solte o arquivo XML aqui ou clique para selecionar'}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Apenas arquivos XML de NFe são aceitos
            </Text>
            <Input
              type="file"
              id="xml-upload"
              hidden
              accept=".xml"
              onChange={handleFileChange}
            />
            <Button 
              colorScheme="blue" 
              size="md"
              isDisabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('xml-upload')?.click();
              }}
            >
              Selecionar arquivo
            </Button>
          </VStack>
        )}
      </Center>
      
      {xmlFile && !isProcessing && (
        <Center mt={4}>
          <Button 
            colorScheme="green" 
            onClick={() => processXmlFile(xmlFile)}
            isDisabled={isProcessing}
          >
            Reprocessar XML
          </Button>
        </Center>
      )}
    </Box>
  );
};

export default NFeUploader; 