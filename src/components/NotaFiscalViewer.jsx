import React from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Divider,
  SimpleGrid,
  Flex,
  Button,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { FiCheckCircle, FiAlertCircle, FiPlusCircle } from 'react-icons/fi';

const NotaFiscalViewer = ({ notaFiscal, onSave, onCadastrarProduto }) => {
  if (!notaFiscal) return null;
  
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Formatar a data de emissão
  const dataEmissao = notaFiscal.dataEmissao 
    ? new Date(notaFiscal.dataEmissao).toLocaleDateString('pt-BR')
    : '';
  
  // Formatar o CNPJ
  const formatCNPJ = (cnpj) => {
    if (!cnpj || typeof cnpj !== 'string') return cnpj;
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };
  
  // Formatar valor monetário
  const formatMoney = (value) => {
    if (value === undefined || value === null) return '';
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  // Formatar valor de HL
  const formatHL = (value) => {
    if (value === undefined || value === null) return '0,00';
    return new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Verificar se todos os produtos estão cadastrados
  const todosProdutosCadastrados = notaFiscal.produtos.every(produto => produto.cadastrado === true);
  
  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={borderColor} 
      bg={bgColor}
      boxShadow="sm"
      maxW="1200px"
      mx="auto"
    >
      <Heading as="h2" size="md" mb={4} textAlign="center">
        Dados da Nota Fiscal
      </Heading>
      
      {/* Informações básicas da NF e Total de HL */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
        <Box borderWidth="1px" borderRadius="md" p={3} borderColor={borderColor}>
          <Heading as="h3" size="sm" mb={2}>
            Informações da Nota
          </Heading>
          <SimpleGrid columns={2} spacing={2}>
            <Text fontSize="sm" fontWeight="bold">Número:</Text>
            <Text fontSize="sm">{notaFiscal.numero}</Text>
            
            <Text fontSize="sm" fontWeight="bold">Série:</Text>
            <Text fontSize="sm">{notaFiscal.serie}</Text>
            
            <Text fontSize="sm" fontWeight="bold">Data de Emissão:</Text>
            <Text fontSize="sm">{dataEmissao}</Text>
            
            <Text fontSize="sm" fontWeight="bold">Valor Total:</Text>
            <Text fontSize="sm">{formatMoney(notaFiscal.valorTotal)}</Text>
            
            <Text fontSize="sm" fontWeight="bold">Chave de Acesso:</Text>
            <Text fontSize="sm" fontFamily="monospace" isTruncated title={notaFiscal.chaveAcesso}>
              {notaFiscal.chaveAcesso}
            </Text>
          </SimpleGrid>
        </Box>
        
        <Box borderWidth="1px" borderRadius="md" p={3} borderColor={borderColor}>
          <Heading as="h3" size="sm" mb={2}>
            Emitente
          </Heading>
          <SimpleGrid columns={2} spacing={2}>
            <Text fontSize="sm" fontWeight="bold">Razão Social:</Text>
            <Text fontSize="sm">{notaFiscal.emitente?.razaoSocial}</Text>
            
            <Text fontSize="sm" fontWeight="bold">CNPJ:</Text>
            <Text fontSize="sm">{formatCNPJ(notaFiscal.emitente?.cnpj)}</Text>
            
            <Text fontSize="sm" fontWeight="bold">Inscrição Estadual:</Text>
            <Text fontSize="sm">{notaFiscal.emitente?.inscricaoEstadual}</Text>
            
            <Text fontSize="sm" fontWeight="bold">Endereço:</Text>
            <Text fontSize="sm">{notaFiscal.emitente?.endereco}</Text>
          </SimpleGrid>
        </Box>

        <Box 
          borderWidth="1px" 
          borderRadius="md" 
          p={3} 
          borderColor="blue.300"
          bg="blue.50"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Stat textAlign="center">
            <StatLabel fontSize="md" color="blue.600">Volume Total em Hectolitros</StatLabel>
            <StatNumber fontSize="3xl" color="blue.700">{formatHL(notaFiscal.volumeTotal)} HL</StatNumber>
            <StatHelpText>
              {notaFiscal.produtos.length} produtos
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>
      
      {/* Produtos */}
      <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} mb={4} overflow="hidden">
        <Flex 
          bg={headerBg} 
          p={3} 
          justifyContent="space-between" 
          alignItems="center"
        >
          <Heading as="h3" size="sm">
            Produtos ({notaFiscal.produtos?.length || 0})
          </Heading>
          <Badge colorScheme={todosProdutosCadastrados ? "green" : "yellow"} p={1}>
            {todosProdutosCadastrados 
              ? "Todos produtos cadastrados" 
              : "Produtos pendentes de cadastro"}
          </Badge>
        </Flex>
        
        <Box overflow="auto">
          <Table size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th>Status</Th>
                <Th>Código</Th>
                <Th>Descrição</Th>
                <Th>Qtd</Th>
                <Th>Unid.</Th>
                <Th isNumeric>Valor Unit.</Th>
                <Th isNumeric>Valor Total</Th>
                <Th isNumeric>HL</Th>
                <Th>Ação</Th>
              </Tr>
            </Thead>
            <Tbody>
              {notaFiscal.produtos && notaFiscal.produtos.length > 0 ? (
                notaFiscal.produtos.map((produto, index) => (
                  <Tr key={index} bg={produto.cadastrado !== true ? "yellow.50" : "transparent"}>
                    <Td>
                      {produto.cadastrado !== true ? (
                        <Tooltip label="Produto não cadastrado">
                          <span>
                            <Icon as={FiAlertCircle} color="yellow.500" boxSize={5} />
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip label="Produto cadastrado">
                          <span>
                            <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                          </span>
                        </Tooltip>
                      )}
                    </Td>
                    <Td>{produto.codigo}</Td>
                    <Td isTruncated maxW="200px" title={produto.descricao}>
                      {produto.descricao}
                    </Td>
                    <Td isNumeric>{produto.quantidade}</Td>
                    <Td>{produto.unidade}</Td>
                    <Td isNumeric>{formatMoney(produto.valorUnitario)}</Td>
                    <Td isNumeric>{formatMoney(produto.valorTotal)}</Td>
                    <Td isNumeric fontWeight="bold" color={produto.hl > 0 ? "blue.600" : undefined}>
                      {formatHL(produto.hl)}
                    </Td>
                    <Td>
                      {produto.cadastrado !== true && (
                        <IconButton
                          size="sm"
                          colorScheme="blue"
                          aria-label="Cadastrar produto"
                          icon={<FiPlusCircle />}
                          onClick={() => onCadastrarProduto && onCadastrarProduto(produto)}
                          title="Cadastrar produto"
                        />
                      )}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={9} textAlign="center">
                    Nenhum produto encontrado
                  </Td>
                </Tr>
              )}
              {notaFiscal.produtos && notaFiscal.produtos.length > 0 && (
                <Tr bg="blue.50">
                  <Td colSpan={7} fontWeight="bold" textAlign="right">
                    Total em Hectolitros (HL):
                  </Td>
                  <Td isNumeric fontWeight="bold" color="blue.600">
                    {formatHL(notaFiscal.volumeTotal)}
                  </Td>
                  <Td></Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
      
      {/* Destinatário e Transportadora */}
      <Accordion allowToggle mb={4}>
        <AccordionItem borderColor={borderColor}>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading as="h3" size="sm">
                  Informações Adicionais
                </Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {/* Destinatário */}
              {notaFiscal.destinatario && (
                <Box borderWidth="1px" borderRadius="md" p={3} borderColor={borderColor}>
                  <Heading as="h4" size="xs" mb={2}>
                    Destinatário
                  </Heading>
                  <SimpleGrid columns={2} spacing={2}>
                    <Text fontSize="sm" fontWeight="bold">Razão Social:</Text>
                    <Text fontSize="sm">{notaFiscal.destinatario.razaoSocial}</Text>
                    
                    <Text fontSize="sm" fontWeight="bold">CNPJ:</Text>
                    <Text fontSize="sm">{formatCNPJ(notaFiscal.destinatario.cnpj)}</Text>
                    
                    <Text fontSize="sm" fontWeight="bold">Inscrição Estadual:</Text>
                    <Text fontSize="sm">{notaFiscal.destinatario.inscricaoEstadual}</Text>
                  </SimpleGrid>
                </Box>
              )}
              
              {/* Transportadora */}
              {notaFiscal.transportadora && (
                <Box borderWidth="1px" borderRadius="md" p={3} borderColor={borderColor}>
                  <Heading as="h4" size="xs" mb={2}>
                    Transportadora
                  </Heading>
                  <SimpleGrid columns={2} spacing={2}>
                    <Text fontSize="sm" fontWeight="bold">Razão Social:</Text>
                    <Text fontSize="sm">{notaFiscal.transportadora.razaoSocial}</Text>
                    
                    <Text fontSize="sm" fontWeight="bold">CNPJ:</Text>
                    <Text fontSize="sm">{formatCNPJ(notaFiscal.transportadora.cnpj)}</Text>
                  </SimpleGrid>
                </Box>
              )}
            </SimpleGrid>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      
      {/* Ações */}
      <Flex justifyContent="flex-end" mt={4}>
        <Button 
          size="md" 
          colorScheme="blue" 
          onClick={() => onSave && onSave(notaFiscal)}
          isDisabled={!todosProdutosCadastrados}
          title={!todosProdutosCadastrados ? "Cadastre todos os produtos antes de salvar" : ""}
        >
          Salvar Nota Fiscal
        </Button>
      </Flex>
    </Box>
  );
};

export default NotaFiscalViewer; 