'use server';

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

// Schemas de validação
const UploadPlantaBaixaSchema = z.object({
  obraId: z.string().min(1, "ID da obra obrigatório"),
  nome: z.string().min(1, "Nome da planta obrigatório"),
  tipo: z.enum(['IMPLANTACAO', 'PAVIMENTO']),
  ordem: z.number().optional().nullable(),
});

const SetorSchema = z.object({
  plantaBaixaId: z.string().min(1, "ID da planta baixa obrigatório"),
  nome: z.string().min(1, "Nome do setor obrigatório"),
  cor: z.string().optional().nullable(),
  x: z.number().min(0).max(100, "Coordenada X deve estar entre 0 e 100"),
  y: z.number().min(0).max(100, "Coordenada Y deve estar entre 0 e 100"),
  width: z.number().min(0).max(100, "Largura deve estar entre 0 e 100"),
  height: z.number().min(0).max(100, "Altura deve estar entre 0 e 100"),
});

const PontoMonitoramentoSchema = z.object({
  plantaBaixaId: z.string().min(1, "ID da planta baixa obrigatório"),
  nome: z.string().min(1, "Nome do ponto obrigatório"),
  x: z.number().min(0).max(100, "Coordenada X deve estar entre 0 e 100"),
  y: z.number().min(0).max(100, "Coordenada Y deve estar entre 0 e 100"),
});

const VincularPlantaASetorSchema = z.object({
  plantaFilhaId: z.string().min(1, "ID da planta filha obrigatório"),
  setorId: z.string().min(1, "ID do setor obrigatório"),
});

const UploadFoto360Schema = z.object({
  pontoMonitoramentoId: z.string().min(1, "ID do ponto de monitoramento obrigatório"),
  dataCaptura: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
  usuarioId: z.string().optional().nullable(),
});

