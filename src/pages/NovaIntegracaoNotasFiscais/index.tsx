import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  useToast,
  VStack,
  Button,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Progress,
  Badge,
  useDisclosure,
  SimpleGrid,
  Spinner,
  Icon,
  Card,
  CardBody,
  HStack
} from '@chakra-ui/react';
import { FiArrowLeft, FiCheckCircle, FiAlertCircle, FiPlusCircle } from 'react-icons/fi';

import NFeUploader from '../../components/NFeUploader';
import NotaFiscalViewer from '../../components/NotaFiscalViewer';

interface ProdutoNF {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  hl: number;
  cadastrado?: boolean;
}

interface NotaFiscalData {
  numero: string;
  serie: string;
  dataEmissao: string;
  valorTotal: number;
  chaveAcesso: string;
  emitente: {
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
    endereco: string;
  };
  destinatario?: {
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
  };
  transportadora?: {
    razaoSocial: string;
    cnpj: string;
  };
  volumeTotal: number;
  produtos: ProdutoNF[];
}

interface ProdutoCadastro {
  codigo: string;
  descricao: string;
  unidade: string;
  fatorHl: number | string;
  familia: string;
}

const NovaIntegracaoNotasFiscais: React.FC = () => {
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscalData | null>(null);
  const [produtosPendentes, setProdutosPendentes] = useState<ProdutoNF[]>([]);
  const [produtoAtual, setProdutoAtual] = useState<ProdutoNF | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [progressoVerificacao, setProgressoVerificacao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [familias, setFamilias] = useState<string[]>([]);
  const [carregandoFamilias, setCarregandoFamilias] = useState(false);
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [novoProduto, setNovoProduto] = useState<ProdutoCadastro>({
    codigo: '',
    descricao: '',
    unidade: '',
    fatorHl: 0,
    familia: 'Não classificado'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para carregar SKUs e atualizar o cache local ao iniciar a página
  useEffect(() => {
    const atualizarCacheSKUs = async () => {
      try {
        console.log("Atualizando cache de SKUs em segundo plano...");
        const response = await fetch('http://localhost:3003/api/skus');
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('skus_cache', JSON.stringify(data));
          console.log(`Cache de SKUs atualizado automaticamente com ${data.length} itens`);
        } else {
          console.error("Erro ao buscar SKUs para cache:", response.statusText);
        }
      } catch (error) {
        console.error("Erro ao atualizar cache de SKUs:", error);
      }
    };

    atualizarCacheSKUs();
  }, []);
  
  // Carregar a lista de famílias disponíveis
  useEffect(() => {
    const carregarFamilias = async () => {
      setCarregandoFamilias(true);
      try {
        const response = await fetch('http://localhost:3003/api/familias');
        if (response.ok) {
          const data = await response.json();
          setFamilias(data);
        } else {
          console.error('Erro ao carregar famílias:', response.statusText);
          // Configurar uma lista padrão em caso de erro
          setFamilias(['Cerveja', 'Refrigerante', 'Água', 'Não Alcoólicos', 'Especial', 'Outros']);
        }
      } catch (error) {
        console.error('Erro ao carregar famílias:', error);
        // Configurar uma lista padrão em caso de erro
        setFamilias(['Cerveja', 'Refrigerante', 'Água', 'Não Alcoólicos', 'Especial', 'Outros']);
      } finally {
        setCarregandoFamilias(false);
      }
    };
    
    carregarFamilias();
  }, []);

  const handleProcessedData = async (data: NotaFiscalData) => {
    // SOLUÇÃO: Buscar todos os SKUs do backend para obter os fatores de HL corretos
    try {
      // Primeiro reconhecemos quais produtos estão cadastrados
      const skusResponse = await fetch('http://localhost:3003/api/skus');
      let skusCadastrados: any[] = [];
      
      if (skusResponse.ok) {
        skusCadastrados = await skusResponse.json();
        console.log(`Obtidos ${skusCadastrados.length} SKUs do cadastro`);
      } else {
        console.error("Erro ao buscar SKUs cadastrados", skusResponse.statusText);
        toast({
          title: "Atenção",
          description: "Não foi possível obter os SKUs cadastrados do sistema. Os cálculos de HL podem estar incorretos.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Calcular o HL para cada produto com base no SKU cadastrado
      const produtosComStatus = data.produtos.map(produto => {
        // Extrair os 6 primeiros dígitos do código para comparação
        const codigoNumerico = produto.codigo.replace(/\D/g, '');
        
        // Buscar o SKU correspondente no cadastro (baseado apenas nos dígitos numéricos)
        const skuEncontrado = skusCadastrados.find(sku => {
          const skuCodigoNumerico = sku.codigo.replace(/\D/g, '');
          return skuCodigoNumerico.includes(codigoNumerico) || codigoNumerico.includes(skuCodigoNumerico);
        });
        
        let hlCalculado = 0;
        let produtoEstaRegistrado = false;
        
        if (skuEncontrado) {
          produtoEstaRegistrado = true;
          // Calcular HL usando o fator do cadastro
          hlCalculado = produto.quantidade * skuEncontrado.fatorHl;
          console.log(`Produto ${produto.codigo}: Calculando HL = ${produto.quantidade} x ${skuEncontrado.fatorHl} = ${hlCalculado}`);
        } else {
          console.log(`Produto ${produto.codigo}: Não encontrado no cadastro`);
        }
        
        return {
          ...produto,
          cadastrado: produtoEstaRegistrado,
          hl: hlCalculado // Atualizar o valor de HL
        };
      });

      // Calcular volume total
      const volumeTotal = produtosComStatus.reduce((total, produto) => total + produto.hl, 0);

      // Atualizar a nota fiscal com produtos marcados e HL calculado
      const notaFiscalAtualizada = {
        ...data,
        produtos: produtosComStatus,
        volumeTotal: volumeTotal // Atualizar volume total em HL
      };
      
      setNotaFiscal(notaFiscalAtualizada);
      
      // Atualizar lista de produtos pendentes
      const pendentes = produtosComStatus.filter(p => !p.cadastrado);
      setProdutosPendentes(pendentes);
      
      // Exibir mensagem de verificação concluída
      if (pendentes.length > 0) {
        toast({
          title: "Atenção: Produtos não cadastrados",
          description: `Foram encontrados ${pendentes.length} produtos que não estão cadastrados no sistema. Clique no ícone "+" para cadastrá-los.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Verificação concluída",
          description: "Todos os produtos foram identificados no sistema.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Erro ao processar dados:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar os dados da nota fiscal.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    setErro(null);
    
    // Rolar para o topo quando os dados são processados
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verificação real de produto no backend
  const verificarProdutoNoBackend = async (codigo: string): Promise<boolean> => {
    try {
      // Extrair apenas os dígitos numéricos do código
      const apenasNumeros = codigo.replace(/\D/g, '');
      
      const skusResponse = await fetch('http://localhost:3003/api/skus');
      if (skusResponse.ok) {
        const skusData = await skusResponse.json();
        
        // Verificar se QUALQUER SKU contém os mesmos números
        const encontrado = skusData.some((sku: any) => {
          const skuNumeros = sku.codigo.replace(/\D/g, '');
          return skuNumeros === apenasNumeros;
        });
        
        console.log(`Verificação do produto ${codigo}: ${encontrado ? 'Encontrado' : 'Não encontrado'}`);
        return encontrado;
      }
      
      return false;
    } catch (error) {
      console.error(`Erro ao verificar produto ${codigo}:`, error);
      return false;
    }
  };

  // Calcular fator HL com base na quantidade e HL total do produto
  const calcularFatorHl = (produto: ProdutoNF): number => {
    if (!produto.quantidade || produto.quantidade === 0) return 0;
    return produto.hl / produto.quantidade;
  };

  // Calcular HL estimado com base no novo fator
  const calcularHlEstimado = (fatorHl: number | string, quantidade: number): number => {
    const fatorNumerico = typeof fatorHl === 'string' 
      ? parseFloat(fatorHl.replace(',', '.')) 
      : fatorHl;
      
    return quantidade * fatorNumerico;
  };

  // Nova função para abrir o modal de cadastro quando o usuário clicar no ícone
  const abrirModalCadastro = (produto: ProdutoNF) => {
    setProdutoAtual(produto);
    setNovoProduto({
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidade: produto.unidade,
      fatorHl: calcularFatorHl(produto),
      familia: 'Não classificado' // Valor padrão
    });
    onOpen();
  };

  const cadastrarProduto = async () => {
    if (!produtoAtual) return;
    
    try {
      // Preparar os dados para envio - converter fatorHl de string para número se necessário
      const fatorHlNumerico = typeof novoProduto.fatorHl === 'string' 
        ? parseFloat(novoProduto.fatorHl.replace(',', '.')) 
        : novoProduto.fatorHl;
      
      const produtoData = {
        codigo: novoProduto.codigo,
        descricao: novoProduto.descricao,
        unidade: novoProduto.unidade,
        fatorHl: fatorHlNumerico,
        familia: novoProduto.familia
      };
      
      console.log("Enviando produto para cadastro:", produtoData);
      
      // Chamada real para o backend
      const response = await fetch('http://localhost:3003/api/skus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(produtoData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar o produto no sistema');
      }
      
      const responseData = await response.json();
      console.log("Resposta do cadastro:", responseData);
      
      // Atualizar o cache local de SKUs após cadastrar um novo
      try {
        const skusCacheStr = localStorage.getItem('skus_cache');
        let skusCache = [];
        
        if (skusCacheStr) {
          skusCache = JSON.parse(skusCacheStr);
        }
        
        // Adicionar o novo SKU ao cache ou atualizar se já existir
        const skuIndex = skusCache.findIndex((sku: any) => sku.codigo === produtoData.codigo);
        if (skuIndex >= 0) {
          skusCache[skuIndex] = { ...skusCache[skuIndex], ...produtoData };
        } else {
          skusCache.push(produtoData);
        }
        
        localStorage.setItem('skus_cache', JSON.stringify(skusCache));
        console.log("Cache local de SKUs atualizado");
      } catch (cacheError) {
        console.warn("Erro ao atualizar cache de SKUs:", cacheError);
        // Não interromper o fluxo se o cache falhar
      }
      
      toast({
        title: "Produto cadastrado",
        description: `O produto ${novoProduto.descricao} foi cadastrado com sucesso!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Remover produto da lista de pendentes
      const novosPendentes = produtosPendentes.filter(p => p.codigo !== produtoAtual.codigo);
      setProdutosPendentes(novosPendentes);
      
      // Atualizar status do produto na nota fiscal e recalcular HL
      if (notaFiscal) {
        const produtosAtualizados = notaFiscal.produtos.map(p => {
          if (p.codigo === produtoAtual.codigo) {
            // Calcular HL baseado no fator de conversão cadastrado
            const novoHL = p.quantidade * fatorHlNumerico;
            return { 
              ...p, 
              cadastrado: true,
              hl: novoHL // Atualizar o valor de HL
            };
          }
          return p;
        });
        
        // Recalcular o volume total em HL
        const novoVolumeTotal = produtosAtualizados.reduce((total, p) => total + p.hl, 0);
        
        // Atualizar a nota fiscal com os novos valores
        setNotaFiscal({
          ...notaFiscal,
          produtos: produtosAtualizados,
          volumeTotal: novoVolumeTotal
        });
      }
      
      // Fechar o modal
      onClose();
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Não foi possível cadastrar o produto. Tente novamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSaveNotaFiscal = async (data: NotaFiscalData) => {
    // Verificar se todos os produtos estão cadastrados
    const todosCadastrados = data.produtos.every(p => p.cadastrado === true);
    
    if (!todosCadastrados) {
      toast({
        title: "Ação necessária",
        description: "Você precisa cadastrar todos os produtos antes de salvar a nota fiscal.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setSalvando(true);
    setErro(null);
    
    try {
      // Corrigido para usar a porta correta e incluir cabeçalhos apropriados
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3003/api/notas-fiscais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao salvar nota fiscal');
      }
      
      toast({
        title: "Nota fiscal salva com sucesso!",
        description: `A nota fiscal ${data.numero} foi salva no sistema.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Redirecionar para o dashboard após salvar com sucesso
      setTimeout(() => {
        window.location.href = '/dashboard'; // Redireciona para o dashboard
      }, 2000);
      
      // Limpar dados após salvar
      setNotaFiscal(null);
      setProdutosPendentes([]);
    } catch (error) {
      console.error("Erro ao salvar nota fiscal:", error);
      setErro((error as Error).message || "Erro ao salvar a nota fiscal no sistema");
      
      toast({
        title: "Erro ao salvar",
        description: (error as Error).message || "Não foi possível salvar a nota fiscal no sistema. Tente novamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleClear = () => {
    setNotaFiscal(null);
    setProdutosPendentes([]);
    setProdutoAtual(null);
    setErro(null);
  };

  return (
    <Container maxW="container.xl" py={3}>
      <Heading as="h1" size="md" mb={2}>
        Integração de Notas Fiscais
      </Heading>
      <Text mb={3} color="gray.600" fontSize="sm">
        Faça upload de arquivos XML de Notas Fiscais para importá-los ao sistema.
      </Text>
      
      {erro && (
        <Alert status="error" mb={3} borderRadius="md" size="sm">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="sm">Erro</AlertTitle>
            <AlertDescription fontSize="xs">{erro}</AlertDescription>
          </Box>
        </Alert>
      )}
      
      {verificando && (
        <Box mb={3} p={2} borderWidth="1px" borderRadius="lg" borderColor="blue.300" bg="blue.50">
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontWeight="medium" color="blue.600" fontSize="sm">Verificando produtos...</Text>
            <Text fontSize="xs" color="blue.600">{progressoVerificacao}%</Text>
          </Flex>
          <Progress value={progressoVerificacao} size="xs" colorScheme="blue" borderRadius="md" />
        </Box>
      )}
      
      {notaFiscal ? (
        // Exibir os detalhes da nota fiscal
        <Box>
          <Flex justify="space-between" align="center" mb={3}>
            <IconButton
              aria-label="Voltar"
              icon={<FiArrowLeft />}
              variant="outline"
              onClick={handleClear}
              size="sm"
            />
            <Text fontWeight="medium" fontSize="sm">
              Nota Fiscal: {notaFiscal.numero} | Emitente: {notaFiscal.emitente.razaoSocial}
            </Text>
            
            {produtosPendentes.length > 0 && (
              <Badge colorScheme="yellow" fontSize="xs" py={1} px={2}>
                {produtosPendentes.length} produtos pendentes de cadastro
              </Badge>
            )}
          </Flex>
          
          <NotaFiscalViewer 
            notaFiscal={notaFiscal} 
            onSave={handleSaveNotaFiscal} 
            onCadastrarProduto={abrirModalCadastro}
          />
        </Box>
      ) : (
        // Layout simplificado com apenas o uploader
        <Box maxW="600px" mx="auto">
          <Card>
            <CardBody p={3}>
              <VStack spacing={2} align="start">
                <Heading size="xs">Selecione o arquivo XML da NF-e</Heading>
                <Text fontSize="xs" color="gray.600">
                  Selecione o arquivo XML da NF-e para iniciar o processamento.
                </Text>
                <NFeUploader onProcessedData={handleProcessedData} />
                
                <Divider my={2} />
                
                <Text fontSize="xs" color="gray.500">
                  Esta integração foi desenvolvida para processar XMLs de Notas Fiscais Eletrônicas (NF-e) padrão SEFAZ.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      )}
      
      {/* Modal para cadastro de produto */}
      <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size="md" isCentered>
        <ModalOverlay />
        <ModalContent maxW="450px">
          <ModalHeader bg="blue.50" py={2} borderTopRadius="md">
            <Flex align="center">
              <Icon as={FiAlertCircle} color="blue.500" mr={2} boxSize={5} />
              Produto não encontrado
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={4} py={3}>
            {produtoAtual && (
              <>
                <SimpleGrid columns={2} spacing={3} mb={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">Código</FormLabel>
                    <Input 
                      size="md"
                      value={novoProduto.codigo} 
                      isReadOnly
                      bg="gray.50"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm">Unidade</FormLabel>
                    <Select 
                      size="md"
                      value={novoProduto.unidade} 
                      onChange={(e) => setNovoProduto({...novoProduto, unidade: e.target.value})}
                    >
                      <option value="UN">Unidade</option>
                      <option value="CX">Caixa</option>
                      <option value="PAC">Pacote</option>
                      <option value="FAR">Fardo</option>
                      <option value="L">Litro</option>
                      <option value="ML">Mililitro</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                
                <FormControl mb={3}>
                  <FormLabel fontSize="sm">Descrição</FormLabel>
                  <Input 
                    size="md"
                    value={novoProduto.descricao} 
                    onChange={(e) => setNovoProduto({...novoProduto, descricao: e.target.value})}
                  />
                </FormControl>
                
                <SimpleGrid columns={2} spacing={3} mb={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">Família</FormLabel>
                    <Select 
                      size="md"
                      value={novoProduto.familia} 
                      onChange={(e) => setNovoProduto({...novoProduto, familia: e.target.value})}
                      isDisabled={carregandoFamilias}
                    >
                      {carregandoFamilias ? (
                        <option value="">Carregando...</option>
                      ) : (
                        familias.map((familia, index) => (
                          <option key={index} value={familia}>{familia}</option>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm">Fator de Conversão HL</FormLabel>
                    <Input 
                      size="md"
                      placeholder="Ex: 0,042"
                      value={typeof novoProduto.fatorHl === 'number' ? 
                        novoProduto.fatorHl.toString().replace('.', ',') : 
                        novoProduto.fatorHl || ''}
                      onChange={(e) => {
                        // Permitir apenas dígitos e vírgula
                        let inputValue = e.target.value;
                        
                        // Substituir ponto por vírgula, caso usuário digite ponto
                        inputValue = inputValue.replace('.', ',');
                        
                        // Filtrar caracteres não permitidos (apenas números e vírgula)
                        inputValue = inputValue.replace(/[^\d,]/g, '');
                        
                        // Garantir que haja apenas uma vírgula
                        const parts = inputValue.split(',');
                        if (parts.length > 2) {
                          inputValue = parts[0] + ',' + parts.slice(1).join('');
                        }
                        
                        // Atualizar o estado
                        setNovoProduto({
                          ...novoProduto,
                          fatorHl: inputValue === '' ? 0 : inputValue
                        });
                      }}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Valor sugerido: {calcularFatorHl(produtoAtual).toString().replace('.', ',')}
                    </Text>
                  </FormControl>
                </SimpleGrid>
                
                <Box borderWidth="1px" borderRadius="md" p={3} borderColor="gray.200" bg="gray.50" mb={3}>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Dados do Produto</Text>
                  <Flex mb={2}>
                    <Box width="50%">
                      <Text fontSize="xs" color="gray.600">Quantidade na NF:</Text>
                      <Text fontSize="sm" fontWeight="medium">{produtoAtual.quantidade} {produtoAtual.unidade}</Text>
                    </Box>
                    <Box width="50%">
                      <Text fontSize="xs" color="gray.600">Volume Estimado:</Text>
                      <Text fontSize="md" fontWeight="bold" color="blue.600">
                        {calcularHlEstimado(novoProduto.fatorHl, produtoAtual.quantidade).toFixed(2).replace('.', ',')} HL
                      </Text>
                    </Box>
                  </Flex>
                  <Text fontSize="xs" color="blue.600">
                    O volume estimado é calculado multiplicando a quantidade pelo fator de conversão.
                  </Text>
                </Box>
              </>
            )}
          </ModalBody>

          <ModalFooter borderTop="1px" borderColor="gray.200" py={2}>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={cadastrarProduto}>
              Cadastrar Produto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default NovaIntegracaoNotasFiscais; 