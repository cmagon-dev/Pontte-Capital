'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertCircle, Trash2, Building2, MapPin, FileText } from 'lucide-react';
import { atualizarObra, excluirObra } from '@/app/actions/obras';

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

interface InitialData {
  id: string;
  nome: string;
  construtoraId: string;
  contratanteId: string;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
  prazoMeses: string;
  dataInicio: string;
  dataFim: string;
  prazoExecucaoMeses: string;
  dataInicioExecucao: string;
  dataFimExecucao: string;
  valorContrato: string;
  status: string;
  cno: string;
  art: string;
  alvara: string;
  recursoFinanceiro: string;
}

interface Props {
  initialData: InitialData;
  construtoras: Construtora[];
  contratantes: Contratante[];
  fontesRecurso: FonteRecurso[];
}

export default function EditarObraForm({ initialData, construtoras, contratantes, fontesRecurso }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: initialData.nome,
    construtoraId: initialData.construtoraId,
    contratanteId: initialData.contratanteId,
    endereco: initialData.endereco,
    cidade: initialData.cidade,
    estado: initialData.estado,
    latitude: initialData.latitude,
    longitude: initialData.longitude,
    prazoMeses: initialData.prazoMeses,
    dataInicio: initialData.dataInicio,
    dataFim: initialData.dataFim,
    prazoExecucaoMeses: initialData.prazoExecucaoMeses,
    dataInicioExecucao: initialData.dataInicioExecucao,
    dataFimExecucao: initialData.dataFimExecucao,
    valorContrato: initialData.valorContrato,
    status: initialData.status,
    cno: initialData.cno,
    art: initialData.art,
    alvara: initialData.alvara,
    recursoFinanceiro: initialData.recursoFinanceiro,
  });

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
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

  const handleExcluir = async () => {
    const confirmacao = window.confirm(
      'Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.'
    );

    if (!confirmacao) return;

    setIsDeleting(true);
    setServerError(null);

    try {
      const result = await excluirObra(initialData.id);

      if (!result.success) {
        setServerError(result.message || 'Erro ao excluir obra');
        setIsDeleting(false);
        return;
      }

      // Sucesso - redirecionar para listagem
      router.push('/eng/contratos/contratos-obras');
      router.refresh();
    } catch (error) {
      console.error('Erro ao excluir obra:', error);
      setServerError('Erro inesperado ao excluir obra. Tente novamente.');
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
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

      const result = await atualizarObra(initialData.id, payload);

      if (!result.success) {
        setServerError(result.message || 'Erro ao atualizar obra');
        setIsSubmitting(false);
        return;
      }

      // Sucesso - redirecionar
      router.push(`/eng/contratos/contratos-obras/obra/${initialData.id}`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar obra:', error);
      setServerError('Erro inesperado ao atualizar obra. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/eng/contratos/contratos-obras/obra/${initialData.id}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Detalhes
        </Link>
        <h1 className="text-3xl font-bold text-white">Editar Obra</h1>
        <p className="text-slate-400 mt-1">UUID: {initialData.id}</p>
      </div>

      {/* Alerta Importante sobre Documentação */}
      <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-blue-300 font-semibold mb-1">📄 Documentação Obrigatória</h3>
            <p className="text-blue-200 text-sm">
              Não esqueça de anexar o <strong>Contrato Assinado</strong> e demais documentos na aba <strong>"Contrato"</strong> após salvar as alterações.
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Erro */}
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
              Dados Básicos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Nome da Obra *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Construtora *
                </label>
                <select
                  value={formData.construtoraId}
                  onChange={(e) => setFormData({ ...formData, construtoraId: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {construtoras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.razaoSocial}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Contratante (Sacado) *</label>
                <select
                  value={formData.contratanteId}
                  onChange={(e) => setFormData({ ...formData, contratanteId: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {contratantes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.razaoSocial}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Valor do Contrato *</label>
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
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="PARALISADA">Paralisada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Localização
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-400 mb-2">Endereço *</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
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
            </div>
          </div>

          {/* Datas */}
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
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleExcluir}
              disabled={isDeleting || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Excluir Obra
                </>
              )}
            </button>

            <div className="flex items-center gap-4">
              <Link
                href={`/eng/contratos/contratos-obras/obra/${initialData.id}`}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
