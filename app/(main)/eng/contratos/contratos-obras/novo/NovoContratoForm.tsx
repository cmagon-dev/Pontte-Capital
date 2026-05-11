'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, FileText, MapPin, Building2, Loader2, AlertCircle, ExternalLink, Plus, DollarSign, FileCheck } from 'lucide-react';
import { criarObra } from '@/app/actions/obras';

interface Construtora {
  id: string;
  codigo: string | null;
  razaoSocial: string;
  nomeFantasia: string | null;
}

interface Contratante {
  id: string;
  codigo: string | null;
  razaoSocial: string;
}

interface FonteRecurso {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  status: string;
}

interface NovoContratoFormProps {
  construtoras: Construtora[];
  contratantes: Contratante[];
  fontesRecurso: FonteRecurso[];
  construtoraIdPreSelecionada?: string;
}

export default function NovoContratoForm({ 
  construtoras, 
  contratantes,
  fontesRecurso,
  construtoraIdPreSelecionada 
}: NovoContratoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    construtoraId: construtoraIdPreSelecionada || '',
    contratanteId: '',
    endereco: '',
    cidade: '',
    estado: '',
    latitude: '',
    longitude: '',
    prazoMeses: '',
    dataInicio: '',
    dataFim: '',
    prazoExecucaoMeses: '',
    dataInicioExecucao: '',
    dataFimExecucao: '',
    valorContrato: '',
    status: 'NAO_INICIADA',
    // Novos campos
    cno: '',
    art: '',
    alvara: '',
    recursoFinanceiro: '',
  });

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const handleNovoContratante = () => {
    window.open('/cadastros/contratantes/novo', '_blank');
  };

  const handleNovaFonteRecurso = () => {
    window.open('/cadastros/fontes-recurso/novo', '_blank');
  };

  // Calcular prazo em meses automaticamente
  const calcularPrazoMeses = (dataInicio: string, dataFim: string): number | null => {
    if (!dataInicio || !dataFim) return null;
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (fim <= inicio) return null;
    
    const anos = fim.getFullYear() - inicio.getFullYear();
    const meses = fim.getMonth() - inicio.getMonth();
    const dias = fim.getDate() - inicio.getDate();
    
    let totalMeses = anos * 12 + meses;
    
    // Se houver dias extras, arredondar para cima
    if (dias > 0) {
      totalMeses += 1;
    }
    
    return totalMeses;
  };

  // Calcular prazo de execução em meses automaticamente
  const calcularPrazoExecucaoMeses = (dataInicio: string, dataFim: string): number | null => {
    if (!dataInicio || !dataFim) return null;
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (fim <= inicio) return null;
    
    const anos = fim.getFullYear() - inicio.getFullYear();
    const meses = fim.getMonth() - inicio.getMonth();
    const dias = fim.getDate() - inicio.getDate();
    
    let totalMeses = anos * 12 + meses;
    
    if (dias > 0) {
      totalMeses += 1;
    }
    
    return totalMeses;
  };

  const prazoCalculado = calcularPrazoMeses(formData.dataInicio, formData.dataFim);
  const prazoExecucaoCalculado = calcularPrazoExecucaoMeses(formData.dataInicioExecucao, formData.dataFimExecucao);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Preparar dados
      const payload = {
        nome: formData.nome,
        construtoraId: formData.construtoraId,
        contratanteId: formData.contratanteId || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        prazoMeses: prazoCalculado,
        dataInicio: formData.dataInicio || null,
        dataFim: formData.dataFim || null,
        prazoExecucaoMeses: prazoExecucaoCalculado,
        dataInicioExecucao: formData.dataInicioExecucao || null,
        dataFimExecucao: formData.dataFimExecucao || null,
        valorContrato: formData.valorContrato,
        status: formData.status,
        cno: formData.cno || null,
        art: formData.art || null,
        alvara: formData.alvara || null,
        recursoFinanceiro: formData.recursoFinanceiro || null,
      };

      // Chamar Server Action
      const result = await criarObra(payload);

      if (!result.success) {
        setServerError(result.message || "Erro ao criar obra");
        setIsSubmitting(false);
        return;
      }

      // Sucesso - redirecionar para a página de contrato da obra para anexar documentos
      const obraId = result.data?.id;
      if (obraId) {
        router.push(`/eng/contratos/contratos-obras/obra/${obraId}`);
      } else {
        router.push('/eng/contratos/contratos-obras');
      }
      router.refresh();
      
    } catch (error) {
      console.error('Erro ao criar obra:', error);
      setServerError('Erro inesperado ao criar obra. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  // Encontrar construtora selecionada
  const construtoraSelected = construtoras.find(c => c.id === formData.construtoraId);
  const isConstrutoraBloqueada = !!construtoraIdPreSelecionada;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/eng/contratos/contratos-obras"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nova Obra/Contrato</h1>
            <p className="text-slate-400">Cadastro do Centro de Custo (CC) - O "Gênesis" da Operação</p>
          </div>
        </div>
      </div>

      {/* Alerta Importante */}
      <div className="mb-6 p-4 bg-amber-900/30 border border-amber-600 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-amber-300 font-semibold mb-2">⚠️ Importante - Documentação Obrigatória</h3>
            <p className="text-amber-200 text-sm mb-2">
              Após criar a obra, você será direcionado para a página de contrato onde <strong>DEVE anexar obrigatoriamente</strong>:
            </p>
            <ul className="text-amber-200 text-sm list-disc list-inside space-y-1">
              <li><strong>Contrato Assinado</strong> da obra</li>
              <li>Outros documentos complementares (CNO, ART, Alvará, etc.)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Alerta de Erro do Servidor */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Dados Básicos */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dados Básicos da Obra
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Nome da Obra/Objeto *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Reforma e Ampliação da Escola Municipal Santa Rita"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Construtora *
                </label>
                {isConstrutoraBloqueada ? (
                  <div className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 flex items-center justify-between">
                    <span>
                      {construtoraSelected?.codigo} - {construtoraSelected?.razaoSocial}
                    </span>
                    <span className="text-xs text-slate-500">(Pré-selecionada)</span>
                  </div>
                ) : (
                  <select
                    value={formData.construtoraId}
                    onChange={(e) => setFormData({ ...formData, construtoraId: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione uma construtora...</option>
                    {construtoras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} - {c.razaoSocial}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Contratante (Sacado) *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.contratanteId}
                    onChange={(e) => setFormData({ ...formData, contratanteId: e.target.value })}
                    required
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {contratantes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} - {c.razaoSocial}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleNovoContratante}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    title="Adicionar Novo Contratante"
                  >
                    <Plus className="w-4 h-4" />
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Use o botão verde para adicionar um novo contratante</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Valor do Contrato (R$) *</label>
                <input
                  type="text"
                  value={formData.valorContrato}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    if (numericValue) {
                      const formatted = (parseFloat(numericValue) / 100).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                      setFormData({ ...formData, valorContrato: formatted });
                    } else {
                      setFormData({ ...formData, valorContrato: '' });
                    }
                  }}
                  placeholder="0,00"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
                {formData.valorContrato && (
                  <p className="text-xs text-green-400 mt-1 font-mono">{formatCurrency(formData.valorContrato)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="NAO_INICIADA">Não Iniciada</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="PARALISADA">Paralisada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Recurso Financeiro
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.recursoFinanceiro}
                    onChange={(e) => setFormData({ ...formData, recursoFinanceiro: e.target.value })}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione uma fonte de recurso...</option>
                    {fontesRecurso.map((fonte) => (
                      <option key={fonte.id} value={fonte.id}>
                        {fonte.codigo} - {fonte.nome} ({fonte.tipo})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleNovaFonteRecurso}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Adicionar nova fonte de recurso"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Use o botão verde para adicionar uma nova fonte de recurso
                </p>
              </div>
            </div>
          </div>

          {/* Documentação Técnica */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Documentação Técnica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">CNO - Cadastro Nacional de Obras</label>
                <input
                  type="text"
                  value={formData.cno}
                  onChange={(e) => setFormData({ ...formData, cno: e.target.value })}
                  placeholder="Ex: 12345678901234"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">ART - Anotação de Responsabilidade Técnica</label>
                <input
                  type="text"
                  value={formData.art}
                  onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                  placeholder="Ex: ART123456"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Alvará</label>
                <input
                  type="text"
                  value={formData.alvara}
                  onChange={(e) => setFormData({ ...formData, alvara: e.target.value })}
                  placeholder="Ex: ALV-2024-001"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Localização da Obra
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-400 mb-2">Endereço *</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Ex: Maringá"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Latitude</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="Ex: -23.5505"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Longitude</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="Ex: -46.6333"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Prazo de Vigência do Contrato */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Prazo de Vigência do Contrato</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data de Início da Vigência</label>
                <input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data de Término da Vigência</label>
                <input
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Prazo (Calculado)</label>
                <div className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-green-400 font-mono font-semibold flex items-center justify-center h-[42px]">
                  {prazoCalculado !== null ? `${prazoCalculado} meses` : '-'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
              </div>
            </div>
          </div>

          {/* Prazo de Execução da Obra */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Prazo de Execução da Obra</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data de Início da Execução</label>
                <input
                  type="date"
                  value={formData.dataInicioExecucao}
                  onChange={(e) => setFormData({ ...formData, dataInicioExecucao: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data de Término da Execução</label>
                <input
                  type="date"
                  value={formData.dataFimExecucao}
                  onChange={(e) => setFormData({ ...formData, dataFimExecucao: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Prazo de Execução (Calculado)</label>
                <div className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-green-400 font-mono font-semibold flex items-center justify-center h-[42px]">
                  {prazoExecucaoCalculado !== null ? `${prazoExecucaoCalculado} meses` : '-'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href="/eng/contratos/contratos-obras"
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Criar Obra
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
