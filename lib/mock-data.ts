/**
 * Dados Mockados Centralizados - Pontte Capital
 * Este arquivo contém TODOS os dados de exemplo do sistema
 * Facilita alterações e mantém consistência
 */

// ============================================
// USUÁRIOS / PERSONAGENS
// ============================================
export const MOCK_USUARIO = {
  id: 'USR-001',
  nome: 'Eng. João Silva',
  email: 'joao.silva@pontte.com.br',
  role: 'engenheiro',
};

// ============================================
// FUNDOS
// ============================================
export const MOCK_FUNDO = {
  id: 'FIDC-001',
  nome: 'Fundo Alpha FIDC',
  cnpj: '11.222.333/0001-44',
  valorTotal: 100000000.0,
  saldoDisponivel: 35000000.0,
  obrasAtivas: 1,
  status: 'Ativo',
};

// ============================================
// CONSTRUTORAS
// ============================================
export const MOCK_CONSTRUTORA = {
  id: 'C001',
  razaoSocial: 'Construtora ABC Ltda',
  nomeFantasia: 'Construtora ABC',
  cnpj: '12.345.678/0001-90',
  inscricaoEstadual: '123456789',
  endereco: 'Av. Principal, 1000',
  complemento: 'Sala 501',
  cidade: 'Maringá',
  estado: 'PR',
  cep: '87000-000',
  telefone: '(44) 3025-1234',
  email: 'contato@construtoraabc.com.br',
  rating: 'A',
  status: 'Ativo',
  exposicaoTotal: 45200000.0,
  risco: 'baixo',
  contaBancaria: {
    banco: '001',
    agencia: '1234',
    conta: '12345-6',
    tipo: 'Corrente',
  },
  socios: [
    {
      nome: 'Carlos Alberto Silva',
      cpf: '123.456.789-00',
      participacao: '60%',
      cargo: 'Diretor Presidente',
    },
    {
      nome: 'Maria Santos Silva',
      cpf: '987.654.321-00',
      participacao: '40%',
      cargo: 'Diretora Financeira',
    },
  ],
};

// ============================================
// FIADORES
// ============================================
export const MOCK_FIADOR = {
  id: 'F001',
  tipo: 'PJ' as const,
  razaoSocial: 'Garantia Construções S.A.',
  nome: 'Garantia Construções S.A.', // Para compatibilidade
  cnpj: '98.765.432/0001-10',
  telefone: '(44) 3025-5678',
  email: 'contato@garantiaconstrucoes.com.br',
  endereco: 'Rua das Garantias, 500',
  cidade: 'Maringá',
  estado: 'PR',
  cep: '87010-000',
  status: 'Ativo',
  bens: [
    {
      id: 'BEM-001',
      tipo: 'Imóvel',
      descricao: 'Terreno Comercial - Zona Industrial',
      endereco: 'Av. Industrial, 2500',
      cidade: 'Maringá',
      estado: 'PR',
      valor: 2500000.0,
      matricula: '12345',
      cartorio: '1º Cartório de Registro de Imóveis',
      status: 'Livre',
    },
  ],
};

// ============================================
// OBRAS / CONTRATOS
// ============================================
export const MOCK_OBRA = {
  id: 'OBR-001',
  numeroContrato: '001/2024',
  numeroEdital: 'EDT-001/2024',
  objeto: 'Reforma e Ampliação da Escola Municipal Santa Rita',
  contratante: 'Prefeitura de Maringá',
  construtoraId: MOCK_CONSTRUTORA.id,
  construtoraNome: MOCK_CONSTRUTORA.razaoSocial,
  fundoId: MOCK_FUNDO.id,
  fundoNome: MOCK_FUNDO.nome,
  gerenteEngenharia: 'ENG-001',
  gerenteEngenhariaNome: 'Eng. João Silva',
  dataInicio: '2024-01-15',
  dataFim: '2025-12-31',
  valorGlobal: 12500000.0,
  enderecoObra: 'Rua das Flores, 123 - Maringá/PR',
  latitude: '-23.4205',
  longitude: '-51.9332',
  contaEscrow: {
    banco: '001',
    agencia: '1234',
    conta: '12345-6',
  },
  status: 'Em Execução',
};