// 1. Upload de Planta Baixa
export async function uploadPlantaBaixa(formData: FormData) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION UPLOAD PLANTA BAIXA INICIADA");

    // Extrair dados do FormData
    const obraId = formData.get('obraId') as string;
    const nome = formData.get('nome') as string;
    const tipo = formData.get('tipo') as string;
    const ordem = formData.get('ordem') ? parseInt(formData.get('ordem') as string) : null;
    const file = formData.get('file') as File | null; // Imagem da área selecionada
    const pdfFile = formData.get('pdfFile') as File | null; // PDF original (opcional)

    if (!file) {
      return {
        success: false,
        message: "Arquivo de imagem obrigatório",
      };
    }

    // Validar dados
    const validatedFields = UploadPlantaBaixaSchema.safeParse({
      obraId,
      nome,
      tipo,
      ordem,
    });

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a obra existe
    const obra = await db.obra.findUnique({
      where: { id: payload.obraId },
    });

    if (!obra) {
      return {
        success: false,
        message: "Obra não encontrada",
      };
    }

    // Criar pasta de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'canteiro', payload.obraId, 'plantas');
    const pdfsDir = join(process.cwd(), 'public', 'uploads', 'canteiro', payload.obraId, 'pdfs');
    await mkdir(uploadsDir, { recursive: true });
    if (pdfFile) {
      await mkdir(pdfsDir, { recursive: true });
    }

    // Gerar nome único para os arquivos
    const timestamp = Date.now();
    const nomeArquivoImagem = `${timestamp}_${nome.replace(/\s+/g, '_')}_imagem.png`;
    const caminhoArquivoImagem = join(uploadsDir, nomeArquivoImagem);

    // Salvar imagem (área selecionada)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(caminhoArquivoImagem, buffer);

    // Salvar PDF original se fornecido
    let caminhoRelativoPdf: string | null = null;
    if (pdfFile) {
      const nomeArquivoPdf = `${timestamp}_${nome.replace(/\s+/g, '_')}_original.pdf`;
      const caminhoArquivoPdf = join(pdfsDir, nomeArquivoPdf);
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfBytes);
      await writeFile(caminhoArquivoPdf, pdfBuffer);
      caminhoRelativoPdf = `/uploads/canteiro/${payload.obraId}/pdfs/${nomeArquivoPdf}`;
    }

    // Caminho relativo da imagem para salvar no banco
    const caminhoRelativo = `/uploads/canteiro/${payload.obraId}/plantas/${nomeArquivoImagem}`;

    // Salvar no banco (apenas a imagem, o PDF fica salvo na pasta pdfs para referência)
    const plantaBaixa = await db.plantaBaixa.create({
      data: {
        obraId: payload.obraId,
        nome: payload.nome,
        tipo: payload.tipo,
        imagemUrl: caminhoRelativo, // Imagem da área selecionada
        ordem: payload.ordem || null,
      },
    });

    console.log("✅ SUCESSO! Planta baixa criada:", plantaBaixa.id);

    revalidatePath(`/eng/registros-360/${obra.construtoraId}/${payload.obraId}/configuracoes`);
    revalidatePath(`/eng/registros-360/${obra.construtoraId}/${payload.obraId}`);
    
    return { 
      success: true, 
      message: "Planta baixa cadastrada com sucesso!",
      plantaBaixa 
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    
    // Tentar remover arquivo órfão se o salvamento no banco falhou
    try {
      const obraId = formData.get('obraId') as string;
      const file = formData.get('file') as File | null;
      if (file && obraId) {
        const timestamp = Date.now();
        const nomeArquivo = `${timestamp}_${file.name}`;
        const caminhoArquivo = join(process.cwd(), 'public', 'uploads', 'canteiro', obraId, 'plantas', nomeArquivo);
        await unlink(caminhoArquivo);
        console.log("🧹 Arquivo órfão removido:", caminhoArquivo);
      }
    } catch (cleanupError) {
      console.warn("⚠️ Não foi possível remover arquivo órfão");
    }
    
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

// 2. Salvar Setor
export async function salvarSetor(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION SALVAR SETOR INICIADA");
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = SetorSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a planta baixa existe
    const plantaBaixa = await db.plantaBaixa.findUnique({
      where: { id: payload.plantaBaixaId },
    });

    if (!plantaBaixa) {
      return {
        success: false,
        message: "Planta baixa não encontrada",
      };
    }

    // Criar setor
    const setor = await db.setor.create({
      data: {
        plantaBaixaId: payload.plantaBaixaId,
        nome: payload.nome,
        cor: payload.cor || null,
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
      },
    });

    console.log("✅ SUCESSO! Setor criado:", setor.id);

    // Buscar obraId para revalidação
    const obra = await db.obra.findUnique({
      where: { id: plantaBaixa.obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      revalidatePath(`/eng/registros-360/${obra.construtoraId}/${plantaBaixa.obraId}/configuracoes/${payload.plantaBaixaId}`);
      revalidatePath(`/eng/registros-360/${obra.construtoraId}/${plantaBaixa.obraId}`);
    }

    return { 
      success: true, 
      message: "Setor cadastrado com sucesso!",
      setor 
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

// 3. Salvar Ponto de Monitoramento
export async function salvarPontoMonitoramento(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION SALVAR PONTO MONITORAMENTO INICIADA");
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = PontoMonitoramentoSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a planta baixa existe
    const plantaBaixa = await db.plantaBaixa.findUnique({
      where: { id: payload.plantaBaixaId },
    });

    if (!plantaBaixa) {
      return {
        success: false,
        message: "Planta baixa não encontrada",
      };
    }

    // Criar ponto
    const ponto = await db.pontoMonitoramento.create({
      data: {
        plantaBaixaId: payload.plantaBaixaId,
        nome: payload.nome,
        x: payload.x,
        y: payload.y,
        status: 'ATIVO',
      },
    });

    console.log("✅ SUCESSO! Ponto de monitoramento criado:", ponto.id);

    // Buscar obraId para revalidação
    const obra = await db.obra.findUnique({
      where: { id: plantaBaixa.obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      revalidatePath(`/eng/registros-360/${obra.construtoraId}/${plantaBaixa.obraId}/configuracoes/${payload.plantaBaixaId}`);
      revalidatePath(`/eng/registros-360/${obra.construtoraId}/${plantaBaixa.obraId}`);
    }

    return { 
      success: true, 
      message: "Ponto de monitoramento cadastrado com sucesso!",
      ponto 
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

// 4. Vincular Planta a Setor
export async function vincularPlantaASetor(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION VINCULAR PLANTA A SETOR INICIADA");
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = VincularPlantaASetorSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a planta e o setor existem
    const [planta, setor] = await Promise.all([
      db.plantaBaixa.findUnique({ where: { id: payload.plantaFilhaId } }),
      db.setor.findUnique({ where: { id: payload.setorId } }),
    ]);

    if (!planta) {
      return {
        success: false,
        message: "Planta não encontrada",
      };
    }

    if (!setor) {
      return {
        success: false,
        message: "Setor não encontrado",
      };
    }

    // Verificar se a planta filha pertence à mesma obra do setor
    const plantaSetor = await db.plantaBaixa.findUnique({
      where: { id: setor.plantaBaixaId },
    });

    if (!plantaSetor || plantaSetor.obraId !== planta.obraId) {
      return {
        success: false,
        message: "Planta e setor devem pertencer à mesma obra",
      };
    }

    // Atualizar planta com setorPaiId
    const plantaAtualizada = await db.plantaBaixa.update({
      where: { id: payload.plantaFilhaId },
      data: {
        setorPaiId: payload.setorId,
      },
    });

    console.log("✅ SUCESSO! Planta vinculada ao setor:", plantaAtualizada.id);

    // Buscar obraId para revalidação
    const obra = await db.obra.findUnique({
      where: { id: planta.obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      revalidatePath(`/eng/registros-360/${obra.construtoraId}/${planta.obraId}/configuracoes/${setor.plantaBaixaId}`);
      revalidatePath(`/eng/registros-360/${obra.construtoraId}/${planta.obraId}`);
    }

    return { 
      success: true, 
      message: "Planta vinculada ao setor com sucesso!",
      planta: plantaAtualizada 
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao vincular: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

// 5. Upload Foto 360
export async function uploadFoto360(formData: FormData) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION UPLOAD FOTO 360 INICIADA");

    // Extrair dados do FormData
    const pontoMonitoramentoId = formData.get('pontoMonitoramentoId') as string;
    const dataCaptura = formData.get('dataCaptura') as string;
    const usuarioId = formData.get('usuarioId') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        message: "Arquivo obrigatório",
      };
    }

    // Validar dados
    const validatedFields = UploadFoto360Schema.safeParse({
      pontoMonitoramentoId,
      dataCaptura,
      usuarioId: usuarioId || null,
    });

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se o ponto de monitoramento existe
    const pontoMonitoramento = await db.pontoMonitoramento.findUnique({
      where: { id: payload.pontoMonitoramentoId },
      include: {
        plantaBaixa: {
          include: {
            obra: {
              select: { construtoraId: true },
            },
          },
        },
      },
    });

    if (!pontoMonitoramento) {
      return {
        success: false,
        message: "Ponto de monitoramento não encontrado",
      };
    }

    // Criar pasta de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'canteiro', 'fotos-360');
    await mkdir(uploadsDir, { recursive: true });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const nomeArquivo = `${pontoMonitoramentoId}_${timestamp}.${fileExtension}`;
    const caminhoArquivo = join(uploadsDir, nomeArquivo);

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(caminhoArquivo, buffer);

    // Caminho relativo para salvar no banco
    const caminhoRelativo = `/uploads/canteiro/fotos-360/${nomeArquivo}`;

    // Salvar no banco
    const foto360 = await db.foto360.create({
      data: {
        pontoMonitoramentoId: payload.pontoMonitoramentoId,
        dataCaptura: new Date(payload.dataCaptura),
        urlArquivo: caminhoRelativo,
        usuarioId: payload.usuarioId || null,
      },
    });

    console.log("✅ SUCESSO! Foto 360 criada:", foto360.id);

    const construtoraId = pontoMonitoramento.plantaBaixa.obra.construtoraId;
    const obraId = pontoMonitoramento.plantaBaixa.obraId;

    revalidatePath(`/eng/registros-360/${construtoraId}/${obraId}`);
    
    return { 
      success: true, 
      message: "Foto 360 cadastrada com sucesso!",
      foto360 
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    
    // Tentar remover arquivo órfão se o salvamento no banco falhou
    try {
      const pontoMonitoramentoId = formData.get('pontoMonitoramentoId') as string;
      const file = formData.get('file') as File | null;
      if (file && pontoMonitoramentoId) {
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const nomeArquivo = `${pontoMonitoramentoId}_${timestamp}.${fileExtension}`;
        const caminhoArquivo = join(process.cwd(), 'public', 'uploads', 'canteiro', 'fotos-360', nomeArquivo);
        await unlink(caminhoArquivo);
        console.log("🧹 Arquivo órfão removido:", caminhoArquivo);
      }
    } catch (cleanupError) {
      console.warn("⚠️ Não foi possível remover arquivo órfão");
    }
    
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

// 6. Buscar Planta Baixa por ID (para edição)
export async function buscarPlantaBaixa(plantaId: string) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION BUSCAR PLANTA BAIXA INICIADA");
    console.log("🆔 Planta ID:", plantaId);

    const planta = await db.plantaBaixa.findUnique({
      where: { id: plantaId },
      include: {
        obra: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            construtoraId: true,
          },
        },
        pontos: {
          include: {
            fotos: {
              orderBy: {
                dataCaptura: 'desc',
              },
              take: 1, // Última foto
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        setores: {
          include: {
            plantasFilhas: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                imagemUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!planta) {
      return {
        success: false,
        message: "Planta baixa não encontrada",
        data: null,
      };
    }

    console.log("✅ SUCESSO! Planta baixa buscada:", plantaId);

    return {
      success: true,
      message: "Planta baixa buscada com sucesso",
      data: planta,
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao buscar planta: ${error?.message || "Erro interno do servidor"}`,
      data: null,
    };
  }
}

// 7. Buscar Dados da Obra (CRÍTICA)
export async function buscarDadosObra(obraId: string) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION BUSCAR DADOS OBRA INICIADA");
    console.log("🆔 Obra ID:", obraId);

    // Buscar obra com todas as plantas e relacionamentos
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      include: {
        plantasBaixas: {
          include: {
            setores: {
              include: {
                plantasFilhas: {
                  include: {
                    pontos: {
                      include: {
                        fotos: {
                          orderBy: {
                            dataCaptura: 'desc',
                          },
                          take: 1, // Pegar apenas a última foto
                        },
                      },
                    },
                  },
                },
              },
            },
            pontos: {
              include: {
                fotos: {
                  orderBy: {
                    dataCaptura: 'desc',
                  },
                  // Pegar todas as fotos para o viewer mostrar na timeline
                },
              },
            },
            setorPai: {
              include: {
                plantaBaixa: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { ordem: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!obra) {
      return {
        success: false,
        message: "Obra não encontrada",
        data: null,
      };
    }

    // Transformar dados para facilitar o uso no frontend
    // A estrutura já vem hierárquica do Prisma, mas podemos adicionar metadados
    const plantasFormatadas = obra.plantasBaixas.map((planta) => ({
      id: planta.id,
      obraId: planta.obraId,
      nome: planta.nome,
      tipo: planta.tipo,
      imagemUrl: planta.imagemUrl,
      ordem: planta.ordem,
      setorPaiId: planta.setorPaiId,
      createdAt: planta.createdAt,
      updatedAt: planta.updatedAt,
      totalPontos: planta.pontos.length,
      totalSetores: planta.setores.length,
      totalFotos: planta.pontos.reduce((sum, ponto) => sum + (ponto.fotos.length > 0 ? 1 : 0), 0),
      pontos: planta.pontos.map((ponto) => ({
        id: ponto.id,
        plantaBaixaId: ponto.plantaBaixaId,
        nome: ponto.nome,
        x: ponto.x,
        y: ponto.y,
        status: ponto.status,
        createdAt: ponto.createdAt,
        updatedAt: ponto.updatedAt,
        ultimaFoto: ponto.fotos[0] || null, // Última foto (já ordenada por dataCaptura desc)
        todasFotos: ponto.fotos, // Todas as fotos para o viewer
        totalFotos: ponto.fotos.length,
      })),
      setores: planta.setores.map((setor) => ({
        id: setor.id,
        plantaBaixaId: setor.plantaBaixaId,
        nome: setor.nome,
        cor: setor.cor,
        x: setor.x,
        y: setor.y,
        width: setor.width,
        height: setor.height,
        createdAt: setor.createdAt,
        updatedAt: setor.updatedAt,
        totalPlantasFilhas: setor.plantasFilhas.length,
        plantasFilhas: setor.plantasFilhas.map((plantaFilha) => ({
          id: plantaFilha.id,
          obraId: plantaFilha.obraId,
          nome: plantaFilha.nome,
          tipo: plantaFilha.tipo,
          imagemUrl: plantaFilha.imagemUrl,
          ordem: plantaFilha.ordem,
          setorPaiId: plantaFilha.setorPaiId,
          createdAt: plantaFilha.createdAt,
          updatedAt: plantaFilha.updatedAt,
          totalPontos: plantaFilha.pontos.length,
          totalFotos: plantaFilha.pontos.reduce((sum, ponto) => sum + (ponto.fotos.length > 0 ? 1 : 0), 0),
          pontos: plantaFilha.pontos.map((ponto) => ({
            id: ponto.id,
            plantaBaixaId: ponto.plantaBaixaId,
            nome: ponto.nome,
            x: ponto.x,
            y: ponto.y,
            status: ponto.status,
            createdAt: ponto.createdAt,
            updatedAt: ponto.updatedAt,
            ultimaFoto: ponto.fotos[0] || null,
            todasFotos: ponto.fotos,
            totalFotos: ponto.fotos.length,
          })),
        })),
      })),
    }));

    console.log("✅ SUCESSO! Dados da obra buscados:", obraId);

    return {
      success: true,
      message: "Dados buscados com sucesso",
      data: {
        obra: {
          id: obra.id,
          codigo: obra.codigo,
          nome: obra.nome,
          construtoraId: obra.construtoraId,
        },
        plantas: plantasFormatadas,
      },
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao buscar dados: ${error?.message || "Erro interno do servidor"}`,
      data: null,
    };
  }
}

// 8. Atualizar Planta Baixa
const AtualizarPlantaBaixaSchema = z.object({
  plantaId: z.string().min(1, "ID da planta obrigatório"),
  nome: z.string().min(1, "Nome da planta obrigatório"),
  tipo: z.enum(['IMPLANTACAO', 'PAVIMENTO']),
  ordem: z.number().optional().nullable(),
});

export async function atualizarPlantaBaixa(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION ATUALIZAR PLANTA BAIXA INICIADA");

    const validatedFields = AtualizarPlantaBaixaSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a planta existe
    const planta = await db.plantaBaixa.findUnique({
      where: { id: payload.plantaId },
      include: {
        obra: {
          select: {
            construtoraId: true,
          },
        },
      },
    });

    if (!planta) {
      return {
        success: false,
        message: "Planta não encontrada",
      };
    }

    // Atualizar
    const plantaAtualizada = await db.plantaBaixa.update({
      where: { id: payload.plantaId },
      data: {
        nome: payload.nome,
        tipo: payload.tipo,
        ordem: payload.ordem || null,
      },
    });

    console.log("✅ SUCESSO! Planta atualizada:", plantaAtualizada.id);

    revalidatePath(`/eng/registros-360/${planta.obra.construtoraId}/${planta.obraId}/configuracoes`);
    revalidatePath(`/eng/registros-360/${planta.obra.construtoraId}/${planta.obraId}`);
    
    return { 
      success: true, 
      message: "Planta atualizada com sucesso!",
      plantaBaixa: plantaAtualizada
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

// 9. Excluir Planta Baixa
export async function excluirPlantaBaixa(plantaId: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION EXCLUIR PLANTA BAIXA INICIADA");
    console.log("🆔 ID:", plantaId);

    // Verificar se a planta existe
    const planta = await db.plantaBaixa.findUnique({
      where: { id: plantaId },
      include: {
        obra: {
          select: {
            id: true,
            construtoraId: true,
          },
        },
        pontos: {
          include: {
            fotos: true,
          },
        },
        setores: true,
      },
    });

    if (!planta) {
      return {
        success: false,
        message: "Planta não encontrada",
      };
    }

    // Excluir arquivos relacionados
    try {
      // Excluir imagem da planta
      if (planta.imagemUrl) {
        const caminhoImagem = join(process.cwd(), 'public', planta.imagemUrl);
        try {
          await unlink(caminhoImagem);
          console.log("✅ Arquivo de imagem excluído:", caminhoImagem);
        } catch (fileError) {
          console.warn("⚠️ Arquivo de imagem não encontrado ou já excluído:", caminhoImagem);
        }
      }

      // Excluir fotos 360 dos pontos
      for (const ponto of planta.pontos) {
        for (const foto of ponto.fotos) {
          if (foto.urlArquivo) {
            const caminhoFoto = join(process.cwd(), 'public', foto.urlArquivo);
            try {
              await unlink(caminhoFoto);
              console.log("✅ Foto 360 excluída:", caminhoFoto);
            } catch (fileError) {
              console.warn("⚠️ Foto 360 não encontrada ou já excluída:", caminhoFoto);
            }
          }
        }
      }
    } catch (fileError) {
      console.warn("⚠️ Erro ao excluir arquivos (continuando com exclusão do banco):", fileError);
    }

    // Excluir do banco (CASCADE irá excluir pontos, setores e fotos automaticamente)
    await db.plantaBaixa.delete({
      where: { id: plantaId },
    });

    console.log("✅ SUCESSO! Planta excluída:", plantaId);
    
    revalidatePath(`/eng/registros-360/${planta.obra.construtoraId}/${planta.obraId}/configuracoes`);
    revalidatePath(`/eng/registros-360/${planta.obra.construtoraId}/${planta.obraId}`);
    
    return { 
      success: true, 
      message: "Planta excluída com sucesso!" 
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}
