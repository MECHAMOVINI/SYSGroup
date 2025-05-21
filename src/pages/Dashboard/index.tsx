import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Heading,
  HStack,
  Button,
  Flex,
  Tag,
  TagLeftIcon,
  TagLabel,
  Text,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Badge,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  List,
  ListItem,
  Circle,
  VStack,
  Spinner,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  Stack,
  Tooltip,
  useToast,
  RadioGroup,
  Radio,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import {
  MdCalendarToday,
  MdClear,
  MdFactory,
  MdSearch,
  MdFilterList,
  MdLocalShipping,
  MdFileDownload,
  MdDelete,
} from 'react-icons/md'
import { FiChevronDown, FiFilter, FiDownload, FiFilePlus } from 'react-icons/fi'
import { LuEye } from 'react-icons/lu'
import { BiCategoryAlt } from 'react-icons/bi'
import { BsBox } from 'react-icons/bs'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import NotaFiscalViewer from '../../components/NotaFiscalViewer'

// No início do arquivo, adicione uma constante para a URL da API
const API_URL = '/api';

// Tipo para os dados da NF, para clareza
interface NfDetalhe {
  id: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  dataCadastro: string;
  valorTotal: number;
  status?: string;
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
  produtos: Array<{
    codigo: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    hl: number;
    cadastrado?: boolean;
    familia?: string;
  }>;
  volumeTotal: number;
}