// ============================================
// PLANILHA CONTRATUAL (EAP)
// ============================================
// Estrutura completa de uma obra pequena de reforma escolar
// Total: R$ 12.500.000,00 (coerente com MOCK_OBRA.valorGlobal)
export const MOCK_PLANILHA_ITENS = [
  // FASE 1: INFRAESTRUTURA
  {
    id: '1.0',
    item: '1.0',
    referencia: '',
    descricao: 'SERVIÇOS DE INFRAESTRUTURA',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 2800000.0, // R$ 2.800.000,00
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['1.1', '1.2', '1.3'],
    parentId: undefined,
  },
  // Movimentação de Terra
  {
    id: '1.1',
    item: '1.1',
    referencia: '',
    descricao: 'Movimentação de Terra',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 950000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.1.1', '1.1.2', '1.1.3'],
    parentId: '1.0',
  },
  {
    id: '1.1.1',
    item: '1.1.1',
    referencia: 'SINAPI-1234',
    descricao: 'Escavação manual para fundações',
    unidade: 'm³',
    quantidade: 250.0,
    precoUnitario: 45.5,
    precoTotal: 11375.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.1',
  },
  {
    id: '1.1.2',
    item: '1.1.2',
    referencia: 'SINAPI-1235',
    descricao: 'Aterro compactado',
    unidade: 'm³',
    quantidade: 180.0,
    precoUnitario: 38.2,
    precoTotal: 6876.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.1',
  },
  {
    id: '1.1.3',
    item: '1.1.3',
    referencia: 'SINAPI-1236',
    descricao: 'Nivelamento e compactação do terreno',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 12.5,
    precoTotal: 10625.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.1',
  },
  // Fundações
  {
    id: '1.2',
    item: '1.2',
    referencia: '',
    descricao: 'Fundações',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 1200000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.2.1', '1.2.2', '1.2.3'],
    parentId: '1.0',
  },
  {
    id: '1.2.1',
    item: '1.2.1',
    referencia: 'SICRO-5678',
    descricao: 'Concreto estrutural Fck 25 MPa',
    unidade: 'm³',
    quantidade: 150.0,
    precoUnitario: 450.0,
    precoTotal: 67500.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.2',
  },
  {
    id: '1.2.2',
    item: '1.2.2',
    referencia: 'SICRO-5679',
    descricao: 'Armadura para fundações (CA-50)',
    unidade: 'kg',
    quantidade: 8500.0,
    precoUnitario: 8.5,
    precoTotal: 72250.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.2',
  },
  {
    id: '1.2.3',
    item: '1.2.3',
    referencia: 'SICRO-5680',
    descricao: 'Formas de madeira para fundações',
    unidade: 'm²',
    quantidade: 320.0,
    precoUnitario: 35.0,
    precoTotal: 11200.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.2',
  },
  // Drenagem e Impermeabilização
  {
    id: '1.3',
    item: '1.3',
    referencia: '',
    descricao: 'Drenagem e Impermeabilização',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 650000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.3.1', '1.3.2'],
    parentId: '1.0',
  },
  {
    id: '1.3.1',
    item: '1.3.1',
    referencia: 'SINAPI-1240',
    descricao: 'Drenos perimetrais com brita',
    unidade: 'm',
    quantidade: 180.0,
    precoUnitario: 85.0,
    precoTotal: 15300.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.3',
  },
  {
    id: '1.3.2',
    item: '1.3.2',
    referencia: 'SINAPI-1241',
    descricao: 'Impermeabilização de fundações',
    unidade: 'm²',
    quantidade: 450.0,
    precoUnitario: 42.5,
    precoTotal: 19125.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.3',
  },
  
  // FASE 2: ESTRUTURA
  {
    id: '2.0',
    item: '2.0',
    referencia: '',
    descricao: 'ESTRUTURA',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 3200000.0, // R$ 3.200.000,00
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['2.1', '2.2'],
    parentId: undefined,
  },
  // Estrutura de Concreto
  {
    id: '2.1',
    item: '2.1',
    referencia: '',
    descricao: 'Estrutura de Concreto Armado',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 2200000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['2.1.1', '2.1.2', '2.1.3'],
    parentId: '2.0',
  },
  {
    id: '2.1.1',
    item: '2.1.1',
    referencia: 'SICRO-6001',
    descricao: 'Concreto estrutural Fck 30 MPa para vigas e pilares',
    unidade: 'm³',
    quantidade: 280.0,
    precoUnitario: 520.0,
    precoTotal: 145600.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.1.2',
    item: '2.1.2',
    referencia: 'SICRO-6002',
    descricao: 'Armadura para vigas e pilares (CA-50)',
    unidade: 'kg',
    quantidade: 18500.0,
    precoUnitario: 8.8,
    precoTotal: 162800.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.1.3',
    item: '2.1.3',
    referencia: 'SICRO-6003',
    descricao: 'Formas de madeira para vigas e pilares',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 48.0,
    precoTotal: 40800.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.1',
  },
  // Lajes
  {
    id: '2.2',
    item: '2.2',
    referencia: '',
    descricao: 'Lajes',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 1000000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['2.2.1', '2.2.2'],
    parentId: '2.0',
  },
  {
    id: '2.2.1',
    item: '2.2.1',
    referencia: 'SICRO-6101',
    descricao: 'Laje nervurada pré-fabricada',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 95.0,
    precoTotal: 80750.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.2',
  },
  {
    id: '2.2.2',
    item: '2.2.2',
    referencia: 'SICRO-6102',
    descricao: 'Concreto de preenchimento para lajes',
    unidade: 'm³',
    quantidade: 85.0,
    precoUnitario: 380.0,
    precoTotal: 32300.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.2',
  },
  
  // FASE 3: ALVENARIA
  {
    id: '3.0',
    item: '3.0',
    referencia: '',
    descricao: 'ALVENARIA E VEDAÇÃO',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 1800000.0, // R$ 1.800.000,00
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['3.1', '3.2'],
    parentId: undefined,
  },
  // Alvenaria Externa
  {
    id: '3.1',
    item: '3.1',
    referencia: '',
    descricao: 'Alvenaria Externa',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 1100000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['3.1.1', '3.1.2', '3.1.3'],
    parentId: '3.0',
  },
  {
    id: '3.1.1',
    item: '3.1.1',
    referencia: 'SINAPI-2001',
    descricao: 'Tijolo cerâmico 9x19x19 para alvenaria externa',
    unidade: 'm²',
    quantidade: 680.0,
    precoUnitario: 42.5,
    precoTotal: 28900.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '3.1',
  },
  {
    id: '3.1.2',
    item: '3.1.2',
    referencia: 'SINAPI-2002',
    descricao: 'Argamassa de assentamento',
    unidade: 'm³',
    quantidade: 45.0,
    precoUnitario: 285.0,
    precoTotal: 12825.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '3.1',
  },
  {
    id: '3.1.3',
    item: '3.1.3',
    referencia: 'SINAPI-2003',
    descricao: 'Reboco externo',
    unidade: 'm²',
    quantidade: 680.0,
    precoUnitario: 18.5,
    precoTotal: 12580.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '3.1',
  },
  // Alvenaria Interna
  {
    id: '3.2',
    item: '3.2',
    referencia: '',
    descricao: 'Alvenaria Interna',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 700000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['3.2.1', '3.2.2'],
    parentId: '3.0',
  },
  {
    id: '3.2.1',
    item: '3.2.1',
    referencia: 'SINAPI-2101',
    descricao: 'Bloco de concreto para alvenaria interna',
    unidade: 'm²',
    quantidade: 520.0,
    precoUnitario: 38.0,
    precoTotal: 19760.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '3.2',
  },
  {
    id: '3.2.2',
    item: '3.2.2',
    referencia: 'SINAPI-2102',
    descricao: 'Reboco interno',
    unidade: 'm²',
    quantidade: 520.0,
    precoUnitario: 15.5,
    precoTotal: 8060.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '3.2',
  },
  
  // FASE 4: COBERTURA
  {
    id: '4.0',
    item: '4.0',
    referencia: '',
    descricao: 'COBERTURA',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 1500000.0, // R$ 1.500.000,00
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['4.1', '4.2'],
    parentId: undefined,
  },
  // Estrutura da Cobertura
  {
    id: '4.1',
    item: '4.1',
    referencia: '',
    descricao: 'Estrutura da Cobertura',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 850000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['4.1.1', '4.1.2'],
    parentId: '4.0',
  },
  {
    id: '4.1.1',
    item: '4.1.1',
    referencia: 'SICRO-7001',
    descricao: 'Estrutura metálica para cobertura',
    unidade: 'kg',
    quantidade: 12000.0,
    precoUnitario: 12.5,
    precoTotal: 150000.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '4.1',
  },
  {
    id: '4.1.2',
    item: '4.1.2',
    referencia: 'SICRO-7002',
    descricao: 'Telhas metálicas trapezoidais',
    unidade: 'm²',
    quantidade: 650.0,
    precoUnitario: 85.0,
    precoTotal: 55250.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '4.1',
  },
  // Forro
  {
    id: '4.2',
    item: '4.2',
    referencia: '',
    descricao: 'Forro',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 650000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['4.2.1'],
    parentId: '4.0',
  },
  {
    id: '4.2.1',
    item: '4.2.1',
    referencia: 'SINAPI-3001',
    descricao: 'Forro de gesso acartonado',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 65.0,
    precoTotal: 55250.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '4.2',
  },
  
  // FASE 5: ACABAMENTOS
  {
    id: '5.0',
    item: '5.0',
    referencia: '',
    descricao: 'ACABAMENTOS',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 2200000.0, // R$ 2.200.000,00
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['5.1', '5.2', '5.3'],
    parentId: undefined,
  },
  // Pisos
  {
    id: '5.1',
    item: '5.1',
    referencia: '',
    descricao: 'Pisos',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 950000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['5.1.1', '5.1.2'],
    parentId: '5.0',
  },
  {
    id: '5.1.1',
    item: '5.1.1',
    referencia: 'SINAPI-4001',
    descricao: 'Piso cerâmico para salas de aula',
    unidade: 'm²',
    quantidade: 680.0,
    precoUnitario: 55.0,
    precoTotal: 37400.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '5.1',
  },
  {
    id: '5.1.2',
    item: '5.1.2',
    referencia: 'SINAPI-4002',
    descricao: 'Contrapiso',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 28.5,
    precoTotal: 24225.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '5.1',
  },
  // Esquadrias
  {
    id: '5.2',
    item: '5.2',
    referencia: '',
    descricao: 'Esquadrias',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 750000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['5.2.1', '5.2.2'],
    parentId: '5.0',
  },
  {
    id: '5.2.1',
    item: '5.2.1',
    referencia: 'SINAPI-4101',
    descricao: 'Portas de madeira maciça',
    unidade: 'un',
    quantidade: 45.0,
    precoUnitario: 450.0,
    precoTotal: 20250.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '5.2',
  },
  {
    id: '5.2.2',
    item: '5.2.2',
    referencia: 'SINAPI-4102',
    descricao: 'Janelas de alumínio com vidro',
    unidade: 'm²',
    quantidade: 120.0,
    precoUnitario: 285.0,
    precoTotal: 34200.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '5.2',
  },
  // Pintura
  {
    id: '5.3',
    item: '5.3',
    referencia: '',
    descricao: 'Pintura',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 500000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['5.3.1', '5.3.2'],
    parentId: '5.0',
  },
  {
    id: '5.3.1',
    item: '5.3.1',
    referencia: 'SINAPI-4201',
    descricao: 'Pintura externa acrílica',
    unidade: 'm²',
    quantidade: 680.0,
    precoUnitario: 22.5,
    precoTotal: 15300.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '5.3',
  },
  {
    id: '5.3.2',
    item: '5.3.2',
    referencia: 'SINAPI-4202',
    descricao: 'Pintura interna látex PVA',
    unidade: 'm²',
    quantidade: 1850.0,
    precoUnitario: 18.5,
    precoTotal: 34225.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '5.3',
  },
  
  // FASE 6: INSTALAÇÕES
  {
    id: '6.0',
    item: '6.0',
    referencia: '',
    descricao: 'INSTALAÇÕES',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 1000000.0, // R$ 1.000.000,00
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['6.1', '6.2'],
    parentId: undefined,
  },
  // Instalações Elétricas
  {
    id: '6.1',
    item: '6.1',
    referencia: '',
    descricao: 'Instalações Elétricas',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 550000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['6.1.1', '6.1.2', '6.1.3'],
    parentId: '6.0',
  },
  {
    id: '6.1.1',
    item: '6.1.1',
    referencia: 'SINAPI-5001',
    descricao: 'Fiação elétrica (condutores)',
    unidade: 'm',
    quantidade: 2800.0,
    precoUnitario: 12.5,
    precoTotal: 35000.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '6.1',
  },
  {
    id: '6.1.2',
    item: '6.1.2',
    referencia: 'SINAPI-5002',
    descricao: 'Quadros de distribuição',
    unidade: 'un',
    quantidade: 8.0,
    precoUnitario: 1250.0,
    precoTotal: 10000.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '6.1',
  },
  {
    id: '6.1.3',
    item: '6.1.3',
    referencia: 'SINAPI-5003',
    descricao: 'Luminárias LED para salas de aula',
    unidade: 'un',
    quantidade: 120.0,
    precoUnitario: 185.0,
    precoTotal: 22200.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '6.1',
  },
  // Instalações Hidrossanitárias
  {
    id: '6.2',
    item: '6.2',
    referencia: '',
    descricao: 'Instalações Hidrossanitárias',
    unidade: '',
    quantidade: 0,
    precoUnitario: 0,
    precoTotal: 450000.0,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['6.2.1', '6.2.2'],
    parentId: '6.0',
  },
  {
    id: '6.2.1',
    item: '6.2.1',
    referencia: 'SINAPI-5101',
    descricao: 'Tubulação de água (PVC)',
    unidade: 'm',
    quantidade: 450.0,
    precoUnitario: 28.5,
    precoTotal: 12825.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '6.2',
  },
  {
    id: '6.2.2',
    item: '6.2.2',
    referencia: 'SINAPI-5102',
    descricao: 'Tubulação de esgoto (PVC)',
    unidade: 'm',
    quantidade: 380.0,
    precoUnitario: 32.5,
    precoTotal: 12350.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '6.2',
  },
];

