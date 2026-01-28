"use server";

import { db } from "@/lib/db";

/**
 * Tipos de permissões para versionamento
 */
export type PermissaoVersao = 
  | 'visualizar_historico'      // Ver histórico de alterações
  | 'comparar_versoes'          // Comparar versões
  | 'criar_aditivo'             // Criar novo aditivo
  | 'criar_revisao'             // Criar revisão geral
  | 'criar_glosa'               // Criar glosa (supressão)
  | 'migrar_medicoes'           // Migrar medições para nova versão
  | 'recalcular_percentuais'    // Recalcular percentuais de medições
  | 'aprovar_aditivo'           // Aprovar aditivos (workflow futuro)
  | 'excluir_versao';           // Excluir versão (ação crítica)

/**
 * Níveis de acesso (exemplo simplificado)
 */
export type NivelAcesso = 'visualizador' | 'editor' | 'gestor' | 'administrador';

/**
 * Mapa de permissões por nível de acesso
 */
const PERMISSOES_POR_NIVEL: Record<NivelAcesso, PermissaoVersao[]> = {
  visualizador: [
    'visualizar_historico',
    'comparar_versoes',
  ],
  editor: [
    'visualizar_historico',
    'comparar_versoes',
    'recalcular_percentuais',
  ],
  gestor: [
    'visualizar_historico',
    'comparar_versoes',
    'criar_aditivo',
    'criar_revisao',
    'criar_glosa',
    'migrar_medicoes',
    'recalcular_percentuais',
  ],
  administrador: [
    'visualizar_historico',
    'comparar_versoes',
    'criar_aditivo',
    'criar_revisao',
    'criar_glosa',
    'migrar_medicoes',
    'recalcular_percentuais',
    'aprovar_aditivo',
    'excluir_versao',
  ],
};

/**
 * Verifica se um usuário tem uma permissão específica
 */
export async function verificarPermissao(
  usuarioId: string,
  obraId: string,
  permissao: PermissaoVersao
): Promise<{
  temPermissao: boolean;
  nivel?: NivelAcesso;
  mensagem?: string;
}> {
  try {
    // TODO: Implementar lógica real de busca de permissões do banco
    // Por enquanto, retorna permissão de gestor como padrão
    const nivelUsuario: NivelAcesso = 'gestor';

    const permissoesDoNivel = PERMISSOES_POR_NIVEL[nivelUsuario];
    const temPermissao = permissoesDoNivel.includes(permissao);

    if (!temPermissao) {
      return {
        temPermissao: false,
        nivel: nivelUsuario,
        mensagem: `Seu nível de acesso (${nivelUsuario}) não permite executar esta ação. Permissão necessária: ${permissao}`
      };
    }

    return {
      temPermissao: true,
      nivel: nivelUsuario,
    };
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return {
      temPermissao: false,
      mensagem: 'Erro ao verificar permissões. Entre em contato com o administrador.'
    };
  }
}

/**
 * Registra uma ação de versionamento no log de auditoria
 */