export default function Dashboard() {
  const { isOpen: isDetalhesOpen, onOpen: onDetalhesOpen, onClose: onDetalhesClose } = useDisclosure();
  const { isOpen: isFilterDrawerOpen, onOpen: onFilterDrawerOpen, onClose: onFilterDrawerClose } = useDisclosure();
  const [selectedNf, setSelectedNf] = useState<NfDetalhe | null>(null);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [notasFiscais, setNotasFiscais] = useState<NfDetalhe[]>([]);
  const [notasFiscaisFiltradas, setNotasFiscaisFiltradas] = useState<NfDetalhe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchProduto, setSearchProduto] = useState("");
  const toast = useToast();
  
  // Estado para confirmação de exclusão
  const [nfToDelete, setNfToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { 
    isOpen: isDeleteConfirmOpen, 
    onOpen: onDeleteConfirmOpen, 
    onClose: onDeleteConfirmClose 
  } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  // Estados para os filtros
  const [periodoFiltro, setPeriodoFiltro] = useState("30");
  const [familiaFiltro, setFamiliaFiltro] = useState("");
  const [produtoFiltro, setProdutoFiltro] = useState("");
  const [fabricaFiltro, setFabricaFiltro] = useState("");
  const [transportadoraFiltro, setTransportadoraFiltro] = useState("");
  
  // Listas de opções para filtros (serão preenchidas dinamicamente)
  const [familias, setFamilias] = useState<string[]>([]);
  const [produtos, setProdutos] = useState<{codigo: string, descricao: string}[]>([]);
  const [fabricas, setFabricas] = useState<{razaoSocial: string, cnpj: string}[]>([]);
  const [transportadoras, setTransportadoras] = useState<{razaoSocial: string, cnpj: string}[]>([]);

  // Dados para os gráficos baseados nas notas fiscais
  const [dadosGraficoArea, setDadosGraficoArea] = useState<any[]>([]);
  const [dadosGraficoBarras, setDadosGraficoBarras] = useState<any[]>([]);

  useEffect(() => {
    const carregarNotasFiscais = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/notas-fiscais`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar notas fiscais: ${response.status}`);
        }

        const data = await response.json();
        setNotasFiscais(data);
        setNotasFiscaisFiltradas(data);
        
        // Extrair listas únicas para os filtros
        extrairOpcoesParaFiltros(data);
        
        // Preparar dados para os gráficos
        processarDadosGraficos(data);
      } catch (err) {
        setError(`Falha ao carregar notas fiscais: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        console.error("Erro ao carregar notas fiscais:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarNotasFiscais();
  }, []);
  
  // Extrair opções únicas para os filtros a partir das notas fiscais
  const extrairOpcoesParaFiltros = (notas: NfDetalhe[]) => {
    // Extrair famílias únicas dos produtos
    const familiasUnicas = new Set<string>();
    // Extrair produtos únicos
    const produtosUnicos = new Map<string, {codigo: string, descricao: string}>();
    // Extrair fábricas (emitentes) únicas
    const fabricasUnicas = new Map<string, {razaoSocial: string, cnpj: string}>();
    // Extrair transportadoras únicas
    const transportadorasUnicas = new Map<string, {razaoSocial: string, cnpj: string}>();
    
    notas.forEach(nota => {
      // Adicionar emitente à lista de fábricas
      if (nota.emitente && nota.emitente.cnpj) {
        fabricasUnicas.set(nota.emitente.cnpj, {
          razaoSocial: nota.emitente.razaoSocial,
          cnpj: nota.emitente.cnpj
        });
      }
      
      // Adicionar transportadora se existir
      if (nota.transportadora && nota.transportadora.cnpj) {
        transportadorasUnicas.set(nota.transportadora.cnpj, {
          razaoSocial: nota.transportadora.razaoSocial,
          cnpj: nota.transportadora.cnpj
        });
      }
      
      // Processar produtos
      nota.produtos.forEach(produto => {
        // Adicionar família do produto (se existir)
        if (produto.familia) {
          familiasUnicas.add(produto.familia);
        }
        
        // Adicionar produto à lista de produtos únicos
        produtosUnicos.set(produto.codigo, {
          codigo: produto.codigo,
          descricao: produto.descricao
        });
      });
    });
    
    // Converter os Sets e Maps para arrays e atualizar os estados
    setFamilias(Array.from(familiasUnicas));
    setProdutos(Array.from(produtosUnicos.values()));
    setFabricas(Array.from(fabricasUnicas.values()));
    setTransportadoras(Array.from(transportadorasUnicas.values()));
  };
  
  // Aplicar filtros às notas fiscais
  useEffect(() => {
    if (!notasFiscais.length) return;
    
    let notasFiltradas = [...notasFiscais];
    
    // Filtrar por período (dias)
    if (periodoFiltro) {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - parseInt(periodoFiltro));
      notasFiltradas = notasFiltradas.filter(nota => {
        const dataEmissao = new Date(nota.dataEmissao);
        return dataEmissao >= dataLimite;
      });
    }
    
    // Filtrar por família
    if (familiaFiltro) {
      notasFiltradas = notasFiltradas.filter(nota => 
        nota.produtos.some(produto => produto.familia === familiaFiltro)
      );
    }
    
    // Filtrar por produto
    if (produtoFiltro) {
      notasFiltradas = notasFiltradas.filter(nota => 
        nota.produtos.some(produto => produto.codigo === produtoFiltro)
      );
    }
    
    // Filtrar por fábrica (emitente)
    if (fabricaFiltro) {
      notasFiltradas = notasFiltradas.filter(nota => 
        nota.emitente.cnpj === fabricaFiltro
      );
    }
    
    // Filtrar por transportadora
    if (transportadoraFiltro) {
      notasFiltradas = notasFiltradas.filter(nota => 
        nota.transportadora && nota.transportadora.cnpj === transportadoraFiltro
      );
    }
    
    setNotasFiscaisFiltradas(notasFiltradas);
    
    // Atualizar gráficos com os dados filtrados
    processarDadosGraficos(notasFiltradas);
  }, [notasFiscais, periodoFiltro, familiaFiltro, produtoFiltro, fabricaFiltro, transportadoraFiltro]);

  // Processar dados para gráficos
  const processarDadosGraficos = (notas: NfDetalhe[]) => {
    // Agrupar por mês para o gráfico de área (valores)
    const mesesValores = new Map<string, number>();
    
    // Agrupar por mês para o gráfico de barras (HL)
    const mesesHL = new Map<string, number>();
    
    // Processar cada nota fiscal
    notas.forEach(nota => {
      const dataEmissao = new Date(nota.dataEmissao);
      const mes = dataEmissao.toLocaleString('pt-BR', { month: 'short' });
      
      // Somar ao total de valores por mês
      const valorAtual = mesesValores.get(mes) || 0;
      mesesValores.set(mes, valorAtual + nota.valorTotal);
      
      // Somar ao total de HL por mês
      const hlAtual = mesesHL.get(mes) || 0;
      mesesHL.set(mes, hlAtual + nota.volumeTotal);
    });
    
    // Converter para o formato dos gráficos
    setDadosGraficoArea(
      Array.from(mesesValores.entries()).map(([mes, valor]) => ({
        name: mes,
        value: valor
      }))
    );
    
    setDadosGraficoBarras(
      Array.from(mesesHL.entries()).map(([mes, hl]) => ({
        mes: mes,
        hl: hl
      }))
    );
  };
  
  // Limpar todos os filtros
  const limparFiltros = () => {
    setPeriodoFiltro("30");
    setFamiliaFiltro("");
    setProdutoFiltro("");
    setFabricaFiltro("");
    setTransportadoraFiltro("");
  };

  // Calcular totais para os cards
  const totalNotasFiscais = notasFiscaisFiltradas.length;
  const totalValor = notasFiscaisFiltradas.reduce((acc, nota) => acc + nota.valorTotal, 0);
  const totalHL = notasFiscaisFiltradas.reduce((acc, nota) => acc + nota.volumeTotal, 0);
  
  // Calcular SKUs distintos
  const skusDistintos = new Set<string>();
  notasFiscaisFiltradas.forEach(nota => {
    nota.produtos.forEach(produto => {
      skusDistintos.add(produto.codigo);
    });
  });
  const totalSkusDistintos = skusDistintos.size;

  const nfsVisiveis = notasFiscaisFiltradas.slice(0, itensPorPagina);

  const formatValue = (value: string | number) => {
    const num = Number(value);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace("R$", "").trim();
  };

  const formatHL = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Formatar data ISO para exibição
  const formatarData = (dataISO: string) => {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  };

  // Função para exportar dados das notas fiscais
  const exportarNotasFiscais = (formato: 'csv' | 'excel' | 'pdf') => {
    try {
      // Dados para a exportação com melhor formatação
      const dadosParaExportar = notasFiscaisFiltradas.map(nota => ({
        numero: nota.numero,
        serie: nota.serie,
        dataEmissao: formatarData(nota.dataEmissao),
        dataCadastro: formatarData(nota.dataCadastro),
        emitente: nota.emitente.razaoSocial,
        cnpjEmitente: nota.emitente.cnpj,
        valorTotal: formatValue(nota.valorTotal),
        volumeTotalHL: formatHL(nota.volumeTotal),
        transportadora: nota.transportadora?.razaoSocial || 'Não informada',
        qtdProdutos: nota.produtos.length,
        chaveAcesso: nota.chaveAcesso
      }));

      // Criar data formatada para nome do arquivo
      const data = new Date();
      const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      
      if (formato === 'csv') {
        // Cabeçalho melhorado para CSV
        let csvContent = "Número,Série,Data de Emissão,Data de Cadastro,Emitente,CNPJ Emitente,Valor Total (R$),Volume Total (HL),Transportadora,Qtd. Produtos,Chave de Acesso\n";
        
        // Adicionar cada nota fiscal
        dadosParaExportar.forEach(nota => {
          const row = [
            nota.numero,
            nota.serie,
            nota.dataEmissao,
            nota.dataCadastro,
            `"${nota.emitente.replace(/"/g, '""')}"`,  // Escapar aspas duplas
            nota.cnpjEmitente,
            nota.valorTotal,
            nota.volumeTotalHL,
            `"${nota.transportadora.replace(/"/g, '""')}"`,
            nota.qtdProdutos,
            nota.chaveAcesso
          ].join(',');
          
          csvContent += row + "\n";
        });
        
        // Criar e baixar o arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `notas-fiscais_${dataStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Exportação concluída',
          description: 'Notas fiscais exportadas com sucesso no formato CSV',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } 
      else if (formato === 'excel') {
        // Para Excel, recomendado fazer no servidor, mas podemos usar CSV que o Excel abre
        let csvContent = "sep=,\n"; // Ajuda Excel a entender separador
        csvContent += "Número,Série,Data de Emissão,Data de Cadastro,Emitente,CNPJ Emitente,Valor Total (R$),Volume Total (HL),Transportadora,Qtd. Produtos,Chave de Acesso\n";
        
        dadosParaExportar.forEach(nota => {
          const row = [
            nota.numero,
            nota.serie,
            nota.dataEmissao,
            nota.dataCadastro,
            `"${nota.emitente.replace(/"/g, '""')}"`,
            nota.cnpjEmitente,
            nota.valorTotal,
            nota.volumeTotalHL,
            `"${nota.transportadora.replace(/"/g, '""')}"`,
            nota.qtdProdutos,
            nota.chaveAcesso
          ].join(',');
          
          csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `notas-fiscais_${dataStr}.xls`); // Extensão .xls para Excel abrir automaticamente
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Exportação concluída',
          description: 'Notas fiscais exportadas com sucesso no formato Excel',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      else if (formato === 'pdf') {
        // Criar PDF com jsPDF
        // @ts-ignore - necessário pois o jspdf-autotable adiciona método não tipado
        const doc = new jsPDF();
        
        // Adicionar título
        doc.setFontSize(18);
        doc.text("Relatório de Notas Fiscais", 14, 22);
        
        // Adicionar data de geração
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
        
        // Filtros aplicados
        let filtrosTexto = "Filtros aplicados: ";
        filtrosTexto += periodoFiltro ? `Período (${periodoFiltro} dias), ` : "";
        filtrosTexto += familiaFiltro ? `Família (${familiaFiltro}), ` : "";
        filtrosTexto += produtoFiltro ? `Produto (${produtos.find(p => p.codigo === produtoFiltro)?.descricao}), ` : "";
        filtrosTexto += fabricaFiltro ? `Fábrica (${fabricas.find(f => f.cnpj === fabricaFiltro)?.razaoSocial}), ` : "";
        filtrosTexto += transportadoraFiltro ? `Transportadora (${transportadoras.find(t => t.cnpj === transportadoraFiltro)?.razaoSocial})` : "";
        filtrosTexto = filtrosTexto.endsWith(", ") ? filtrosTexto.slice(0, -2) : filtrosTexto;
        
        if (filtrosTexto === "Filtros aplicados: ") {
          filtrosTexto += "Nenhum";
        }
        
        doc.setFontSize(10);
        doc.text(filtrosTexto, 14, 38);
        
        // Totais
        doc.setFontSize(12);
        doc.text("Totais:", 14, 47);
        doc.setFontSize(10);
        doc.text(`Total de notas: ${totalNotasFiscais}`, 14, 54);
        doc.text(`Valor total: R$ ${formatValue(totalValor)}`, 14, 60);
        doc.text(`Volume total: ${formatHL(totalHL)} HL`, 14, 66);
        
        // Adicionar tabela
        const cabecalho = [
          'Nº NF', 'Série', 'Emissão', 'Emitente', 'Valor (R$)', 'Volume (HL)'
        ];
        
        const dados = dadosParaExportar.map(nota => [
          nota.numero,
          nota.serie,
          nota.dataEmissao,
          nota.emitente.substring(0, 30), // Limitar tamanho para caber na página
          nota.valorTotal,
          nota.volumeTotalHL
        ]);
        
        // @ts-ignore
        doc.autoTable({
          head: [cabecalho],
          body: dados,
          startY: 75,
          headStyles: { fillColor: [66, 139, 202] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          margin: { top: 75 },
          styles: { overflow: 'linebreak', cellWidth: 'auto' },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 15 },
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 }
          }
        });
        
        // Rodapé
        // @ts-ignore - necessário pois o método getNumberOfPages não está tipado corretamente
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
        doc.save(`notas-fiscais_${dataStr}.pdf`);
        
        toast({
          title: 'Exportação concluída',
          description: 'Notas fiscais exportadas com sucesso no formato PDF',
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

  // Função para excluir uma nota fiscal
  const deleteInvoice = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/notas-fiscais/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remover a NF excluída do estado
        setNotasFiscais(notasFiscais.filter(nf => nf.id !== id));
        setNotasFiscaisFiltradas(notasFiscaisFiltradas.filter(nf => nf.id !== id));
        
        // Atualizar gráficos
        processarDadosGraficos(notasFiscais.filter(nf => nf.id !== id));
        
        toast({
          title: 'Nota fiscal excluída',
          description: 'A nota fiscal foi excluída com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir nota fiscal');
      }
    } catch (error) {
      console.error('Erro ao excluir nota fiscal:', error);
      toast({
        title: 'Erro ao excluir nota fiscal',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsDeleting(false);
      onDeleteConfirmClose();
      setNfToDelete(null);
    }
  };

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setNfToDelete(id);
    onDeleteConfirmOpen();
  };

  if (loading) {
    return (
      <Center h="500px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box>
      <HStack mb={6} justify="space-between">
        <Heading size="md" fontWeight="semibold">Dashboard</Heading>
        
        <HStack spacing={2}>
          <Button 
            leftIcon={<MdFilterList />} 
            colorScheme="blue" 
            variant="outline" 
            size="sm"
            onClick={onFilterDrawerOpen}
          >
            Filtros
            {(familiaFiltro || produtoFiltro || fabricaFiltro || transportadoraFiltro || periodoFiltro !== "30") && (
              <Circle size="18px" bg="blue.500" color="white" ml={2} fontSize="xs">
                {[
                  periodoFiltro !== "30" ? 1 : 0,
                  familiaFiltro ? 1 : 0,
                  produtoFiltro ? 1 : 0,
                  fabricaFiltro ? 1 : 0,
                  transportadoraFiltro ? 1 : 0
                ].reduce((a, b) => a + b, 0)}
              </Circle>
            )}
                  </Button>
          
        {(familiaFiltro || produtoFiltro || fabricaFiltro || transportadoraFiltro || periodoFiltro !== "30") && (
          <Button 
            leftIcon={<MdClear />} 
            colorScheme="gray" 
            variant="outline" 
            size="sm"
            onClick={limparFiltros}
          >
              Limpar
        </Button>
        )}
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Card size="sm" borderWidth="1px" borderColor="gray.200" 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "gray.300" 
          }}
        >
          <CardBody p={4}>
            <Flex justify="space-between" align="flex-start">
              <Stat>
                <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">Total de Notas Fiscais</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="bold" color="gray.800">{totalNotasFiscais}</StatNumber>
                <StatHelpText fontSize="xs" color="gray.500">NF-e integradas</StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>

        <Card size="sm" borderWidth="1px" borderColor="gray.200" 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "teal.300" 
          }}
        >
          <CardBody p={4}>
            <Flex justify="space-between" align="flex-start">
              <Stat>
                <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">Valor Total (R$)</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="bold" color="gray.800">R$ {formatValue(totalValor)}</StatNumber>
                <StatHelpText fontSize="xs" color="gray.500">Todas as NF-e</StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>

        <Card size="sm" borderWidth="1px" borderColor="gray.200" 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "purple.300" 
          }}
        >
          <CardBody p={4}>
            <Flex justify="space-between" align="flex-start">
              <Stat>
                <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">Volume Total (HL)</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="bold" color="gray.800">{formatHL(totalHL)} HL</StatNumber>
                <StatHelpText fontSize="xs" color="gray.500">Todas as NF-e</StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>

        <Card size="sm" borderWidth="1px" borderColor="gray.200" 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "orange.300" 
          }}
        >
          <CardBody p={4}>
            <Flex justify="space-between" align="flex-start">
              <Stat>
                <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">SKUs Distintos</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="bold" color="gray.800">{totalSkusDistintos}</StatNumber>
                <StatHelpText fontSize="xs" color="gray.500">Produtos diferentes</StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <Card size="sm" borderWidth="1px" borderColor="gray.200" 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "blue.300" 
          }}
        >
          <CardBody p={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <Heading size="sm" color="gray.700" fontWeight="semibold">Resumo de Valores</Heading>
            </Flex>
            <Box h="300px">
              {dadosGraficoArea.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosGraficoArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: '11px' }} />
                  <YAxis tick={{ fontSize: '11px' }} />
                    <RechartsTooltip contentStyle={{ fontSize: '11px' }} formatter={(value) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor'
                    ]} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#007bff"
                    fill="#007bff"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              ) : (
                <Center h="100%">
                  <Text color="gray.500">Sem dados para exibir</Text>
                </Center>
              )}
            </Box>
          </CardBody>
        </Card>

        <Card size="sm" borderWidth="1px" borderColor="gray.200" 
          boxShadow="sm"
          transition="all 0.3s ease"
          _hover={{ 
            transform: "translateY(-4px)", 
            boxShadow: "md", 
            borderColor: "teal.300" 
          }}
        >
          <CardBody p={4}>
            <Heading size="sm" mb={4} color="gray.700" fontWeight="semibold">Volume (HL) por Mês</Heading>
            <Box h="300px">
              {dadosGraficoBarras.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoBarras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: '11px' }} />
                  <YAxis tick={{ fontSize: '11px' }} />
                    <RechartsTooltip contentStyle={{ fontSize: '11px' }} formatter={(value) => [
                      `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} HL`,
                      'Volume'
                    ]} />
                  <Bar dataKey="hl" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <Center h="100%">
                  <Text color="gray.500">Sem dados para exibir</Text>
                </Center>
              )}
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderWidth="1px" borderColor="gray.200" 
        boxShadow="sm"
        transition="all 0.3s ease"
        _hover={{ 
          transform: "translateY(-4px)", 
          boxShadow: "md", 
          borderColor: "purple.300" 
        }}
      >
        <CardBody p={4}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="sm" color="gray.700" fontWeight="semibold">Últimas NF-s Integradas</Heading>
            <HStack spacing={3}>
              <Menu>
                <Tooltip label="Exportar notas fiscais">
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
                    onClick={() => exportarNotasFiscais('csv')}
                  >
                    Exportar como CSV
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={FiFilePlus} />}
                    onClick={() => exportarNotasFiscais('excel')}
                  >
                    Exportar como Excel
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={MdFileDownload} />}
                    onClick={() => exportarNotasFiscais('pdf')}
                  >
                    Exportar como PDF
                  </MenuItem>
                </MenuList>
              </Menu>
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.600">Mostrar:</Text>
              <Select
                size="sm"
                w="80px"
                value={itensPorPagina}
                onChange={(e) => setItensPorPagina(Number(e.target.value))}
                borderColor="blue.500"
                focusBorderColor="blue.500"
                borderRadius="md"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </Select>
              </HStack>
            </HStack>
          </Flex>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Emitente</Th>
                  <Th textAlign="center">Nº NF</Th>
                  <Th textAlign="center">Data de Emissão</Th>
                  <Th textAlign="center">Data de Integração</Th>
                  <Th isNumeric>Valor (R$)</Th>
                  <Th isNumeric>Volume (HL)</Th>
                  <Th textAlign="center">Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {nfsVisiveis.length > 0 ? (
                  nfsVisiveis.map((nf) => (
                    <Tr key={nf.id} _hover={{ bg: "gray.50" }}>
                      <Td>
                        <Text fontWeight="medium">{nf.emitente.razaoSocial}</Text>
                    </Td>
                      <Td fontFamily="mono" fontSize="sm" textAlign="center">{nf.numero}</Td>
                      <Td fontSize="sm" textAlign="center">{formatarData(nf.dataEmissao)}</Td>
                      <Td fontSize="sm" textAlign="center">{formatarData(nf.dataCadastro)}</Td>
                      <Td isNumeric fontWeight="medium">{formatValue(nf.valorTotal)}</Td>
                      <Td isNumeric fontWeight="medium">{formatHL(nf.volumeTotal)}</Td>
                    <Td textAlign="center">
                        <HStack spacing={1} justify="center">
                      <IconButton
                        aria-label="Ver detalhes"
                        icon={<Icon as={LuEye} />}
                        variant="ghost"
                        colorScheme="blue"
                        size="sm"
                        onClick={() => {
                            setSelectedNf(nf);
                          onDetalhesOpen();
                        }}
                      />
                          <IconButton
                            aria-label="Excluir nota fiscal"
                            icon={<Icon as={MdDelete} />}
                            variant="ghost"
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleDeleteClick(nf.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={4}>
                      <Text color="gray.500">Nenhuma nota fiscal encontrada</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Drawer de Detalhes da NF */}
      {selectedNf && (
        <Drawer isOpen={isDetalhesOpen} placement="right" onClose={onDetalhesClose} size="md">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" fontSize="lg" fontWeight="semibold">
              Detalhes da Nota Fiscal - Nº {selectedNf.numero}
            </DrawerHeader>

            <DrawerBody py={6}>
              <VStack spacing={5} align="stretch">
                <Box>
                  <Heading size="xs" textTransform="uppercase" color="gray.500" fontWeight="semibold" mb={2}>Emitente:</Heading>
                  <Text fontSize="sm" color="gray.800" fontWeight="medium">{selectedNf.emitente.razaoSocial}</Text>
                </Box>
                <SimpleGrid columns={2} spacingX={6} spacingY={4}>
                  <Box>
                    <Heading size="xs" textTransform="uppercase" color="gray.500" fontWeight="semibold" mb={2}>Nº NF:</Heading>
                    <Text fontSize="sm" color="gray.800" fontFamily="mono" fontWeight="medium">{selectedNf.numero}</Text>
                  </Box>
                  <Box>
                    <Heading size="xs" textTransform="uppercase" color="gray.500" fontWeight="semibold" mb={2}>Série:</Heading>
                    <Text fontSize="sm" color="gray.800" fontWeight="medium">{selectedNf.serie}</Text>
                  </Box>
                </SimpleGrid>
                <SimpleGrid columns={2} spacingX={6} spacingY={4}>
                  <Box>
                    <Heading size="xs" textTransform="uppercase" color="gray.500" fontWeight="semibold" mb={2}>Data de Emissão:</Heading>
                    <Text fontSize="sm" color="gray.800" fontWeight="medium">{formatarData(selectedNf.dataEmissao)}</Text>
                  </Box>
                  <Box>
                    <Heading size="xs" textTransform="uppercase" color="gray.500" fontWeight="semibold" mb={2}>Data de Integração:</Heading>
                    <Text fontSize="sm" color="gray.800" fontWeight="medium">{formatarData(selectedNf.dataCadastro)}</Text>
                  </Box>
                </SimpleGrid>
                
                <Box>
                  <Heading size="xs" textTransform="uppercase" color="gray.500" fontWeight="semibold" mb={2}>Valor Total da NF:</Heading>
                  <Text fontSize="sm" color="gray.800" fontWeight="medium">R$ {formatValue(selectedNf.valorTotal)}</Text>
                </Box>

                <Box>
                  <Heading size="xs" textTransform="uppercase" color="gray.500" fontWeight="semibold" mb={2}>SKUs Contidos ({selectedNf.produtos.length}):</Heading>
                  <List spacing={3}>
                    {selectedNf.produtos.map((produto, index) => (
                      <Box key={index} borderBottomWidth={index < selectedNf.produtos.length -1 ? "1px" : "0px"} borderColor="gray.100" pb={2} mb={2}>
                        <Text fontWeight="medium" color="gray.800">{produto.descricao}</Text>
                        <HStack spacing={4} mt={1}>
                          <Text fontSize="xs" color="gray.600" ml={2}>Código: {produto.codigo}</Text>
                        </HStack>
                      </Box>
                    ))}
                  </List>
                </Box>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteConfirmClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Nota Fiscal
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteConfirmClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => nfToDelete && deleteInvoice(nfToDelete)} 
                ml={3}
                isLoading={isDeleting}
                loadingText="Excluindo..."
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}