// ============================================
// CUSTOS ORÇADOS
// ============================================
// Espelha todos os itens da planilha contratual (apenas itens de nível 2)
export const MOCK_CUSTOS_ITENS = [
  // Fase 1 - Infraestrutura
  {
    id: '1.1.1',
    item: '1.1.1',
    descricao: 'Escavação manual para fundações',
    unidade: 'm³',
    quantidade: 250.0,
    precoVenda: 11375.0,
    custoMat: 25.5,
    custoMO: 12.3,
    custoContratos: 0,
    custoEqFr: 2.5,
    custoTotal: 10100.0,
    lucroProjetado: 1275.0,
    margem: 11.2,
  },
  {
    id: '1.1.2',
    item: '1.1.2',
    descricao: 'Aterro compactado',
    unidade: 'm³',
    quantidade: 180.0,
    precoVenda: 6876.0,
    custoMat: 15.2,
    custoMO: 8.5,
    custoContratos: 0,
    custoEqFr: 1.8,
    custoTotal: 4590.0,
    lucroProjetado: 2286.0,
    margem: 33.2,
  },
  {
    id: '1.1.3',
    item: '1.1.3',
    descricao: 'Nivelamento e compactação do terreno',
    unidade: 'm²',
    quantidade: 850.0,
    precoVenda: 10625.0,
    custoMat: 5.5,
    custoMO: 4.2,
    custoContratos: 0,
    custoEqFr: 1.5,
    custoTotal: 9520.0,
    lucroProjetado: 1105.0,
    margem: 10.4,
  },
  {
    id: '1.2.1',
    item: '1.2.1',
    descricao: 'Concreto estrutural Fck 25 MPa',
    unidade: 'm³',
    quantidade: 150.0,
    precoVenda: 67500.0,
    custoMat: 280.0,
    custoMO: 45.0,
    custoContratos: 0,
    custoEqFr: 12.0,
    custoTotal: 50550.0,
    lucroProjetado: 16950.0,
    margem: 25.1,
  },
  {
    id: '1.2.2',
    item: '1.2.2',
    descricao: 'Armadura para fundações (CA-50)',
    unidade: 'kg',
    quantidade: 8500.0,
    precoVenda: 72250.0,
    custoMat: 6.5,
    custoMO: 1.2,
    custoContratos: 0,
    custoEqFr: 0.3,
    custoTotal: 68000.0,
    lucroProjetado: 4250.0,
    margem: 5.9,
  },
  {
    id: '1.2.3',
    item: '1.2.3',
    descricao: 'Formas de madeira para fundações',
    unidade: 'm²',
    quantidade: 320.0,
    precoVenda: 11200.0,
    custoMat: 22.5,
    custoMO: 8.5,
    custoContratos: 0,
    custoEqFr: 2.0,
    custoTotal: 10560.0,
    lucroProjetado: 640.0,
    margem: 5.7,
  },
  {
    id: '1.3.1',
    item: '1.3.1',
    descricao: 'Drenos perimetrais com brita',
    unidade: 'm',
    quantidade: 180.0,
    precoVenda: 15300.0,
    custoMat: 65.0,
    custoMO: 12.5,
    custoContratos: 0,
    custoEqFr: 3.5,
    custoTotal: 14580.0,
    lucroProjetado: 720.0,
    margem: 4.7,
  },
  {
    id: '1.3.2',
    item: '1.3.2',
    descricao: 'Impermeabilização de fundações',
    unidade: 'm²',
    quantidade: 450.0,
    precoVenda: 19125.0,
    custoMat: 32.5,
    custoMO: 6.5,
    custoContratos: 0,
    custoEqFr: 2.0,
    custoTotal: 18450.0,
    lucroProjetado: 675.0,
    margem: 3.5,
  },
  
  // Fase 2 - Estrutura
  {
    id: '2.1.1',
    item: '2.1.1',
    descricao: 'Concreto estrutural Fck 30 MPa para vigas e pilares',
    unidade: 'm³',
    quantidade: 280.0,
    precoVenda: 145600.0,
    custoMat: 320.0,
    custoMO: 55.0,
    custoContratos: 0,
    custoEqFr: 15.0,
    custoTotal: 109200.0,
    lucroProjetado: 36400.0,
    margem: 25.0,
  },
  {
    id: '2.1.2',
    item: '2.1.2',
    descricao: 'Armadura para vigas e pilares (CA-50)',
    unidade: 'kg',
    quantidade: 18500.0,
    precoVenda: 162800.0,
    custoMat: 6.8,
    custoMO: 1.3,
    custoContratos: 0,
    custoEqFr: 0.4,
    custoTotal: 157250.0,
    lucroProjetado: 5550.0,
    margem: 3.4,
  },
  {
    id: '2.1.3',
    item: '2.1.3',
    descricao: 'Formas de madeira para vigas e pilares',
    unidade: 'm²',
    quantidade: 850.0,
    precoVenda: 40800.0,
    custoMat: 38.5,
    custoMO: 7.5,
    custoContratos: 0,
    custoEqFr: 2.0,
    custoTotal: 40800.0,
    lucroProjetado: 0.0,
    margem: 0.0,
  },
  {
    id: '2.2.1',
    item: '2.2.1',
    descricao: 'Laje nervurada pré-fabricada',
    unidade: 'm²',
    quantidade: 850.0,
    precoVenda: 80750.0,
    custoMat: 75.0,
    custoMO: 12.5,
    custoContratos: 0,
    custoEqFr: 5.0,
    custoTotal: 78625.0,
    lucroProjetado: 2125.0,
    margem: 2.6,
  },
  {
    id: '2.2.2',
    item: '2.2.2',
    descricao: 'Concreto de preenchimento para lajes',
    unidade: 'm³',
    quantidade: 85.0,
    precoVenda: 32300.0,
    custoMat: 290.0,
    custoMO: 45.0,
    custoContratos: 0,
    custoEqFr: 15.0,
    custoTotal: 29750.0,
    lucroProjetado: 2550.0,
    margem: 7.9,
  },
  
  // Fase 3 - Alvenaria
  {
    id: '3.1.1',
    item: '3.1.1',
    descricao: 'Tijolo cerâmico 9x19x19 para alvenaria externa',
    unidade: 'm²',
    quantidade: 680.0,
    precoVenda: 28900.0,
    custoMat: 32.5,
    custoMO: 8.5,
    custoContratos: 0,
    custoEqFr: 1.0,
    custoTotal: 28560.0,
    lucroProjetado: 340.0,
    margem: 1.2,
  },
  {
    id: '3.1.2',
    item: '3.1.2',
    descricao: 'Argamassa de assentamento',
    unidade: 'm³',
    quantidade: 45.0,
    precoVenda: 12825.0,
    custoMat: 230.0,
    custoMO: 40.0,
    custoContratos: 0,
    custoEqFr: 10.0,
    custoTotal: 12600.0,
    lucroProjetado: 225.0,
    margem: 1.8,
  },
  {
    id: '3.1.3',
    item: '3.1.3',
    descricao: 'Reboco externo',
    unidade: 'm²',
    quantidade: 680.0,
    precoVenda: 12580.0,
    custoMat: 12.5,
    custoMO: 4.5,
    custoContratos: 0,
    custoEqFr: 1.0,
    custoTotal: 12240.0,
    lucroProjetado: 340.0,
    margem: 2.7,
  },
  {
    id: '3.2.1',
    item: '3.2.1',
    descricao: 'Bloco de concreto para alvenaria interna',
    unidade: 'm²',
    quantidade: 520.0,
    precoVenda: 19760.0,
    custoMat: 28.5,
    custoMO: 7.5,
    custoContratos: 0,
    custoEqFr: 1.0,
    custoTotal: 19240.0,
    lucroProjetado: 520.0,
    margem: 2.6,
  },
  {
    id: '3.2.2',
    item: '3.2.2',
    descricao: 'Reboco interno',
    unidade: 'm²',
    quantidade: 520.0,
    precoVenda: 8060.0,
    custoMat: 10.5,
    custoMO: 4.0,
    custoContratos: 0,
    custoEqFr: 0.5,
    custoTotal: 7800.0,
    lucroProjetado: 260.0,
    margem: 3.2,
  },
  
  // Fase 4 - Cobertura
  {
    id: '4.1.1',
    item: '4.1.1',
    descricao: 'Estrutura metálica para cobertura',
    unidade: 'kg',
    quantidade: 12000.0,
    precoVenda: 150000.0,
    custoMat: 10.5,
    custoMO: 1.5,
    custoContratos: 0,
    custoEqFr: 0.3,
    custoTotal: 147600.0,
    lucroProjetado: 2400.0,
    margem: 1.6,
  },
  {
    id: '4.1.2',
    item: '4.1.2',
    descricao: 'Telhas metálicas trapezoidais',
    unidade: 'm²',
    quantidade: 650.0,
    precoVenda: 55250.0,
    custoMat: 72.5,
    custoMO: 10.5,
    custoContratos: 0,
    custoEqFr: 2.0,
    custoTotal: 55250.0,
    lucroProjetado: 0.0,
    margem: 0.0,
  },
  {
    id: '4.2.1',
    item: '4.2.1',
    descricao: 'Forro de gesso acartonado',
    unidade: 'm²',
    quantidade: 850.0,
    precoVenda: 55250.0,
    custoMat: 48.5,
    custoMO: 12.5,
    custoContratos: 0,
    custoEqFr: 3.5,
    custoTotal: 54925.0,
    lucroProjetado: 325.0,
    margem: 0.6,
  },
  
  // Fase 5 - Acabamentos
  {
    id: '5.1.1',
    item: '5.1.1',
    descricao: 'Piso cerâmico para salas de aula',
    unidade: 'm²',
    quantidade: 680.0,
    precoVenda: 37400.0,
    custoMat: 42.5,
    custoMO: 10.5,
    custoContratos: 0,
    custoEqFr: 2.0,
    custoTotal: 37400.0,
    lucroProjetado: 0.0,
    margem: 0.0,
  },
  {
    id: '5.1.2',
    item: '5.1.2',
    descricao: 'Contrapiso',
    unidade: 'm²',
    quantidade: 850.0,
    precoVenda: 24225.0,
    custoMat: 22.5,
    custoMO: 4.5,
    custoContratos: 0,
    custoEqFr: 1.5,
    custoTotal: 24225.0,
    lucroProjetado: 0.0,
    margem: 0.0,
  },
  {
    id: '5.2.1',
    item: '5.2.1',
    descricao: 'Portas de madeira maciça',
    unidade: 'un',
    quantidade: 45.0,
    precoVenda: 20250.0,
    custoMat: 380.0,
    custoMO: 45.0,
    custoContratos: 0,
    custoEqFr: 10.0,
    custoTotal: 19575.0,
    lucroProjetado: 675.0,
    margem: 3.3,
  },
  {
    id: '5.2.2',
    item: '5.2.2',
    descricao: 'Janelas de alumínio com vidro',
    unidade: 'm²',
    quantidade: 120.0,
    precoVenda: 34200.0,
    custoMat: 240.0,
    custoMO: 35.0,
    custoContratos: 0,
    custoEqFr: 10.0,
    custoTotal: 34200.0,
    lucroProjetado: 0.0,
    margem: 0.0,
  },
  {
    id: '5.3.1',
    item: '5.3.1',
    descricao: 'Pintura externa acrílica',
    unidade: 'm²',
    quantidade: 680.0,
    precoVenda: 15300.0,
    custoMat: 16.5,
    custoMO: 4.5,
    custoContratos: 0,
    custoEqFr: 1.0,
    custoTotal: 14960.0,
    lucroProjetado: 340.0,
    margem: 2.2,
  },
  {
    id: '5.3.2',
    item: '5.3.2',
    descricao: 'Pintura interna látex PVA',
    unidade: 'm²',
    quantidade: 1850.0,
    precoVenda: 34225.0,
    custoMat: 14.5,
    custoMO: 3.5,
    custoContratos: 0,
    custoEqFr: 0.5,
    custoTotal: 33300.0,
    lucroProjetado: 925.0,
    margem: 2.7,
  },
  
  // Fase 6 - Instalações
  {
    id: '6.1.1',
    item: '6.1.1',
    descricao: 'Fiação elétrica (condutores)',
    unidade: 'm',
    quantidade: 2800.0,
    precoVenda: 35000.0,
    custoMat: 9.5,
    custoMO: 2.5,
    custoContratos: 0,
    custoEqFr: 0.3,
    custoTotal: 34300.0,
    lucroProjetado: 700.0,
    margem: 2.0,
  },
  {
    id: '6.1.2',
    item: '6.1.2',
    descricao: 'Quadros de distribuição',
    unidade: 'un',
    quantidade: 8.0,
    precoVenda: 10000.0,
    custoMat: 950.0,
    custoMO: 200.0,
    custoContratos: 0,
    custoEqFr: 50.0,
    custoTotal: 9600.0,
    lucroProjetado: 400.0,
    margem: 4.0,
  },
  {
    id: '6.1.3',
    item: '6.1.3',
    descricao: 'Luminárias LED para salas de aula',
    unidade: 'un',
    quantidade: 120.0,
    precoVenda: 22200.0,
    custoMat: 155.0,
    custoMO: 25.0,
    custoContratos: 0,
    custoEqFr: 5.0,
    custoTotal: 22200.0,
    lucroProjetado: 0.0,
    margem: 0.0,
  },
  {
    id: '6.2.1',
    item: '6.2.1',
    descricao: 'Tubulação de água (PVC)',
    unidade: 'm',
    quantidade: 450.0,
    precoVenda: 12825.0,
    custoMat: 22.5,
    custoMO: 4.5,
    custoContratos: 0,
    custoEqFr: 1.0,
    custoTotal: 12600.0,
    lucroProjetado: 225.0,
    margem: 1.8,
  },
  {
    id: '6.2.2',
    item: '6.2.2',
    descricao: 'Tubulação de esgoto (PVC)',
    unidade: 'm',
    quantidade: 380.0,
    precoVenda: 12350.0,
    custoMat: 26.5,
    custoMO: 4.5,
    custoContratos: 0,
    custoEqFr: 1.5,
    custoTotal: 12350.0,
    lucroProjetado: 0.0,
    margem: 0.0,
  },
];

