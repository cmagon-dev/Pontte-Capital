'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { atualizarFonteRecurso, excluirFonteRecurso } from '@/app/actions/fontes-recurso';

interface FonteRecurso {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  esfera: string;
  orgao: string | null;
  instituicao: string | null;
  numeroProcesso: string | null;
  status: string;
  observacoes: string | null;
}

interface Props {
  fonte: FonteRecurso;
}

export default function EditarFonteRecursoForm({ fonte }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    nome: fonte.nome,
    tipo: fonte.tipo,
    esfera: fonte.esfera,
    orgao: fonte.orgao || '',
    instituicao: fonte.instituicao || '',
    numeroProcesso: fonte.numeroProcesso || '',
    status: fonte.status,
    observacoes: fonte.observacoes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await atualizarFonteRecurso(fonte.id, {
        nome: formData.nome,
        tipo: formData.tipo as any,
        esfera: formData.esfera as any,
        orgao: formData.orgao || undefined,
        instituicao: formData.instituicao || undefined,
        numeroProcesso: formData.numeroProcesso || undefined,
        status: formData.status as any,
        observacoes: formData.observacoes || undefined,
      });

      if (result.success) {
        alert('Fonte de recurso atualizada com sucesso!');
        router.push('/cadastros/fontes-recurso');
        router.refresh();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar fonte de recurso. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a fonte "${formData.nome}"?`)) return;

    setIsDeleting(true);

    try {
      const result = await excluirFonteRecurso(fonte.id);

      if (result.success) {
        alert('Fonte de recurso excluída com sucesso!');
        router.push('/cadastros/fontes-recurso');
        router.refresh();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir fonte de recurso. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/cadastros/fontes-recurso"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Fontes de Recurso
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Editar Fonte de Recurso</h1>
        <p className="text-slate-400">
          Código: <span className="text-blue-400 font-mono font-semibold">{fonte.codigo}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Formulário igual ao de criar, mas com valores preenchidos */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Dados Básicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Nome da Fonte *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CONVENIO">Convênio</option>
                  <option value="FINANCIAMENTO">Financiamento</option>
                  <option value="PROPRIO">Recurso Próprio</option>
                  <option value="MISTO">Misto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Esfera *</label>
                <select
                  value={formData.esfera}
                  onChange={(e) => setFormData({ ...formData, esfera: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="FEDERAL">Federal</option>
                  <option value="ESTADUAL">Estadual</option>
                  <option value="MUNICIPAL">Municipal</option>
                  <option value="PRIVADO">Privado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {formData.tipo === 'CONVENIO' ? 'Órgão' : 'Instituição Financeira'}
                </label>
                <input
                  type="text"
                  value={formData.tipo === 'CONVENIO' ? formData.orgao : formData.instituicao}
                  onChange={(e) => {
                    if (formData.tipo === 'CONVENIO') {
                      setFormData({ ...formData, orgao: e.target.value });
                    } else {
                      setFormData({ ...formData, instituicao: e.target.value });
                    }
                  }}
                  placeholder={formData.tipo === 'CONVENIO' ? 'Ex: Ministério das Cidades' : 'Ex: Caixa Econômica Federal'}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Número do Processo</label>
                <input
                  type="text"
                  value={formData.numeroProcesso}
                  onChange={(e) => setFormData({ ...formData, numeroProcesso: e.target.value })}
                  placeholder="Ex: CV-2024-001"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Observações</h2>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              placeholder="Informações adicionais sobre a fonte de recurso..."
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Ações */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Excluindo...' : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Excluir Fonte
                </>
              )}
            </button>

            <div className="flex items-center gap-4">
              <Link
                href="/cadastros/fontes-recurso"
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : (
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
