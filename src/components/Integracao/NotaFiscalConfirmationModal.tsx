import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Heading,
  SimpleGrid,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Flex,
  Spacer,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { FiFileText, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';

export interface NotaFiscalItem {
  codigo: string;
  descricao: string;
  qtd: number;
  valorUnit: number;
  valorTotal: number;
  familia: string;
  hlEquiv: number;
  status: string; // e.g., 'Cadastrado'
}

export interface NotaFiscalDetails {
  numeroNota: string;
  dataEmissao: string;
  dataIntegracao?: string;
  razaoSocialEmitente: string;
  cnpjEmitente: string;
  inscricaoEstadual?: string;
  valorTotalNF: number;
  volumeTotalHL?: number;
  transportadora?: string;
  statusNF: string; // e.g., 'Pendente'
  items: NotaFiscalItem[];
  rawXml?: string; // Optional: to store the full XML content
}

interface NotaFiscalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: NotaFiscalDetails) => void;
  notaFiscalData: NotaFiscalDetails | null;
}

const mockNotaFiscalItem: NotaFiscalItem = {
  codigo: 'SKU123',
  descricao: 'Cerveja Tipo Especial 600ml',
  qtd: 150,
  valorUnit: 12.50,
  valorTotal: 1875.00,
  familia: 'Especial',
  hlEquiv: 90,
  status: 'Cadastrado',
};

export const mockNotaFiscalData: NotaFiscalDetails = {
  numeroNota: 'NF-e 000084181',
  dataEmissao: 'Invalid Date', // As per image, will need proper parsing later
  dataIntegracao: '15/05/2025',
  razaoSocialEmitente: 'Empresa Fornecedora Ltda.',
  cnpjEmitente: '12.345.678/0001-99',
  inscricaoEstadual: '123.456.789-0',
  valorTotalNF: 8765.43,
  volumeTotalHL: 432.1,
  transportadora: 'Transportadora Rápida Ltda.',
  statusNF: 'Pendente',
  items: [
    mockNotaFiscalItem,
    { ...mockNotaFiscalItem, codigo: 'SKU456', descricao: 'Refrigerante Cola 2L', qtd: 200, valorUnit: 9.80, valorTotal: 1960.00, familia: 'Não Alcoólicos', hlEquiv: 400 },
  ],
};


export default function NotaFiscalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  notaFiscalData,
}: NotaFiscalConfirmationModalProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const valueColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!notaFiscalData) return null;

  const handleConfirm = () => {
    onConfirm(notaFiscalData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={cardBg} borderRadius="lg">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          <Flex alignItems="center" pr="3rem">
            <Heading size="md" fontWeight="semibold">Detalhes da Nota Fiscal</Heading>
            <Spacer />
            {notaFiscalData.statusNF && (
              <Badge colorScheme="blue" variant="solid" px={3} py={1} borderRadius="md" mr={2}>
                {notaFiscalData.statusNF}
              </Badge>
            )}
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6} px={{ base: 4, md: 6 }}>
          <VStack spacing={6} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Box>
                <Text fontSize="sm" color={textColor}>Número da Nota</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.numeroNota}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>Data de Emissão</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.dataEmissao}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>Data de Integração</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.dataIntegracao || 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>Razão Social do Emitente</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.razaoSocialEmitente}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>CNPJ do Emitente</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.cnpjEmitente}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>Inscrição Estadual</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.inscricaoEstadual || 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>Valor Total</Text>
                <Text fontWeight="bold" color="blue.500" fontSize="lg">
                  R$ {notaFiscalData.valorTotalNF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>Volume Total</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.volumeTotalHL ? `${notaFiscalData.volumeTotalHL} HL` : 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={textColor}>Transportadora</Text>
                <Text fontWeight="medium" color={valueColor}>{notaFiscalData.transportadora || 'N/A'}</Text>
              </Box>
            </SimpleGrid>

            <Box>
              <Heading size="sm" fontWeight="semibold" mb={3} mt={4}>Itens da Nota</Heading>
              <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th textAlign="center">Código</Th>
                      <Th textAlign="center">Descrição</Th>
                      <Th textAlign="center">Qtd</Th>
                      <Th textAlign="center">Valor Unit.</Th>
                      <Th textAlign="center">Valor Total</Th>
                      <Th textAlign="center">Família</Th>
                      <Th textAlign="center">HL Equiv.</Th>
                      <Th textAlign="center">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {notaFiscalData.items.map((item, index) => (
                      <Tr key={index}>
                        <Td textAlign="center">{item.codigo}</Td>
                        <Td textAlign="center">{item.descricao}</Td>
                        <Td textAlign="center">{item.qtd}</Td>
                        <Td textAlign="center">R$ {item.valorUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Td>
                        <Td textAlign="center">R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Td>
                        <Td textAlign="center">{item.familia}</Td>
                        <Td textAlign="center">{item.hlEquiv}</Td>
                        <Td textAlign="center">
                          {item.status === 'Cadastrado' && (
                            <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                          )}
                          {item.status === 'Pendente' && ( // Assuming 'Pendente' for yellow
                            <Icon as={FiAlertTriangle} color="yellow.500" boxSize={5} />
                          )}
                          {item.status === 'Erro' && ( // Assuming 'Erro' for red
                            <Icon as={FiXCircle} color="red.500" boxSize={5} />
                          )}
                          {/* Fallback for other statuses or if you want to show text */}
                          {/* {!['Cadastrado', 'Pendente', 'Erro'].includes(item.status) && item.status} */}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor} pt={4} pb={4}>
          <Button variant="outline" onClick={onClose} mr={3} size="sm">
            Cancelar
          </Button>
          <Button 
            leftIcon={<Icon as={FiFileText} />} 
            variant="ghost" 
            colorScheme="gray" 
            mr={3} 
            size="sm"
            onClick={() => console.log("Ver XML Completo Clicado. XML:", notaFiscalData.rawXml || "Não disponível")}
          >
            Ver XML Completo
          </Button>
          <Button colorScheme="blue" onClick={handleConfirm} size="sm">
            Integrar NF
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 