// ============================================
// CATEGORIZAÇÃO
// ============================================
// Espelha todos os itens da planilha contratual (apenas itens de nível 2)
export const MOCK_CATEGORIZACAO_ITENS = [
  // INFRAESTRUTURA E CONTENÇÕES / INFRAESTRUTURAS HIDROSSANITÁRIAS / IMPERMEABILIZAÇÕES
  {
    id: '1.1.1',
    item: '1.1.1',
    referencia: 'SINAPI-1234',
    descricaoOriginal: 'Escavação manual para fundações',
    etapa: 'INFRAESTRUTURA E CONTENÇÕES',
    subetapa: 'MOVIMENTAÇÃO DE SOLO',
    servicoSimplificado: 'Escavação e Reaterro Mecanizado',
  },
  {
    id: '1.1.2',
    item: '1.1.2',
    referencia: 'SINAPI-1235',
    descricaoOriginal: 'Aterro compactado',
    etapa: 'INFRAESTRUTURA E CONTENÇÕES',
    subetapa: 'MOVIMENTAÇÃO DE SOLO',
    servicoSimplificado: 'Escavação e Reaterro Mecanizado',
  },
  {
    id: '1.1.3',
    item: '1.1.3',
    referencia: 'SINAPI-1236',
    descricaoOriginal: 'Nivelamento e compactação do terreno',
    etapa: 'INFRAESTRUTURA E CONTENÇÕES',
    subetapa: 'MOVIMENTAÇÃO DE SOLO',
    servicoSimplificado: 'Lastros, Proteções e Nivelamentos',
  },
  {
    id: '1.2.1',
    item: '1.2.1',
    referencia: 'SICRO-5678',
    descricaoOriginal: 'Concreto estrutural Fck 25 MPa',
    etapa: 'INFRAESTRUTURA E CONTENÇÕES',
    subetapa: 'BLOCOS DE FUNDAÇÃO',
    servicoSimplificado: 'Concretagem',
  },
  {
    id: '1.2.2',
    item: '1.2.2',
    referencia: 'SICRO-5679',
    descricaoOriginal: 'Armadura para fundações (CA-50)',
    etapa: 'INFRAESTRUTURA E CONTENÇÕES',
    subetapa: 'BLOCOS DE FUNDAÇÃO',
    servicoSimplificado: 'Armaduras',
  },
  {
    id: '1.2.3',
    item: '1.2.3',
    referencia: 'SICRO-5680',
    descricaoOriginal: 'Formas de madeira para fundações',
    etapa: 'INFRAESTRUTURA E CONTENÇÕES',
    subetapa: 'BLOCOS DE FUNDAÇÃO',
    servicoSimplificado: 'Formas e Escoramentos',
  },
  {
    id: '1.3.1',
    item: '1.3.1',
    referencia: 'SINAPI-1240',
    descricaoOriginal: 'Drenos perimetrais com brita',
    etapa: 'INFRAESTRUTURAS HIDROSSANITÁRIAS',
    subetapa: 'INFRA ESGOTO E VENTILAÇÃO',
    servicoSimplificado: 'Tubulações e Conexões (PEAD)',
  },
  {
    id: '1.3.2',
    item: '1.3.2',
    referencia: 'SINAPI-1241',
    descricaoOriginal: 'Impermeabilização de fundações',
    etapa: 'IMPERMEABILIZAÇÕES',
    subetapa: 'IMPERMEABILIZAÇÃO COM MANTA ASFÁLTICA',
    servicoSimplificado: 'Manta Asfáltica',
  },
  
  // SUPRAESTRUTURA
  {
    id: '2.1.1',
    item: '2.1.1',
    referencia: 'SICRO-6001',
    descricaoOriginal: 'Concreto estrutural Fck 30 MPa para vigas e pilares',
    etapa: 'SUPRAESTRUTURA',
    subetapa: 'PILARES',
    servicoSimplificado: 'Concretagem',
  },
  {
    id: '2.1.2',
    item: '2.1.2',
    referencia: 'SICRO-6002',
    descricaoOriginal: 'Armadura para vigas e pilares (CA-50)',
    etapa: 'SUPRAESTRUTURA',
    subetapa: 'PILARES',
    servicoSimplificado: 'Armaduras',
  },
  {
    id: '2.1.3',
    item: '2.1.3',
    referencia: 'SICRO-6003',
    descricaoOriginal: 'Formas de madeira para vigas e pilares',
    etapa: 'SUPRAESTRUTURA',
    subetapa: 'PILARES',
    servicoSimplificado: 'Formas e Escoramentos',
  },
  {
    id: '2.2.1',
    item: '2.2.1',
    referencia: 'SICRO-6101',
    descricaoOriginal: 'Laje nervurada pré-fabricada',
    etapa: 'SUPRAESTRUTURA',
    subetapa: 'LAJES',
    servicoSimplificado: 'Peças Pré-Moldadas',
  },
  {
    id: '2.2.2',
    item: '2.2.2',
    referencia: 'SICRO-6102',
    descricaoOriginal: 'Concreto de preenchimento para lajes',
    etapa: 'SUPRAESTRUTURA',
    subetapa: 'LAJES',
    servicoSimplificado: 'Concretagem',
  },
  
  // FECHAMENTOS DE PAREDE / REVESTIMENTOS DE PAREDE
  {
    id: '3.1.1',
    item: '3.1.1',
    referencia: 'SINAPI-2001',
    descricaoOriginal: 'Tijolo cerâmico 9x19x19 para alvenaria externa',
    etapa: 'FECHAMENTOS DE PAREDE',
    subetapa: 'PAREDES EM ALVENARIA CERÂMICA',
    servicoSimplificado: 'Blocos Cerâmicos',
  },
  {
    id: '3.1.2',
    item: '3.1.2',
    referencia: 'SINAPI-2002',
    descricaoOriginal: 'Argamassa de assentamento',
    etapa: 'FECHAMENTOS DE PAREDE',
    subetapa: 'PAREDES EM ALVENARIA CERÂMICA',
    servicoSimplificado: 'Chapisco e Reboco Argamassado',
  },
  {
    id: '3.1.3',
    item: '3.1.3',
    referencia: 'SINAPI-2003',
    descricaoOriginal: 'Reboco externo',
    etapa: 'REVESTIMENTOS DE PAREDE',
    subetapa: 'REVESTIMENTO ARGAMASSADO EM PAREDE',
    servicoSimplificado: 'Chapisco e Reboco Argamassado',
  },
  {
    id: '3.2.1',
    item: '3.2.1',
    referencia: 'SINAPI-2101',
    descricaoOriginal: 'Bloco de concreto para alvenaria interna',
    etapa: 'FECHAMENTOS DE PAREDE',
    subetapa: 'PAREDES EM ALVENARIA DE BLOCOS DE CONCRETO',
    servicoSimplificado: 'Blocos de Concreto',
  },
  {
    id: '3.2.2',
    item: '3.2.2',
    referencia: 'SINAPI-2102',
    descricaoOriginal: 'Reboco interno',
    etapa: 'REVESTIMENTOS DE PAREDE',
    subetapa: 'REVESTIMENTO ARGAMASSADO EM PAREDE',
    servicoSimplificado: 'Chapisco e Reboco Argamassado',
  },
  
  // COBERTURAS / FECHAMENTOS DE TETO
  {
    id: '4.1.1',
    item: '4.1.1',
    referencia: 'SICRO-7001',
    descricaoOriginal: 'Estrutura metálica para cobertura',
    etapa: 'COBERTURAS',
    subetapa: 'ESTRUTURAS DE COBERTURA',
    servicoSimplificado: 'Metálica Perfil I e W',
  },
  {
    id: '4.1.2',
    item: '4.1.2',
    referencia: 'SICRO-7002',
    descricaoOriginal: 'Telhas metálicas trapezoidais',
    etapa: 'COBERTURAS',
    subetapa: 'TELHAMENTOS, CUMIEIRAS, CALHAS E RUFOS',
    servicoSimplificado: 'Telhas Metálicas Simples',
  },
  {
    id: '4.2.1',
    item: '4.2.1',
    referencia: 'SINAPI-3001',
    descricaoOriginal: 'Forro de gesso acartonado',
    etapa: 'FECHAMENTOS DE TETO',
    subetapa: 'FORRO DE GESSO ACARTONADO',
    servicoSimplificado: 'Forro de Gesso Acartonado',
  },
  
  // REVESTIMENTOS DE PISO / ESQUADRIAS / PINTURAS
  {
    id: '5.1.1',
    item: '5.1.1',
    referencia: 'SINAPI-4001',
    descricaoOriginal: 'Piso cerâmico para salas de aula',
    etapa: 'REVESTIMENTOS DE PISO',
    subetapa: 'REVESTIMENTO EM PISO CERÂMICO E PORCELANATO',
    servicoSimplificado: 'Cerâmico e Porcelanato',
  },
  {
    id: '5.1.2',
    item: '5.1.2',
    referencia: 'SINAPI-4002',
    descricaoOriginal: 'Contrapiso',
    etapa: 'REVESTIMENTOS DE PISO',
    subetapa: 'CONTRAPISOS ARGAMASSADOS',
    servicoSimplificado: 'Contrapisos Argamassados',
  },
  {
    id: '5.2.1',
    item: '5.2.1',
    referencia: 'SINAPI-4101',
    descricaoOriginal: 'Portas de madeira maciça',
    etapa: 'ESQUADRIAS',
    subetapa: 'PORTAS DE MADEIRA',
    servicoSimplificado: 'Portas de Madeira Maciça',
  },
  {
    id: '5.2.2',
    item: '5.2.2',
    referencia: 'SINAPI-4102',
    descricaoOriginal: 'Janelas de alumínio com vidro',
    etapa: 'ESQUADRIAS',
    subetapa: 'JANELAS DE ALUMÍNIO',
    servicoSimplificado: 'Janelas de Alumínio',
  },
  {
    id: '5.3.1',
    item: '5.3.1',
    referencia: 'SINAPI-4201',
    descricaoOriginal: 'Pintura externa acrílica',
    etapa: 'PINTURAS',
    subetapa: 'PINTURA PAREDES E TETO',
    servicoSimplificado: 'Pintura Acrílica',
  },
  {
    id: '5.3.2',
    item: '5.3.2',
    referencia: 'SINAPI-4202',
    descricaoOriginal: 'Pintura interna látex PVA',
    etapa: 'PINTURAS',
    subetapa: 'PINTURA PAREDES E TETO',
    servicoSimplificado: 'Pintura Tinta Látex / PVA',
  },
  
  // INSTALAÇÕES ELÉTRICAS / INFRAESTRUTURAS HIDROSSANITÁRIAS
  {
    id: '6.1.1',
    item: '6.1.1',
    referencia: 'SINAPI-5001',
    descricaoOriginal: 'Fiação elétrica (condutores)',
    etapa: 'INSTALAÇÕES ELÉTRICAS',
    subetapa: 'CABEAMENTO ELÉTRICO',
    servicoSimplificado: 'Cabeamento Interno',
  },
  {
    id: '6.1.2',
    item: '6.1.2',
    referencia: 'SINAPI-5002',
    descricaoOriginal: 'Quadros de distribuição',
    etapa: 'INSTALAÇÕES ELÉTRICAS',
    subetapa: 'ILUMINAÇÃO, ACABAMENTOS E EQUIPAMENTOS',
    servicoSimplificado: 'Quadros, Disjuntores e Acessórios',
  },
  {
    id: '6.1.3',
    item: '6.1.3',
    referencia: 'SINAPI-5003',
    descricaoOriginal: 'Luminárias LED para salas de aula',
    etapa: 'INSTALAÇÕES ELÉTRICAS',
    subetapa: 'ILUMINAÇÃO, ACABAMENTOS E EQUIPAMENTOS',
    servicoSimplificado: 'Postes e Luminárias',
  },
  {
    id: '6.2.1',
    item: '6.2.1',
    referencia: 'SINAPI-5101',
    descricaoOriginal: 'Tubulação de água (PVC)',
    etapa: 'INFRAESTRUTURAS HIDROSSANITÁRIAS',
    subetapa: 'INFRA ÁGUA FRIA',
    servicoSimplificado: 'Tubulações e Conexões (PVC)',
  },
  {
    id: '6.2.2',
    item: '6.2.2',
    referencia: 'SINAPI-5102',
    descricaoOriginal: 'Tubulação de esgoto (PVC)',
    etapa: 'INFRAESTRUTURAS HIDROSSANITÁRIAS',
    subetapa: 'INFRA ESGOTO E VENTILAÇÃO',
    servicoSimplificado: 'Tubulações e Conexões (PVC)',
  },
];