export async function registrarAcaoVersao(
  obraId: string,
  usuarioId: string,
  acao: string,
  detalhes?: any
) {
  try {
    // TODO: Implementar tabela de log de auditoria
    // Por enquanto, apenas loga no console
    console.log('[AUDITORIA] Ação de versionamento:', {
      obraId,
      usuarioId,
      acao,
      detalhes,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Ação registrada com sucesso'
    };
  } catch (error) {
    console.error('Erro ao registrar ação:', error);
    return {
      success: false,
      message: 'Erro ao registrar ação de auditoria'
    };
  }
}

/**
 * Valida se uma ação pode ser executada com base em regras de negócio
 */
export async function validarAcaoVersao(
  obraId: string,
  acao: 'criar_aditivo' | 'criar_revisao' | 'criar_glosa' | 'migrar_medicoes' | 'excluir_versao',
  dadosAcao?: any
): Promise<{
  valido: boolean;
  mensagem?: string;
}> {
  try {
    // Buscar versão ativa
    const versaoAtiva = await db.versaoOrcamento.findFirst({
      where: {
        obraId,
        ativa: true,
      }
    });

    if (!versaoAtiva) {
      return {
        valido: false,
        mensagem: 'Nenhuma versão ativa encontrada para esta obra.'
      };
    }

    // Validações específicas por ação
    switch (acao) {
      case 'criar_aditivo':
      case 'criar_revisao':
      case 'criar_glosa':
        // Verificar se já existe uma versão sendo criada
        const versaoEmCriacao = await db.versaoOrcamento.findFirst({
          where: {
            obraId,
            numero: versaoAtiva.numero + 1,
          }
        });

        if (versaoEmCriacao) {
          return {
            valido: false,
            mensagem: `Já existe uma nova versão (v${versaoEmCriacao.numero}) sendo preparada. Finalize ou cancele antes de criar outra.`
          };
        }
        break;

      case 'migrar_medicoes':
        // Verificar se existem medições para migrar
        const medicoes = await db.previsaoMedicao.count({
          where: {
            obraId,
            status: { not: 'REALIZADA' }, // Só migra medições não concluídas
          }
        });

        if (medicoes === 0) {
          return {
            valido: false,
            mensagem: 'Não há medições pendentes para migrar.'
          };
        }
        break;

      case 'excluir_versao':
        // Não pode excluir versão ativa
        if (dadosAcao?.versaoId === versaoAtiva.id) {
          return {
            valido: false,
            mensagem: 'Não é possível excluir a versão ativa. Ative outra versão primeiro.'
          };
        }

        // Verificar se existem medições usando esta versão
        const medicoesVersao = await db.previsaoMedicao.count({
          where: {
            versaoOrcamentoId: dadosAcao?.versaoId,
          }
        });

        if (medicoesVersao > 0) {
          return {
            valido: false,
            mensagem: `Esta versão está sendo usada por ${medicoesVersao} medição(ões). Não é possível excluir.`
          };
        }
        break;
    }

    return {
      valido: true,
    };
  } catch (error) {
    console.error('Erro ao validar ação:', error);
    return {
      valido: false,
      mensagem: 'Erro ao validar ação. Tente novamente.'
    };
  }
}

/**
 * Wrapper que combina verificação de permissão e validação de regras
 */
export async function autorizarAcaoVersao(
  usuarioId: string,
  obraId: string,
  acao: PermissaoVersao,
  dadosAcao?: any
): Promise<{
  autorizado: boolean;
  mensagem?: string;
}> {
  // 1. Verificar permissão do usuário
  const permissao = await verificarPermissao(usuarioId, obraId, acao);
  
  if (!permissao.temPermissao) {
    return {
      autorizado: false,
      mensagem: permissao.mensagem || 'Permissão negada.'
    };
  }

  // 2. Validar regras de negócio (apenas para ações críticas)
  const acoesCriticas: PermissaoVersao[] = ['criar_aditivo', 'criar_revisao', 'criar_glosa', 'migrar_medicoes', 'excluir_versao'];
  
  if (acoesCriticas.includes(acao)) {
    const validacao = await validarAcaoVersao(
      obraId, 
      acao as any, 
      dadosAcao
    );

    if (!validacao.valido) {
      return {
        autorizado: false,
        mensagem: validacao.mensagem || 'Ação não pode ser executada no momento.'
      };
    }
  }

  // 3. Registrar ação na auditoria
  await registrarAcaoVersao(obraId, usuarioId, acao, dadosAcao);

  return {
    autorizado: true,
  };
}

/**
 * Obtém descrição amigável de uma permissão
 */
export function obterDescricaoPermissao(permissao: PermissaoVersao): string {
  const descricoes: Record<PermissaoVersao, string> = {
    visualizar_historico: 'Visualizar histórico de alterações',
    comparar_versoes: 'Comparar versões do contrato',
    criar_aditivo: 'Criar aditivo contratual',
    criar_revisao: 'Criar revisão geral',
    criar_glosa: 'Criar glosa (supressão)',
    migrar_medicoes: 'Migrar medições para nova versão',
    recalcular_percentuais: 'Recalcular percentuais de medições',
    aprovar_aditivo: 'Aprovar aditivos contratuais',
    excluir_versao: 'Excluir versão do contrato',
  };

  return descricoes[permissao] || permissao;
}

/**
 * Lista todas as permissões de um nível de acesso
 */
export function listarPermissoesNivel(nivel: NivelAcesso): {
  permissao: PermissaoVersao;
  descricao: string;
}[] {
  const permissoes = PERMISSOES_POR_NIVEL[nivel];
  
  return permissoes.map(p => ({
    permissao: p,
    descricao: obterDescricaoPermissao(p),
  }));
}
