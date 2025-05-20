import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Heading,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Text,
  Icon,
  useColorModeValue,
  Spinner,
  Badge,
  Flex,
  Container,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
} from '@chakra-ui/react'
import { MdEdit, MdDelete, MdSearch, MdFileDownload } from 'react-icons/md'
import { FiArchive, FiLayers, FiArrowLeft, FiPlus, FiDownload, FiFilePlus } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type SKU = {
  codigo: string;
  descricao: string;
  unidade: string;
  fatorHl: number | string;
  familia: string;
  dataCadastro?: string;
}

type FamiliaForm = {
  nomeFamilia: string;
}

export default function CadastroSKUs() {
  const [currentView, setCurrentView] = useState<'overview' | 'skus' | 'familias'>('overview');
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [familias, setFamilias] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFamilias, setLoadingFamilias] = useState(false);
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSKUs, setFilteredSKUs] = useState<SKU[]>([]);

  const toast = useToast();
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');

  const { register: registerSku, handleSubmit: handleSubmitSku, reset: resetSku, formState: { errors: skuErrors } } = useForm<SKU>();
  const { register: registerFamilia, handleSubmit: handleSubmitFamilia, reset: resetFamilia, formState: { errors: familiaErrors } } = useForm<FamiliaForm>();
  const { register: registerEditSku, handleSubmit: handleSubmitEditSku, reset: resetEditSku, setValue: setEditSkuValue, formState: { errors: editSkuErrors } } = useForm<SKU>();

  // Carregar SKUs do banco de dados
  useEffect(() => {
    const fetchSKUs = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3003/api/skus');
        if (response.ok) {
          const data = await response.json();
          setSKUs(data);
        } else {
          toast({
            title: 'Erro ao carregar SKUs',
            description: 'Não foi possível carregar os SKUs do servidor.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar SKUs:', error);
        toast({
          title: 'Erro de conexão',
          description: 'Não foi possível conectar ao servidor para carregar os SKUs.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSKUs();
  }, [toast]);

  // Carregar famílias do servidor
  useEffect(() => {
    const fetchFamilias = async () => {
      setLoadingFamilias(true);
      try {
        const response = await fetch('http://localhost:3003/api/familias');
        if (response.ok) {
          const data = await response.json();
          setFamilias(data);
        } else {
          console.error('Erro ao carregar famílias:', response.statusText);
          setFamilias(['Cerveja', 'Refrigerante', 'Água', 'Não Alcoólicos', 'Especial', 'Outros']);
        }
      } catch (error) {
        console.error('Erro ao carregar famílias:', error);
        setFamilias(['Cerveja', 'Refrigerante', 'Água', 'Não Alcoólicos', 'Especial', 'Outros']);
      } finally {
        setLoadingFamilias(false);
      }
    };
    
    fetchFamilias();
  }, []);

  // Efeito para filtrar SKUs com base no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSKUs(skus);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = skus.filter(
        sku => 
          sku.codigo.toLowerCase().includes(lowerCaseSearch) ||
          sku.descricao.toLowerCase().includes(lowerCaseSearch) ||
          sku.familia.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredSKUs(filtered);
    }
  }, [searchTerm, skus]);

  const onSkuSubmit = async (data: SKU) => {
    try {
      // Converter fatorHl para número se for string
      const fatorHlNum = typeof data.fatorHl === 'string' 
        ? parseFloat(data.fatorHl.replace(',', '.')) 
        : data.fatorHl;
      
      const skuData = {
        ...data,
        fatorHl: fatorHlNum
      };
      
      const response = await fetch('http://localhost:3003/api/skus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skuData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setSKUs([...skus, result.data]);
    toast({
      title: 'SKU cadastrado com sucesso!',
      status: 'success',
      duration: 3000,
      isClosable: true,
        });
        resetSku();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar SKU');
      }
    } catch (error) {
      console.error('Erro ao cadastrar SKU:', error);
      toast({
        title: 'Erro ao cadastrar SKU',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  const onFamiliaSubmit = (data: FamiliaForm) => {
    if (familias.includes(data.nomeFamilia)) {
      toast({
        title: 'Erro ao cadastrar família',
        description: 'Esta família já existe.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setFamilias([...familias, data.nomeFamilia]);
    toast({
      title: 'Família cadastrada com sucesso!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    resetFamilia();
  };

  const handleEditSku = (codigoSku: string) => {
    const skuToEdit = skus.find(sku => sku.codigo === codigoSku);
    if (skuToEdit) {
      setSelectedSku(skuToEdit);
      // Preencher o formulário com os valores do SKU
      setEditSkuValue('codigo', skuToEdit.codigo);
      setEditSkuValue('descricao', skuToEdit.descricao);
      setEditSkuValue('unidade', skuToEdit.unidade);
      setEditSkuValue('familia', skuToEdit.familia);
      setEditSkuValue('fatorHl', skuToEdit.fatorHl);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateSku = async (data: SKU) => {
    try {
      // Converter fatorHl para número se for string
      const fatorHlNum = typeof data.fatorHl === 'string' 
        ? parseFloat(data.fatorHl.replace(',', '.')) 
        : data.fatorHl;
      
      const updatedSkuData = {
        ...data,
        fatorHl: fatorHlNum
      };
      
      // Simular chamada à API para atualizar o SKU
      // Em um ambiente real, você faria uma requisição PUT/PATCH para o backend
      const updatedSkus = skus.map(sku => 
        sku.codigo === updatedSkuData.codigo ? updatedSkuData : sku
      );
      
      setSKUs(updatedSkus);
      setIsEditModalOpen(false);
      toast({
        title: 'SKU atualizado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar SKU:', error);
      toast({
        title: 'Erro ao atualizar SKU',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteSku = (codigoSku: string) => {
    setSKUs(skus.filter(sku => sku.codigo !== codigoSku));
    toast({ title: `SKU ${codigoSku} excluído.`, status: 'warning', duration: 2000, isClosable: true });
  };

  const handleEditFamilia = (nome: string) => {
    toast({ title: `Editar Família: ${nome}`, status: 'info', duration: 2000, isClosable: true });
  };

  const handleDeleteFamilia = (nome: string) => {
    setFamilias(familias.filter(f => f !== nome));
    setSKUs(skus.map(sku => sku.familia === nome ? { ...sku, familia: 'Não classificado' } : sku));
    toast({ title: `Família ${nome} excluída.`, status: 'warning', duration: 2000, isClosable: true });
  };

  // Formatar valor de HL com vírgula
  const formatHL = (value: number | string) => {
    if (value === undefined || value === null) return '0,00';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    return numValue.toString().replace('.', ',');
  };

  // Função para exportar dados
  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      // Melhor formatação dos dados para exportação
      const dadosFormatados = filteredSKUs.map(sku => ({
        codigo: sku.codigo,
        descricao: sku.descricao,
        familia: sku.familia,
        unidade: sku.unidade,
        fatorHl: formatHL(sku.fatorHl),
        dataCadastro: sku.dataCadastro ? new Date(sku.dataCadastro).toLocaleDateString('pt-BR') : 'N/A'
      }));

      // Criar a data atual formatada para usar no nome do arquivo
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (format === 'csv') {
        // Cabeçalho CSV melhorado
        let csvContent = "Código,Descrição,Família,Unidade,Fator HL,Data de Cadastro\n";
        
        // Dados das linhas
        dadosFormatados.forEach(sku => {
          const row = [
            sku.codigo,
            `"${sku.descricao.replace(/"/g, '""')}"`, // Escapar aspas duplas
            `"${sku.familia}"`,
            sku.unidade,
            sku.fatorHl,
            sku.dataCadastro
          ].join(',');
          
          csvContent += row + "\n";
        });
        
        // Criar e baixar o arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `skus_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Exportação concluída',
          description: 'Dados exportados com sucesso no formato CSV',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } 
      else if (format === 'excel') {
        // Para Excel, usamos CSV com cabeçalho específico
        let csvContent = "sep=,\n"; // Ajuda Excel a entender o separador
        csvContent += "Código,Descrição,Família,Unidade,Fator HL,Data de Cadastro\n";
        
        // Dados das linhas
        dadosFormatados.forEach(sku => {
          const row = [
            sku.codigo,
            `"${sku.descricao.replace(/"/g, '""')}"`, 
            `"${sku.familia}"`,
            sku.unidade,
            sku.fatorHl,
            sku.dataCadastro
          ].join(',');
          
          csvContent += row + "\n";
        });
        
        // Criar e baixar o arquivo com extensão .xls
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `skus_${dateStr}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Exportação concluída',
          description: 'Dados exportados com sucesso no formato Excel',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } 
      else if (format === 'pdf') {
        // Criar PDF com jsPDF
        // @ts-ignore - necessário pois o jspdf-autotable adiciona método não tipado
        const doc = new jsPDF();

        // Título do documento
        doc.setFontSize(18);
        doc.text("Relatório de SKUs Cadastrados", 14, 22);
        
        // Informações do relatório
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
        doc.text(`Total de SKUs: ${filteredSKUs.length}`, 14, 37);
        
        // Mostrar filtro aplicado se houver termo de busca
        if (searchTerm) {
          doc.text(`Filtro aplicado: "${searchTerm}"`, 14, 44);
        }
        
        // Definir cabeçalhos da tabela
        const headers = [
          'Código', 
          'Descrição', 
          'Família', 
          'Unidade', 
          'Fator HL'
        ];
        
        // Preparar dados para a tabela
        const data = dadosFormatados.map(sku => [
          sku.codigo,
          sku.descricao.length > 35 ? sku.descricao.substring(0, 35) + '...' : sku.descricao,
          sku.familia,
          sku.unidade,
          sku.fatorHl
        ]);
        
        // Criar tabela no PDF
        // @ts-ignore
        doc.autoTable({
          head: [headers],
          body: data,
          startY: searchTerm ? 50 : 44,
          headStyles: { fillColor: [66, 139, 202] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          styles: { overflow: 'linebreak', cellWidth: 'auto' },
          columnStyles: { 
            0: { cellWidth: 25 },
            1: { cellWidth: 'auto' }, 
            2: { cellWidth: 35 }, 
            3: { cellWidth: 20 }, 
            4: { cellWidth: 25 }
          }
        });
        
        // Adicionar rodapé com número de página
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          // Add logo text in the footer
          doc.setTextColor('#00AEEF');
          doc.setFont('helvetica', 'bold');
          doc.text(
            `Página ${i} de ${pageCount} - NFSys`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
          doc.setTextColor(100, 100, 100);
        }
        
        // Salvar o PDF
        doc.save(`skus_${dateStr}.pdf`);
        
        toast({
          title: 'Exportação concluída',
          description: 'Dados exportados com sucesso no formato PDF',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderOverview = () => (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
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
      >
        <CardHeader pb={1}>
          <HStack>
            <Icon as={FiArchive} w={5} h={5} color="blue.500" />
            <Heading size="sm">Gerenciar SKUs</Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={1}>
          <VStack align="start" spacing={1} mb={3}>
            <Text fontSize="xs" color="gray.600">Cadastre novos produtos e variações (SKUs) no sistema.</Text>
            <Text fontSize="xs" color="gray.600">Visualize, edite ou remova SKUs existentes.</Text>
          </VStack>
          <Button colorScheme="blue" onClick={() => setCurrentView('skus')} leftIcon={<FiPlus />} width="full" size="sm">
            Gerenciar SKUs
          </Button>
        </CardBody>
      </Card>

      <Card 
        borderWidth="1px" 
        borderRadius="lg" 
        borderColor={cardBorderColor} 
        boxShadow="sm"
        transition="all 0.3s ease"
        _hover={{ 
          transform: "translateY(-4px)", 
          boxShadow: "md", 
          borderColor: "teal.300" 
        }}
      >
        <CardHeader pb={1}>
          <HStack>
            <Icon as={FiLayers} w={5} h={5} color="teal.500" />
            <Heading size="sm">Gerenciar Famílias de Produtos</Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={1}>
          <VStack align="start" spacing={1} mb={3}>
            <Text fontSize="xs" color="gray.600">Defina as categorias ou famílias para organizar seus SKUs.</Text>
            <Text fontSize="xs" color="gray.600">Crie, edite ou remova famílias de produtos.</Text>
          </VStack>
          <Button colorScheme="teal" onClick={() => setCurrentView('familias')} leftIcon={<FiPlus />} width="full" size="sm">
            Gerenciar Famílias
          </Button>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  const renderSKUManagement = () => (
    <Box>
      <Button onClick={() => setCurrentView('overview')} leftIcon={<FiArrowLeft />} mb={6} variant="outline">
        Voltar
      </Button>
      <Tabs variant="soft-rounded" colorScheme="blue" defaultIndex={0}>
        <TabList mb={6}>
          <Tab>Cadastrar SKU</Tab>
          <Tab>Visualizar SKUs</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Card>
              <CardHeader><Heading size="md">Cadastrar Novo SKU</Heading></CardHeader>
              <CardBody>
                <VStack as="form" spacing={4} onSubmit={handleSubmitSku(onSkuSubmit)}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Código do SKU</FormLabel>
                    <Input placeholder="Ex: XYZ600" {...registerSku('codigo', { required: 'Código é obrigatório' })} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Descrição</FormLabel>
                    <Input placeholder="Ex: Cerveja XYZ 600ml" {...registerSku('descricao', { required: 'Descrição é obrigatória' })} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Unidade</FormLabel>
                    <Select placeholder="Selecione uma unidade" {...registerSku('unidade', { required: 'Unidade é obrigatória' })}>
                      <option value="UN">Unidade</option>
                      <option value="CX">Caixa</option>
                      <option value="FAR">Fardo</option>
                      <option value="L">Litro</option>
                      <option value="ML">Mililitro</option>
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Família</FormLabel>
                    <Select 
                      placeholder="Selecione uma família" 
                      {...registerSku('familia', { required: 'Família é obrigatória' })}
                      isDisabled={loadingFamilias}
                    >
                      {loadingFamilias ? (
                        <option value="">Carregando...</option>
                      ) : (
                        familias.sort().map((familia) => (
                          <option key={familia} value={familia}>{familia}</option>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Fator HL (por unidade)</FormLabel>
                    <Input 
                      placeholder="Ex: 0,06 para 600ml" 
                      {...registerSku('fatorHl', { required: 'Fator HL é obrigatório' })}
                      type="text"
                      onChange={(e) => {
                        // Aceita somente números e vírgula
                        const value = e.target.value.replace(/[^0-9,]/g, '');
                        e.target.value = value;
                      }}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Use vírgula como separador decimal. Ex: 0,06
                    </Text>
                  </FormControl>
                  <Button type="submit" colorScheme="blue" size="md" width="full">Cadastrar SKU</Button>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          <TabPanel p={0}>
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">SKUs Cadastrados</Heading>
                  <Menu>
                    <Tooltip label="Exportar dados">
                      <MenuButton
                        as={Button}
                        size="sm"
                        leftIcon={<Icon as={FiDownload} />}
                        colorScheme="blue"
                        variant="outline"
                      >
                        Exportar
                      </MenuButton>
                    </Tooltip>
                    <MenuList>
                      <MenuItem 
                        icon={<Icon as={FiFilePlus} />}
                        onClick={() => exportData('csv')}
                      >
                        Exportar como CSV
                      </MenuItem>
                      <MenuItem 
                        icon={<Icon as={FiFilePlus} />}
                        onClick={() => exportData('excel')}
                      >
                        Exportar como Excel
                      </MenuItem>
                      <MenuItem 
                        icon={<Icon as={MdFileDownload} />}
                        onClick={() => exportData('pdf')}
                      >
                        Exportar como PDF
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <Flex justify="center" align="center" py={10}>
                    <Spinner size="xl" color="blue.500" thickness="4px" />
                  </Flex>
                ) : skus.length === 0 ? (
                  <Box textAlign="center" py={8}>
                    <Text color="gray.500">Nenhum SKU cadastrado ainda.</Text>
                  </Box>
                ) : (
                  <Box>
                    {/* Campo de busca */}
                    <Box mb={4}>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={MdSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input 
                          placeholder="Buscar por código, descrição ou família..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          size="md"
                        />
                      </InputGroup>
                    </Box>
                    
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Código</Th>
                            <Th>Descrição</Th>
                            <Th>Família</Th>
                            <Th>Unidade</Th>
                            <Th isNumeric>Fator HL</Th>
                            <Th>Ações</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredSKUs.map((sku) => (
                            <Tr key={sku.codigo}>
                              <Td><Badge colorScheme="blue">{sku.codigo}</Badge></Td>
                              <Td>{sku.descricao}</Td>
                              <Td>{sku.familia}</Td>
                              <Td>{sku.unidade}</Td>
                              <Td isNumeric>{formatHL(sku.fatorHl)}</Td>
                              <Td>
                                <HStack spacing={1}>
                                  <IconButton aria-label="Editar SKU" icon={<MdEdit />} size="xs" colorScheme="yellow" variant="ghost" onClick={() => handleEditSku(sku.codigo)} />
                                  <IconButton aria-label="Excluir SKU" icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeleteSku(sku.codigo)} />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );

  const renderFamiliaManagement = () => (
    <Box>
      <Button onClick={() => setCurrentView('overview')} leftIcon={<FiArrowLeft />} mb={6} variant="outline">
        Voltar
      </Button>
      <Tabs variant="soft-rounded" colorScheme="teal" defaultIndex={0}>
        <TabList mb={6}>
          <Tab>Cadastrar Família</Tab>
          <Tab>Visualizar Famílias</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Card>
              <CardHeader><Heading size="md">Cadastrar Nova Família</Heading></CardHeader>
              <CardBody>
                <VStack as="form" spacing={4} onSubmit={handleSubmitFamilia(onFamiliaSubmit)}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Nome da Família</FormLabel>
                    <Input placeholder="Ex: Cervejas Especiais" {...registerFamilia('nomeFamilia', { required: 'Nome é obrigatório' })} />
                  </FormControl>
                  <Button type="submit" colorScheme="teal" size="md" width="full">Salvar Família</Button>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          <TabPanel p={0}>
            <Card>
              <CardHeader><Heading size="md">Famílias Cadastradas</Heading></CardHeader>
              <CardBody>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead><Tr><Th>Nome da Família</Th><Th>Ações</Th></Tr></Thead>
                    <Tbody>
                      {familias.sort().map((familia) => (
                        <Tr key={familia}>
                          <Td>{familia}</Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton aria-label="Editar Família" icon={<MdEdit />} size="xs" colorScheme="yellow" variant="ghost" onClick={() => handleEditFamilia(familia)} />
                              <IconButton aria-label="Excluir Família" icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeleteFamilia(familia)} />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );

  return (
    <Box>
      <Heading mb={6} size="md" fontWeight="semibold">
        Gestão de SKUs e Famílias
      </Heading>
      {currentView === 'overview' && renderOverview()}
      {currentView === 'skus' && renderSKUManagement()}
      {currentView === 'familias' && renderFamiliaManagement()}

      {/* Modal de Edição de SKU */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar SKU</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSku && (
              <VStack as="form" spacing={4} onSubmit={handleSubmitEditSku(handleUpdateSku)}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Código do SKU</FormLabel>
                  <Input placeholder="Ex: XYZ600" {...registerEditSku('codigo')} readOnly />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Descrição</FormLabel>
                  <Input placeholder="Ex: Cerveja XYZ 600ml" {...registerEditSku('descricao', { required: 'Descrição é obrigatória' })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Unidade</FormLabel>
                  <Select placeholder="Selecione uma unidade" {...registerEditSku('unidade', { required: 'Unidade é obrigatória' })}>
                    <option value="UN">Unidade</option>
                    <option value="CX">Caixa</option>
                    <option value="FAR">Fardo</option>
                    <option value="L">Litro</option>
                    <option value="ML">Mililitro</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Família</FormLabel>
                  <Select 
                    placeholder="Selecione uma família" 
                    {...registerEditSku('familia', { required: 'Família é obrigatória' })}
                    isDisabled={loadingFamilias}
                  >
                    {loadingFamilias ? (
                      <option value="">Carregando...</option>
                    ) : (
                      familias.sort().map((familia) => (
                        <option key={familia} value={familia}>{familia}</option>
                      ))
                    )}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Fator HL (por unidade)</FormLabel>
                  <Input 
                    placeholder="Ex: 0,06 para 600ml" 
                    {...registerEditSku('fatorHl', { required: 'Fator HL é obrigatório' })}
                    type="text"
                    onChange={(e) => {
                      // Aceita somente números e vírgula
                      const value = e.target.value.replace(/[^0-9,]/g, '');
                      e.target.value = value;
                    }}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Use vírgula como separador decimal. Ex: 0,06
                  </Text>
                </FormControl>
                <Button type="submit" colorScheme="blue" size="md" width="full" mt={2}>Salvar Alterações</Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
} 