// ============================================
// VISÃO GERENCIAL
// ============================================
// Estrutura completa baseada na categorização
// Mostra 4 níveis: FASE, ETAPA, SUBETAPA, SERVIÇO SIMPLIFICADO
export const MOCK_VISAO_GERENCIAL_ITENS = [
  // FASE 1 - Infraestrutura
  {
    id: '1',
    numeroHierarquico: '1',
    referencia: '',
    descricao: 'Fase 01 - Infraestrutura',
    etapa: '',
    subetapa: '',
    servicoSimplificado: '',
    unidade: 'vb',
    quantidade: 1.0,
    precoUnitario: 2800000.0,
    precoTotal: 2800000.0,
    custoTotal: 225900.0, // Soma dos custos totais dos filhos
    lucroProjetado: 2574100.0,
    margem: 91.93,
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['1.1', '1.2', '1.3'],
    parentId: undefined,
  },
  // Etapa: Movimentação de Terra
  {
    id: '1.1',
    numeroHierarquico: '1.1',
    referencia: '',
    descricao: 'Movimentação de Terra',
    etapa: 'Movimentação de Terra',
    subetapa: '',
    servicoSimplificado: '',
    unidade: 'vb',
    quantidade: 1.0,
    precoUnitario: 950000.0,
    precoTotal: 950000.0,
    custoTotal: 24210.0,
    lucroProjetado: 925790.0,
    margem: 97.45,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.1.1', '1.1.2', '1.1.3'],
    parentId: '1',
  },
  {
    id: '1.1.1',
    numeroHierarquico: '1.1.1',
    referencia: 'SINAPI-1234',
    descricao: 'Escavação de Valas',
    etapa: 'Movimentação de Terra',
    subetapa: 'Escavação',
    servicoSimplificado: 'Escavação de Valas',
    unidade: 'm³',
    quantidade: 250.0,
    precoUnitario: 45.5,
    precoTotal: 11375.0,
    custoTotal: 10100.0,
    lucroProjetado: 1275.0,
    margem: 11.2,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.1',
  },
  {
    id: '1.1.2',
    numeroHierarquico: '1.1.2',
    referencia: 'SINAPI-1235',
    descricao: 'Compactação de Solo',
    etapa: 'Movimentação de Terra',
    subetapa: 'Aterro',
    servicoSimplificado: 'Compactação de Solo',
    unidade: 'm³',
    quantidade: 180.0,
    precoUnitario: 38.2,
    precoTotal: 6876.0,
    custoTotal: 4590.0,
    lucroProjetado: 2286.0,
    margem: 33.2,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.1',
  },
  {
    id: '1.1.3',
    numeroHierarquico: '1.1.3',
    referencia: 'SINAPI-1236',
    descricao: 'Nivelamento de Terreno',
    etapa: 'Movimentação de Terra',
    subetapa: 'Compactação',
    servicoSimplificado: 'Nivelamento de Terreno',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 12.5,
    precoTotal: 10625.0,
    custoTotal: 9520.0,
    lucroProjetado: 1105.0,
    margem: 10.4,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.1',
  },
  // Etapa: Fundações
  {
    id: '1.2',
    numeroHierarquico: '1.2',
    referencia: '',
    descricao: 'Fundações',
    etapa: 'Fundações',
    subetapa: '',
    servicoSimplificado: '',
    unidade: 'vb',
    quantidade: 1.0,
    precoUnitario: 1200000.0,
    precoTotal: 1200000.0,
    custoTotal: 129110.0,
    lucroProjetado: 1070890.0,
    margem: 89.24,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.2.1', '1.2.2', '1.2.3'],
    parentId: '1',
  },
  {
    id: '1.2.1',
    numeroHierarquico: '1.2.1',
    referencia: 'SICRO-5678',
    descricao: 'Concreto Estrutural',
    etapa: 'Fundações',
    subetapa: 'Concreto',
    servicoSimplificado: 'Concreto Estrutural',
    unidade: 'm³',
    quantidade: 150.0,
    precoUnitario: 450.0,
    precoTotal: 67500.0,
    custoTotal: 50550.0,
    lucroProjetado: 16950.0,
    margem: 25.1,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.2',
  },
  {
    id: '1.2.2',
    numeroHierarquico: '1.2.2',
    referencia: 'SICRO-5679',
    descricao: 'Armadura Estrutural',
    etapa: 'Fundações',
    subetapa: 'Armadura',
    servicoSimplificado: 'Armadura Estrutural',
    unidade: 'kg',
    quantidade: 8500.0,
    precoUnitario: 8.5,
    precoTotal: 72250.0,
    custoTotal: 68000.0,
    lucroProjetado: 4250.0,
    margem: 5.9,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.2',
  },
  {
    id: '1.2.3',
    numeroHierarquico: '1.2.3',
    referencia: 'SICRO-5680',
    descricao: 'Formas de Madeira',
    etapa: 'Fundações',
    subetapa: 'Formas',
    servicoSimplificado: 'Formas de Madeira',
    unidade: 'm²',
    quantidade: 320.0,
    precoUnitario: 35.0,
    precoTotal: 11200.0,
    custoTotal: 10560.0,
    lucroProjetado: 640.0,
    margem: 5.7,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.2',
  },
  // Etapa: Drenagem e Impermeabilização
  {
    id: '1.3',
    numeroHierarquico: '1.3',
    referencia: '',
    descricao: 'Drenagem e Impermeabilização',
    etapa: 'Drenagem e Impermeabilização',
    subetapa: '',
    servicoSimplificado: '',
    unidade: 'vb',
    quantidade: 1.0,
    precoUnitario: 650000.0,
    precoTotal: 650000.0,
    custoTotal: 33030.0,
    lucroProjetado: 616970.0,
    margem: 94.92,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.3.1', '1.3.2'],
    parentId: '1',
  },
  {
    id: '1.3.1',
    numeroHierarquico: '1.3.1',
    referencia: 'SINAPI-1240',
    descricao: 'Drenos Perimetrais',
    etapa: 'Drenagem e Impermeabilização',
    subetapa: 'Drenagem',
    servicoSimplificado: 'Drenos Perimetrais',
    unidade: 'm',
    quantidade: 180.0,
    precoUnitario: 85.0,
    precoTotal: 15300.0,
    custoTotal: 14580.0,
    lucroProjetado: 720.0,
    margem: 4.7,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.3',
  },
  {
    id: '1.3.2',
    numeroHierarquico: '1.3.2',
    referencia: 'SINAPI-1241',
    descricao: 'Impermeabilização',
    etapa: 'Drenagem e Impermeabilização',
    subetapa: 'Impermeabilização',
    servicoSimplificado: 'Impermeabilização',
    unidade: 'm²',
    quantidade: 450.0,
    precoUnitario: 42.5,
    precoTotal: 19125.0,
    custoTotal: 18450.0,
    lucroProjetado: 675.0,
    margem: 3.5,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '1.3',
  },
  
  // FASE 2 - Estrutura (resumido - mostra apenas alguns itens principais)
  {
    id: '2',
    numeroHierarquico: '2',
    referencia: '',
    descricao: 'Fase 02 - Estrutura',
    etapa: '',
    subetapa: '',
    servicoSimplificado: '',
    unidade: 'vb',
    quantidade: 1.0,
    precoUnitario: 3200000.0,
    precoTotal: 3200000.0,
    custoTotal: 450250.0,
    lucroProjetado: 2749750.0,
    margem: 85.93,
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['2.1', '2.2'],
    parentId: undefined,
  },
  {
    id: '2.1',
    numeroHierarquico: '2.1',
    referencia: '',
    descricao: 'Estrutura de Concreto Armado',
    etapa: 'Estrutura de Concreto Armado',
    subetapa: '',
    servicoSimplificado: '',
    unidade: 'vb',
    quantidade: 1.0,
    precoUnitario: 2200000.0,
    precoTotal: 2200000.0,
    custoTotal: 311250.0,
    lucroProjetado: 1888750.0,
    margem: 85.85,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['2.1.1', '2.1.2', '2.1.3'],
    parentId: '2',
  },
  {
    id: '2.1.1',
    numeroHierarquico: '2.1.1',
    referencia: 'SICRO-6001',
    descricao: 'Concreto Estrutural',
    etapa: 'Estrutura de Concreto Armado',
    subetapa: 'Concreto',
    servicoSimplificado: 'Concreto Estrutural',
    unidade: 'm³',
    quantidade: 280.0,
    precoUnitario: 520.0,
    precoTotal: 145600.0,
    custoTotal: 109200.0,
    lucroProjetado: 36400.0,
    margem: 25.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.1.2',
    numeroHierarquico: '2.1.2',
    referencia: 'SICRO-6002',
    descricao: 'Armadura Estrutural',
    etapa: 'Estrutura de Concreto Armado',
    subetapa: 'Armadura',
    servicoSimplificado: 'Armadura Estrutural',
    unidade: 'kg',
    quantidade: 18500.0,
    precoUnitario: 8.8,
    precoTotal: 162800.0,
    custoTotal: 157250.0,
    lucroProjetado: 5550.0,
    margem: 3.4,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.1.3',
    numeroHierarquico: '2.1.3',
    referencia: 'SICRO-6003',
    descricao: 'Formas de Madeira',
    etapa: 'Estrutura de Concreto Armado',
    subetapa: 'Formas',
    servicoSimplificado: 'Formas de Madeira',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 48.0,
    precoTotal: 40800.0,
    custoTotal: 40800.0,
    lucroProjetado: 0.0,
    margem: 0.0,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.2',
    numeroHierarquico: '2.2',
    referencia: '',
    descricao: 'Lajes',
    etapa: 'Lajes',
    subetapa: '',
    servicoSimplificado: '',
    unidade: 'vb',
    quantidade: 1.0,
    precoUnitario: 1000000.0,
    precoTotal: 1000000.0,
    custoTotal: 139000.0,
    lucroProjetado: 861000.0,
    margem: 86.1,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['2.2.1', '2.2.2'],
    parentId: '2',
  },
  {
    id: '2.2.1',
    numeroHierarquico: '2.2.1',
    referencia: 'SICRO-6101',
    descricao: 'Lajes Pré-fabricadas',
    etapa: 'Lajes',
    subetapa: 'Lajes',
    servicoSimplificado: 'Lajes Pré-fabricadas',
    unidade: 'm²',
    quantidade: 850.0,
    precoUnitario: 95.0,
    precoTotal: 80750.0,
    custoTotal: 78625.0,
    lucroProjetado: 2125.0,
    margem: 2.6,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.2',
  },
  {
    id: '2.2.2',
    numeroHierarquico: '2.2.2',
    referencia: 'SICRO-6102',
    descricao: 'Concreto de Preenchimento',
    etapa: 'Lajes',
    subetapa: 'Concreto',
    servicoSimplificado: 'Concreto de Preenchimento',
    unidade: 'm³',
    quantidade: 85.0,
    precoUnitario: 380.0,
    precoTotal: 32300.0,
    custoTotal: 29750.0,
    lucroProjetado: 2550.0,
    margem: 7.9,
    nivel: 2,
    tipo: 'item' as const,
    filhos: [],
    parentId: '2.2',
  },
  
  // FASE 3, 4, 5, 6 (resumidas para não sobrecarregar)
  // Em produção, esses dados seriam gerados dinamicamente
];

// ============================================
// CRONOGRAMA EXECUTIVO
// ============================================
// Baseado na Visão Gerencial, com datas e predecessoras
export const MOCK_CRONOGRAMA_TAREFAS = [
  // FASE 1 - Infraestrutura
  {
    id: '1',
    numeroHierarquico: '1',
    descricao: 'Fase 01 - Infraestrutura',
    dataInicio: '2024-01-15',
    dataTermino: '2024-06-30',
    duracao: 120, // dias úteis
    predecessoras: [],
    custoTotal: 225900.0,
    valorVenda: 2800000.0,
    margem: 91.93,
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['1.1', '1.2', '1.3'],
    parentId: undefined,
  },
  {
    id: '1.1',
    numeroHierarquico: '1.1',
    descricao: 'Movimentação de Terra',
    dataInicio: '2024-01-15',
    dataTermino: '2024-03-15',
    duracao: 40,
    predecessoras: [],
    custoTotal: 24210.0,
    valorVenda: 950000.0,
    margem: 97.45,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.1.1', '1.1.2', '1.1.3'],
    parentId: '1',
  },
  {
    id: '1.1.1',
    numeroHierarquico: '1.1.1',
    descricao: 'Escavação de Valas',
    dataInicio: '2024-01-15',
    dataTermino: '2024-02-15',
    duracao: 20,
    predecessoras: [],
    custoTotal: 10100.0,
    valorVenda: 11375.0,
    margem: 11.2,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.1',
  },
  {
    id: '1.1.2',
    numeroHierarquico: '1.1.2',
    descricao: 'Compactação de Solo',
    dataInicio: '2024-02-16',
    dataTermino: '2024-03-05',
    duracao: 15,
    predecessoras: ['1.1.1'],
    custoTotal: 4590.0,
    valorVenda: 6876.0,
    margem: 33.2,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.1',
  },
  {
    id: '1.1.3',
    numeroHierarquico: '1.1.3',
    descricao: 'Nivelamento de Terreno',
    dataInicio: '2024-03-06',
    dataTermino: '2024-03-15',
    duracao: 8,
    predecessoras: ['1.1.2'],
    custoTotal: 9520.0,
    valorVenda: 10625.0,
    margem: 10.4,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.1',
  },
  {
    id: '1.2',
    numeroHierarquico: '1.2',
    descricao: 'Fundações',
    dataInicio: '2024-03-16',
    dataTermino: '2024-05-30',
    duracao: 50,
    predecessoras: ['1.1'],
    custoTotal: 129110.0,
    valorVenda: 1200000.0,
    margem: 89.24,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.2.1', '1.2.2', '1.2.3'],
    parentId: '1',
  },
  {
    id: '1.2.1',
    numeroHierarquico: '1.2.1',
    descricao: 'Concreto Estrutural',
    dataInicio: '2024-04-01',
    dataTermino: '2024-05-15',
    duracao: 30,
    predecessoras: ['1.1.3'],
    custoTotal: 50550.0,
    valorVenda: 67500.0,
    margem: 25.1,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.2',
  },
  {
    id: '1.2.2',
    numeroHierarquico: '1.2.2',
    descricao: 'Armadura Estrutural',
    dataInicio: '2024-03-16',
    dataTermino: '2024-03-31',
    duracao: 12,
    predecessoras: ['1.1.3'],
    custoTotal: 68000.0,
    valorVenda: 72250.0,
    margem: 5.9,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.2',
  },
  {
    id: '1.2.3',
    numeroHierarquico: '1.2.3',
    descricao: 'Formas de Madeira',
    dataInicio: '2024-03-16',
    dataTermino: '2024-03-31',
    duracao: 12,
    predecessoras: ['1.1.3'],
    custoTotal: 10560.0,
    valorVenda: 11200.0,
    margem: 5.7,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.2',
  },
  {
    id: '1.3',
    numeroHierarquico: '1.3',
    descricao: 'Drenagem e Impermeabilização',
    dataInicio: '2024-05-16',
    dataTermino: '2024-06-30',
    duracao: 30,
    predecessoras: ['1.2'],
    custoTotal: 33030.0,
    valorVenda: 650000.0,
    margem: 94.92,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['1.3.1', '1.3.2'],
    parentId: '1',
  },
  {
    id: '1.3.1',
    numeroHierarquico: '1.3.1',
    descricao: 'Drenos Perimetrais',
    dataInicio: '2024-05-16',
    dataTermino: '2024-06-05',
    duracao: 15,
    predecessoras: ['1.2.1'],
    custoTotal: 14580.0,
    valorVenda: 15300.0,
    margem: 4.7,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.3',
  },
  {
    id: '1.3.2',
    numeroHierarquico: '1.3.2',
    descricao: 'Impermeabilização',
    dataInicio: '2024-06-06',
    dataTermino: '2024-06-30',
    duracao: 18,
    predecessoras: ['1.3.1'],
    custoTotal: 18450.0,
    valorVenda: 19125.0,
    margem: 3.5,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '1.3',
  },
  
  // FASE 2 - Estrutura
  {
    id: '2',
    numeroHierarquico: '2',
    descricao: 'Fase 02 - Estrutura',
    dataInicio: '2024-07-01',
    dataTermino: '2024-12-31',
    duracao: 120,
    predecessoras: ['1'],
    custoTotal: 450250.0,
    valorVenda: 3200000.0,
    margem: 85.93,
    nivel: 0,
    tipo: 'agrupador' as const,
    filhos: ['2.1', '2.2'],
    parentId: undefined,
  },
  {
    id: '2.1',
    numeroHierarquico: '2.1',
    descricao: 'Estrutura de Concreto Armado',
    dataInicio: '2024-07-01',
    dataTermino: '2024-10-31',
    duracao: 80,
    predecessoras: ['1.3'],
    custoTotal: 311250.0,
    valorVenda: 2200000.0,
    margem: 85.85,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['2.1.1', '2.1.2', '2.1.3'],
    parentId: '2',
  },
  {
    id: '2.1.1',
    numeroHierarquico: '2.1.1',
    descricao: 'Concreto Estrutural',
    dataInicio: '2024-07-15',
    dataTermino: '2024-10-15',
    duracao: 60,
    predecessoras: ['1.3.2'],
    custoTotal: 109200.0,
    valorVenda: 145600.0,
    margem: 25.0,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.1.2',
    numeroHierarquico: '2.1.2',
    descricao: 'Armadura Estrutural',
    dataInicio: '2024-07-01',
    dataTermino: '2024-09-30',
    duracao: 60,
    predecessoras: ['1.3.2'],
    custoTotal: 157250.0,
    valorVenda: 162800.0,
    margem: 3.4,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.1.3',
    numeroHierarquico: '2.1.3',
    descricao: 'Formas de Madeira',
    dataInicio: '2024-07-01',
    dataTermino: '2024-09-15',
    duracao: 50,
    predecessoras: ['1.3.2'],
    custoTotal: 40800.0,
    valorVenda: 40800.0,
    margem: 0.0,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '2.1',
  },
  {
    id: '2.2',
    numeroHierarquico: '2.2',
    descricao: 'Lajes',
    dataInicio: '2024-11-01',
    dataTermino: '2024-12-31',
    duracao: 40,
    predecessoras: ['2.1'],
    custoTotal: 139000.0,
    valorVenda: 1000000.0,
    margem: 86.1,
    nivel: 1,
    tipo: 'agrupador' as const,
    filhos: ['2.2.1', '2.2.2'],
    parentId: '2',
  },
  {
    id: '2.2.1',
    numeroHierarquico: '2.2.1',
    descricao: 'Lajes Pré-fabricadas',
    dataInicio: '2024-11-01',
    dataTermino: '2024-12-15',
    duracao: 30,
    predecessoras: ['2.1.1'],
    custoTotal: 78625.0,
    valorVenda: 80750.0,
    margem: 2.6,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '2.2',
  },
  {
    id: '2.2.2',
    numeroHierarquico: '2.2.2',
    descricao: 'Concreto de Preenchimento',
    dataInicio: '2024-12-16',
    dataTermino: '2024-12-31',
    duracao: 12,
    predecessoras: ['2.2.1'],
    custoTotal: 29750.0,
    valorVenda: 32300.0,
    margem: 7.9,
    nivel: 2,
    tipo: 'servico' as const,
    filhos: [],
    parentId: '2.2',
  },
  
  // Fases 3, 4, 5, 6 continuam seguindo o mesmo padrão
  // Em produção, esses dados seriam gerados dinamicamente a partir da Visão Gerencial
];

// ============================================
// MEDIÇÕES
// ============================================
export const MOCK_MEDICOES = [
  {
    id: 'MED-001',
    numero: '01',
    periodo: '2024-01',
    dataMedicao: '2024-01-31',
    status: 'finalizada' as const,
    itens: [
      {
        id: '1.1.1',
        item: '1.1.1',
        descricao: 'Escavação manual',
        unidade: 'm³',
        qtdContratada: 250.0,
        precoUnitario: 45.5,
        valorContratado: 11375.0,
        qtdAnteriorAcumulada: 0,
        valorAnteriorAcumulado: 0,
        saldoMedir: 250.0,
        saldoValorMedir: 11375.0,
        qtdAtual: 50.0,
        valorAtual: 2275.0,
        novoAcumulado: 50.0,
        novoValorAcumulado: 2275.0,
        novoSaldo: 200.0,
        novoSaldoValor: 9100.0,
        status: 'ok' as const,
        nivel: 2,
        tipo: 'item' as const,
        filhos: [],
        parentId: '1.1',
      },
    ],
    createdAt: '2024-01-31T10:00:00',
    updatedAt: '2024-01-31T10:00:00',
    createdBy: MOCK_USUARIO.nome,
  },
];

// ============================================
// ADITIVOS
// ============================================
export const MOCK_ADITIVOS = [
  {
    id: 'ADT-001',
    numero: '001',
    tipo: 'Aditivo',
    descricao: 'Aumento de escopo - Nova quadra esportiva',
    valor: 2500000.0,
    dataAplicacao: '2024-03-15',
    status: 'Aprovado',
  },
];

// ============================================
// REAJUSTES
// ============================================
export const MOCK_REAJUSTES = [
  {
    id: 'REJ-001',
    numero: '001',
    dataBase: '2024-01',
    indice: 'INCC',
    percentual: 5.2,
    valorReajuste: 650000.0,
    dataAplicacao: '2024-02-01',
    status: 'Aplicado',
  },
];

// ============================================
// EMPENHOS
// ============================================
export const MOCK_EMPENHOS = [
  {
    id: 'EMP-001',
    numero: '001/2024',
    valor: 500000.0,
    dataEmpenho: '2024-01-20',
    dataVencimento: '2024-04-20',
    status: 'Pendente',
  },
];

// ============================================
// CONTAS A PAGAR
// ============================================
export const MOCK_CONTAS_PAGAR = [
  {
    id: 'CP-001',
    descricao: 'Fornecimento de Concreto - Janeiro/2024',
    fornecedor: 'Concreteira XYZ Ltda',
    valor: 150000.0,
    vencimento: '2024-02-10',
    status: 'Pendente',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getObraById(id: string) {
  if (id === MOCK_OBRA.id || id === 'OBR-001') return MOCK_OBRA;
  return MOCK_OBRA; // Sempre retorna a mesma obra para exemplo
}

export function getConstrutoraById(id: string) {
  if (id === MOCK_CONSTRUTORA.id || id === 'C001') return MOCK_CONSTRUTORA;
  return MOCK_CONSTRUTORA;
}

export function getFundoById(id: string) {
  if (id === MOCK_FUNDO.id || id === 'FIDC-001') return MOCK_FUNDO;
  return MOCK_FUNDO;
}

export function getFiadorById(id: string) {
  if (id === MOCK_FIADOR.id || id === 'F001') return MOCK_FIADOR;
  return MOCK_FIADOR;
}

export function getAllConstrutoras() {
  return [MOCK_CONSTRUTORA];
}

export function getAllFundos() {
  return [MOCK_FUNDO];
}

export function getAllFiadores() {
  return [MOCK_FIADOR];
}

export function getAllObras() {
  return [MOCK_OBRA];
}

// Funções para buscar dados de planilha/orçamento
export function getPlanilhaContratualByObraId(obraId: string) {
  // Em produção, filtraria por obraId
  // Por enquanto, retorna a planilha completa
  return MOCK_PLANILHA_ITENS;
}

export function getCustosOrcadosByObraId(obraId: string) {
  // Em produção, filtraria por obraId
  return MOCK_CUSTOS_ITENS;
}

export function getCategorizacaoByObraId(obraId: string) {
  // Em produção, filtraria por obraId
  return MOCK_CATEGORIZACAO_ITENS;
}

export function getVisaoGerencialByObraId(obraId: string) {
  // Em produção, filtraria por obraId
  return MOCK_VISAO_GERENCIAL_ITENS;
}

export function getCronogramaByObraId(obraId: string) {
  // Em produção, filtraria por obraId
  return MOCK_CRONOGRAMA_TAREFAS;
}

export function getMedicoesByObraId(obraId: string) {
  // Em produção, filtraria por obraId
  return MOCK_MEDICOES;
}

// ============================================
// DADOS DE CONTRATO (Aditivos, Reajustes, Empenhos)
// ============================================

export interface ContratoInfo {
  valorGlobalInicial: number;
  valorAditivos: number;
  valorSupressoes: number;
  valorReajustes: number;
  valorAtualizado: number; // Valor global + aditivos - supressões + reajustes
  saldoEmpenhos: number;
  saldoContratual: number; // Valor atualizado - valor já medido/pago
}

export interface MedicoesInfo {
  quantidadeMedicoes: number;
  avancoFisico: number; // Percentual
  valorFinanceiroMedido: number; // Valor monetário já medido
  valorUltimaMedicao: number; // Valor da última medição realizada
}

export function getContratoInfoByObraId(obraId: string, valorFinanceiroMedido: number = 0): ContratoInfo {
  // Em produção, buscaria dados reais do banco
  const obra = getAllObras().find((o) => o.id === obraId);
  if (!obra) {
    return {
      valorGlobalInicial: 0,
      valorAditivos: 0,
      valorSupressoes: 0,
      valorReajustes: 0,
      valorAtualizado: 0,
      saldoEmpenhos: 0,
      saldoContratual: 0,
    };
  }

  // Mock: Valores de aditivos, supressões e reajustes
  const valorAditivos = 150000; // Mock
  const valorSupressoes = 50000; // Mock
  const valorReajustes = 250000; // Mock
  const valorAtualizado = obra.valorGlobal + valorAditivos - valorSupressoes + valorReajustes;

  // Mock: Empenhos
  const saldoEmpenhos = 4500000; // Mock

  // Calcular saldo contratual (valor atualizado - valor já medido)
  const saldoContratual = valorAtualizado - valorFinanceiroMedido;

  return {
    valorGlobalInicial: obra.valorGlobal,
    valorAditivos,
    valorSupressoes,
    valorReajustes,
    valorAtualizado,
    saldoEmpenhos,
    saldoContratual,
  };
}

export function getMedicoesInfoByObraId(obraId: string): MedicoesInfo {
  // Em produção, buscaria dados reais do banco
  const medicoes = getMedicoesByObraId(obraId);
  const medicoesFinalizadas = medicoes.filter((m) => m.status === 'finalizada');
  const quantidadeMedicoes = medicoesFinalizadas.length;

  // Mock: Calcular valor financeiro medido
  let valorFinanceiroMedido = 0;
  let valorUltimaMedicao = 0;

  if (medicoesFinalizadas.length > 0) {
    // Ordenar medições por data (mais recente primeiro)
    const medicoesOrdenadas = [...medicoesFinalizadas].sort((a, b) => 
      new Date(b.dataMedicao).getTime() - new Date(a.dataMedicao).getTime()
    );

    // Valor da última medição (soma dos valores atuais da última medição)
    const ultimaMedicao = medicoesOrdenadas[0];
    if (ultimaMedicao) {
      valorUltimaMedicao = ultimaMedicao.itens.reduce((sum, item) => {
        return sum + (item.valorAtual || 0);
      }, 0);
    }

    // Valor financeiro medido total: usar o maior novoValorAcumulado da última medição
    // Ou somar todos os valorAtual de todas as medições (mais simples)
    valorFinanceiroMedido = medicoesFinalizadas.reduce((total, medicao) => {
      const valorMedicao = medicao.itens.reduce((sum, item) => {
        return sum + (item.valorAtual || 0);
      }, 0);
      return total + valorMedicao;
    }, 0);
  }

  // Mock: Calcular avanço físico baseado nas medições
  const avancoFisico = 35.5; // Mock - percentual de execução física

  return {
    quantidadeMedicoes,
    avancoFisico,
    valorFinanceiroMedido,
    valorUltimaMedicao,
  };
}

// ============================================
// CONTRATANTES (SACADO)
// ============================================
export interface FonteRecurso {
  id: string;
  tipo: 'Convenio' | 'FinanciamentoPublico' | 'FinanciamentoPrivado' | 'RecursoProprio' | 'Outro';
  descricao: string;
  orgaoFonte?: string;
  numeroContrato?: string;
  valorTotal: number;
  saldoDisponivel: number;
  tempoMedioPagamento: number; // dias
  taxaAtraso: number; // percentual de pagamentos atrasados
  ultimoAtraso?: string; // data do último atraso
  risco: 'Baixo' | 'Médio' | 'Alto';
  observacoes?: string;
}

export interface IndicadorRisco {
  tempoMedioPagamento: number; // dias
  taxaAtraso: number; // percentual
  quantidadeAtrasos: number;
  maiorAtraso: number; // dias
  ultimoAtraso?: string; // data
  historicoPagamentos: Array<{
    data: string;
    valor: number;
    atraso: number; // dias de atraso (0 se em dia)
    status: 'Pago' | 'Atrasado' | 'Cancelado';
  }>;
}

export interface Contratante {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  tipo: 'Órgão Público Federal' | 'Órgão Público Estadual' | 'Órgão Público Municipal' | 'Empresa Privada' | 'Instituição';
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  status: 'Ativo' | 'Bloqueado' | 'Em Análise';
  risco: 'Baixo' | 'Médio' | 'Alto';
  tempoMedioPagamento: number; // dias
  indicadoresRisco: IndicadorRisco;
  fontesRecurso: FonteRecurso[];
}

export const MOCK_CONTRATANTES: Contratante[] = [
  {
    id: 'CTR-001',
    razaoSocial: 'Prefeitura Municipal de Maringá',
    nomeFantasia: 'Prefeitura de Maringá',
    cnpj: '12.345.678/0001-90',
    tipo: 'Órgão Público Municipal',
    endereco: 'Av. XV de Novembro, 701',
    cidade: 'Maringá',
    estado: 'PR',
    cep: '87013-230',
    telefone: '(44) 3221-1234',
    email: 'contato@maringa.pr.gov.br',
    status: 'Ativo',
    risco: 'Baixo',
    tempoMedioPagamento: 45,
    indicadoresRisco: {
      tempoMedioPagamento: 45,
      taxaAtraso: 5.2,
      quantidadeAtrasos: 2,
      maiorAtraso: 15,
      ultimoAtraso: '2024-01-15',
      historicoPagamentos: [
        { data: '2024-03-01', valor: 500000, atraso: 0, status: 'Pago' },
        { data: '2024-02-01', valor: 450000, atraso: 5, status: 'Atrasado' },
        { data: '2024-01-01', valor: 480000, atraso: 0, status: 'Pago' },
        { data: '2023-12-01', valor: 420000, atraso: 15, status: 'Atrasado' },
      ],
    },
    fontesRecurso: [
      {
        id: 'FR-001',
        tipo: 'Convenio',
        descricao: 'Convênio FNDE - Programa Nacional de Educação',
        orgaoFonte: 'FNDE',
        numeroContrato: 'CONV-001/2024',
        valorTotal: 5000000,
        saldoDisponivel: 2500000,
        tempoMedioPagamento: 60,
        taxaAtraso: 8.5,
        risco: 'Médio',
      },
      {
        id: 'FR-002',
        tipo: 'RecursoProprio',
        descricao: 'Recursos Próprios - Orçamento Municipal',
        valorTotal: 2000000,
        saldoDisponivel: 800000,
        tempoMedioPagamento: 30,
        taxaAtraso: 2.0,
        risco: 'Baixo',
      },
    ],
  },
  {
    id: 'CTR-002',
    razaoSocial: 'Secretaria de Estado da Educação do Paraná',
    nomeFantasia: 'SEED-PR',
    cnpj: '76.123.456/0001-00',
    tipo: 'Órgão Público Estadual',
    endereco: 'Av. Água Verde, 2140',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80240-900',
    telefone: '(41) 3340-1500',
    email: 'contato@seed.pr.gov.br',
    status: 'Ativo',
    risco: 'Médio',
    tempoMedioPagamento: 75,
    indicadoresRisco: {
      tempoMedioPagamento: 75,
      taxaAtraso: 18.5,
      quantidadeAtrasos: 5,
      maiorAtraso: 45,
      ultimoAtraso: '2024-02-20',
      historicoPagamentos: [
        { data: '2024-03-01', valor: 800000, atraso: 20, status: 'Atrasado' },
        { data: '2024-02-01', valor: 750000, atraso: 45, status: 'Atrasado' },
        { data: '2024-01-01', valor: 820000, atraso: 10, status: 'Atrasado' },
        { data: '2023-12-01', valor: 780000, atraso: 0, status: 'Pago' },
      ],
    },
    fontesRecurso: [
      {
        id: 'FR-003',
        tipo: 'FinanciamentoPublico',
        descricao: 'Financiamento BNDES - Programa de Infraestrutura',
        orgaoFonte: 'BNDES',
        numeroContrato: 'FIN-001/2023',
        valorTotal: 10000000,
        saldoDisponivel: 6000000,
        tempoMedioPagamento: 90,
        taxaAtraso: 25.0,
        risco: 'Alto',
        observacoes: 'Histórico de atrasos recorrentes',
      },
    ],
  },
  {
    id: 'CTR-003',
    razaoSocial: 'Construtora XYZ Empreendimentos Ltda',
    nomeFantasia: 'XYZ Empreendimentos',
    cnpj: '98.765.432/0001-11',
    tipo: 'Empresa Privada',
    endereco: 'Rua das Empresas, 500',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    telefone: '(11) 3456-7890',
    email: 'contato@xyzempreendimentos.com.br',
    status: 'Ativo',
    risco: 'Alto',
    tempoMedioPagamento: 120,
    indicadoresRisco: {
      tempoMedioPagamento: 120,
      taxaAtraso: 45.0,
      quantidadeAtrasos: 8,
      maiorAtraso: 90,
      ultimoAtraso: '2024-03-10',
      historicoPagamentos: [
        { data: '2024-03-01', valor: 300000, atraso: 90, status: 'Atrasado' },
        { data: '2024-02-01', valor: 280000, atraso: 60, status: 'Atrasado' },
        { data: '2024-01-01', valor: 320000, atraso: 45, status: 'Atrasado' },
        { data: '2023-12-01', valor: 250000, atraso: 30, status: 'Atrasado' },
      ],
    },
    fontesRecurso: [
      {
        id: 'FR-004',
        tipo: 'FinanciamentoPrivado',
        descricao: 'Linha de Crédito Banco ABC',
        orgaoFonte: 'Banco ABC',
        numeroContrato: 'FIN-PRIV-001/2023',
        valorTotal: 3000000,
        saldoDisponivel: 500000,
        tempoMedioPagamento: 120,
        taxaAtraso: 50.0,
        risco: 'Alto',
        observacoes: 'Alto risco - histórico de inadimplência',
      },
    ],
  },
];

export function getAllContratantes(): Contratante[] {
  return MOCK_CONTRATANTES;
}

export function getContratanteById(id: string): Contratante | undefined {
  return MOCK_CONTRATANTES.find((c) => c.id === id);
}

// ============================================
// FONTES DE RECURSO (INDEPENDENTES)
// ============================================
export interface FonteRecursoIndependente {
  id: string;
  tipo: 'Convenio' | 'FinanciamentoPublico' | 'FinanciamentoPrivado' | 'RecursoProprio' | 'Outro';
  descricao: string;
  orgaoFonte?: string;
  numeroContrato?: string;
  valorTotal: number;
  saldoDisponivel: number;
  status: 'Ativo' | 'Bloqueado' | 'Em Análise';
  risco: 'Baixo' | 'Médio' | 'Alto';
  indicadoresRisco: IndicadorRisco;
  observacoes?: string;
}

export const MOCK_FONTES_RECURSO: FonteRecursoIndependente[] = [
  {
    id: 'FR-IND-001',
    tipo: 'Convenio',
    descricao: 'Convênio FNDE - Programa Nacional de Educação',
    orgaoFonte: 'FNDE',
    numeroContrato: 'CONV-FNDE-001/2024',
    valorTotal: 15000000,
    saldoDisponivel: 8500000,
    status: 'Ativo',
    risco: 'Médio',
    indicadoresRisco: {
      tempoMedioPagamento: 60,
      taxaAtraso: 12.5,
      quantidadeAtrasos: 3,
      maiorAtraso: 25,
      ultimoAtraso: '2024-02-10',
      historicoPagamentos: [
        { data: '2024-03-01', valor: 1200000, atraso: 0, status: 'Pago' },
        { data: '2024-02-01', valor: 1150000, atraso: 25, status: 'Atrasado' },
        { data: '2024-01-01', valor: 1300000, atraso: 10, status: 'Atrasado' },
        { data: '2023-12-01', valor: 1250000, atraso: 0, status: 'Pago' },
      ],
    },
    observacoes: 'Convênio com histórico regular de pagamentos',
  },
  {
    id: 'FR-IND-002',
    tipo: 'FinanciamentoPublico',
    descricao: 'Financiamento BNDES - Programa de Infraestrutura',
    orgaoFonte: 'BNDES',
    numeroContrato: 'FIN-BNDES-001/2023',
    valorTotal: 50000000,
    saldoDisponivel: 30000000,
    status: 'Ativo',
    risco: 'Alto',
    indicadoresRisco: {
      tempoMedioPagamento: 90,
      taxaAtraso: 28.0,
      quantidadeAtrasos: 7,
      maiorAtraso: 60,
      ultimoAtraso: '2024-03-05',
      historicoPagamentos: [
        { data: '2024-03-01', valor: 2500000, atraso: 60, status: 'Atrasado' },
        { data: '2024-02-01', valor: 2400000, atraso: 45, status: 'Atrasado' },
        { data: '2024-01-01', valor: 2600000, atraso: 30, status: 'Atrasado' },
        { data: '2023-12-01', valor: 2300000, atraso: 0, status: 'Pago' },
      ],
    },
    observacoes: 'Histórico de atrasos recorrentes - requer atenção',
  },
  {
    id: 'FR-IND-003',
    tipo: 'RecursoProprio',
    descricao: 'Recursos Próprios - Orçamento Municipal',
    valorTotal: 8000000,
    saldoDisponivel: 3200000,
    status: 'Ativo',
    risco: 'Baixo',
    indicadoresRisco: {
      tempoMedioPagamento: 30,
      taxaAtraso: 3.0,
      quantidadeAtrasos: 1,
      maiorAtraso: 5,
      ultimoAtraso: '2023-11-15',
      historicoPagamentos: [
        { data: '2024-03-01', valor: 600000, atraso: 0, status: 'Pago' },
        { data: '2024-02-01', valor: 580000, atraso: 0, status: 'Pago' },
        { data: '2024-01-01', valor: 620000, atraso: 0, status: 'Pago' },
        { data: '2023-12-01', valor: 590000, atraso: 5, status: 'Atrasado' },
      ],
    },
  },
  {
    id: 'FR-IND-004',
    tipo: 'FinanciamentoPrivado',
    descricao: 'Linha de Crédito Banco ABC - Infraestrutura',
    orgaoFonte: 'Banco ABC',
    numeroContrato: 'FIN-PRIV-ABC-001/2023',
    valorTotal: 12000000,
    saldoDisponivel: 2000000,
    status: 'Ativo',
    risco: 'Alto',
    indicadoresRisco: {
      tempoMedioPagamento: 120,
      taxaAtraso: 45.0,
      quantidadeAtrasos: 9,
      maiorAtraso: 90,
      ultimoAtraso: '2024-03-12',
      historicoPagamentos: [
        { data: '2024-03-01', valor: 500000, atraso: 90, status: 'Atrasado' },
        { data: '2024-02-01', valor: 480000, atraso: 75, status: 'Atrasado' },
        { data: '2024-01-01', valor: 520000, atraso: 60, status: 'Atrasado' },
        { data: '2023-12-01', valor: 450000, atraso: 45, status: 'Atrasado' },
      ],
    },
    observacoes: 'Alto risco - histórico de inadimplência crítico',
  },
];

export function getAllFontesRecurso(): FonteRecursoIndependente[] {
  return MOCK_FONTES_RECURSO;
}

export function getFonteRecursoById(id: string): FonteRecursoIndependente | undefined {
  return MOCK_FONTES_RECURSO.find((f) => f.id === id);
}
