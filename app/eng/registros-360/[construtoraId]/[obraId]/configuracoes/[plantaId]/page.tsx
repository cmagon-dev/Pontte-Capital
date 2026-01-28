'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Plus, Map, Settings, Layers, MapPin, Square, X, Check, Loader2, Camera, Calendar } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { buscarPlantaBaixa, salvarPontoMonitoramento, salvarSetor, uploadFoto360 } from '@/app/actions/canteiro-360';
import { formatDate } from '@/lib/utils/format';

// Tipos
type Ponto = {
  id: string;
  nome: string;
  x: number;
  y: number;
  status: string;
  plantaBaixaId: string;
};

type Setor = {
  id: string;
  nome: string;
  cor: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  plantaBaixaId: string;
  plantasFilhas: Array<{
    id: string;
    nome: string;
    tipo: string;
    imagemUrl: string | null;
  }>;
};

type PlantaBaixa = {
  id: string;
  nome: string;
  tipo: 'IMPLANTACAO' | 'PAVIMENTO';
  imagemUrl: string | null;
  obra: {
    id: string;
    codigo: string;
    nome: string;
    construtoraId: string;
  };
  pontos: Array<{
    id: string;
    nome: string;
    x: number;
    y: number;
    status: string;
    fotos: Array<{
      id: string;
      dataCaptura: Date;
      urlArquivo: string;
      pontoMonitoramentoId: string;
    }>;
  }>;
  setores: Array<{
    id: string;
    nome: string;
    cor: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    plantasFilhas: Array<{
      id: string;
      nome: string;
      tipo: string;
      imagemUrl: string | null;
    }>;
  }>;
};

type ModoEdicao = 'VIEW' | 'ADD_POINT' | 'DRAW_SECTOR';

type RetanguloTemporario = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} | null;

export default function Registros360EdicaoPlantaPage({ params }: { params: { construtoraId: string; obraId: string; plantaId: string } }) {
  const router = useRouter();
  
  // Estados principais
  const [planta, setPlanta] = useState<PlantaBaixa | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ModoEdicao>('VIEW');
  
  // Estados de modal
  const [modalNomePonto, setModalNomePonto] = useState(false);
  const [modalNomeSetor, setModalNomeSetor] = useState(false);
  const [modalDetalhesPonto, setModalDetalhesPonto] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState<PlantaBaixa['pontos'][0] | null>(null);
  const [nomePontoInput, setNomePontoInput] = useState('');
  const [nomeSetorInput, setNomeSetorInput] = useState('');
  const [corSetorInput, setCorSetorInput] = useState('#00FF00');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados temporários para criação
  const [pontoTemporario, setPontoTemporario] = useState<{ x: number; y: number } | null>(null);
  const [retanguloTemporario, setRetanguloTemporario] = useState<RetanguloTemporario>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Estados de salvamento
  const [saving, setSaving] = useState(false);
  
  // Estado para scale inicial calculado (auto-fit)
  const [initialScale, setInitialScale] = useState<number | null>(null);
  
  // Refs
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carregar dados da planta
  useEffect(() => {
    async function carregarPlanta() {
      try {
        setLoading(true);
        const resultado = await buscarPlantaBaixa(params.plantaId);
        
        if (resultado.success && resultado.data) {
          setPlanta(resultado.data);
        } else {
          console.error('Erro ao carregar planta:', resultado.message);
          alert('Erro ao carregar planta: ' + resultado.message);
        }
      } catch (error) {
        console.error('Erro ao carregar planta:', error);
        alert('Erro ao carregar planta');
      } finally {
        setLoading(false);
      }
    }

    carregarPlanta();
  }, [params.plantaId]);

  // Calcular scale inicial (auto-fit) quando a imagem carregar
  useEffect(() => {
    if (!planta?.imagemUrl || !imageRef.current || !containerRef.current) {
      setInitialScale(null);
      return;
    }

    const img = imageRef.current;
    const container = containerRef.current;

    const calcularScale = () => {
      // Aguardar um frame para garantir que a imagem e container tenham dimensões
      requestAnimationFrame(() => {
        if (!img || !container) return;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width || container.clientWidth;
        const containerHeight = containerRect.height || container.clientHeight;

        // Obter dimensões naturais da imagem
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        if (imgWidth === 0 || imgHeight === 0 || containerWidth === 0 || containerHeight === 0) {
          // Tentar novamente após um pequeno delay
          setTimeout(calcularScale, 200);
          return;
        }

        // Calcular escala necessária para caber no container
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const fitScale = Math.min(scaleX, scaleY);

        // Aplicar margem de segurança (10%)
        const finalScale = fitScale * 0.9;

        // Garantir que não seja menor que o mínimo (0.1)
        const clampedScale = Math.max(0.1, finalScale);

        setInitialScale(clampedScale);
      });
    };

    // Se a imagem já carregou, calcular imediatamente
    if (img.complete && img.naturalWidth > 0) {
      calcularScale();
    } else {
      // Caso contrário, aguardar o evento onLoad
      const handleLoad = () => {
        calcularScale();
        img.removeEventListener('load', handleLoad);
      };
      img.addEventListener('load', handleLoad);
    }

    // Recalcular ao redimensionar a janela
    const handleResize = () => {
      calcularScale();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [planta?.imagemUrl]);

  // Função para calcular coordenadas em porcentagem
  // Simplificada: usa offsetX/offsetY diretamente da imagem para evitar erros de paralaxe
  const calcularCoordenadasPercentuais = (e: React.MouseEvent<HTMLImageElement>): { x: number; y: number } | null => {
    if (!imageRef.current) return null;

    const img = imageRef.current;
    
    // Usar offsetX e offsetY que são relativos ao elemento da imagem
    // Isso elimina problemas com transformações CSS do zoom
    const offsetX = e.nativeEvent.offsetX;
    const offsetY = e.nativeEvent.offsetY;
    
    // Obter dimensões da imagem renderizada (já considerando zoom/pan via TransformComponent)
    const imgWidth = img.width || img.clientWidth;
    const imgHeight = img.height || img.clientHeight;
    
    // Converter para porcentagem (0-100) baseado nas dimensões renderizadas
    const percentX = (offsetX / imgWidth) * 100;
    const percentY = (offsetY / imgHeight) * 100;
    
    // Garantir que está dentro dos limites
    return {
      x: Math.max(0, Math.min(100, percentX)),
      y: Math.max(0, Math.min(100, percentY)),
    };
  };

  // Handler de clique na imagem
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode === 'VIEW') return;
    
    const coords = calcularCoordenadasPercentuais(e);
    if (!coords) return;

    if (mode === 'ADD_POINT') {
      // Salvar coordenadas temporárias e abrir modal
      setPontoTemporario(coords);
      setModalNomePonto(true);
      setMode('VIEW');
    } else if (mode === 'DRAW_SECTOR') {
      // Iniciar desenho do setor
      setRetanguloTemporario({
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
      });
      setIsDrawing(true);
    }
  };

  // Handler de movimento do mouse (para desenhar setor)
  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDrawing || !retanguloTemporario) return;
    
    // Usar offsetX/offsetY diretamente da imagem para precisão
    const offsetX = e.nativeEvent.offsetX;
    const offsetY = e.nativeEvent.offsetY;
    
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const imgWidth = img.width || img.clientWidth;
    const imgHeight = img.height || img.clientHeight;
    
    const percentX = (offsetX / imgWidth) * 100;
    const percentY = (offsetY / imgHeight) * 100;
    
    const coords = {
      x: Math.max(0, Math.min(100, percentX)),
      y: Math.max(0, Math.min(100, percentY)),
    };

    setRetanguloTemporario({
      ...retanguloTemporario,
      endX: coords.x,
      endY: coords.y,
    });
  };

  // Handler de soltar mouse (finalizar desenho do setor)
  const handleMouseUp = () => {
    if (!isDrawing || !retanguloTemporario) return;
    
    // Verificar se o retângulo tem tamanho mínimo
    const width = Math.abs(retanguloTemporario.endX - retanguloTemporario.startX);
    const height = Math.abs(retanguloTemporario.endY - retanguloTemporario.startY);
    
    if (width < 2 || height < 2) {
      // Retângulo muito pequeno, cancelar
      setRetanguloTemporario(null);
      setIsDrawing(false);
      setMode('VIEW');
      return;
    }
    
    // Normalizar coordenadas (garantir que startX/Y < endX/Y)
    const normalizedRect = {
      startX: Math.min(retanguloTemporario.startX, retanguloTemporario.endX),
      startY: Math.min(retanguloTemporario.startY, retanguloTemporario.endY),
      endX: Math.max(retanguloTemporario.startX, retanguloTemporario.endX),
      endY: Math.max(retanguloTemporario.startY, retanguloTemporario.endY),
    };
    
    setRetanguloTemporario(normalizedRect);
    setIsDrawing(false);
    setMode('VIEW');
    setModalNomeSetor(true);
  };

  // Confirmar criação de ponto
  const handleConfirmarPonto = async () => {
    if (!pontoTemporario || !nomePontoInput.trim() || !planta) return;

    try {
      setSaving(true);
      
      const resultado = await salvarPontoMonitoramento({
        plantaBaixaId: planta.id,
        nome: nomePontoInput.trim(),
        x: pontoTemporario.x,
        y: pontoTemporario.y,
      });

      if (resultado.success) {
        // Recarregar dados da planta
        const resultadoPlanta = await buscarPlantaBaixa(params.plantaId);
        if (resultadoPlanta.success && resultadoPlanta.data) {
          setPlanta(resultadoPlanta.data);
        }
        
        setModalNomePonto(false);
        setNomePontoInput('');
        setPontoTemporario(null);
        router.refresh();
      } else {
        alert('Erro ao salvar ponto: ' + resultado.message);
      }
    } catch (error) {
      console.error('Erro ao salvar ponto:', error);
      alert('Erro ao salvar ponto');
    } finally {
      setSaving(false);
    }
  };

  // Confirmar criação de setor
  const handleConfirmarSetor = async () => {
    if (!retanguloTemporario || !nomeSetorInput.trim() || !planta) return;

    try {
      setSaving(true);
      
      const width = retanguloTemporario.endX - retanguloTemporario.startX;
      const height = retanguloTemporario.endY - retanguloTemporario.startY;
      
      const resultado = await salvarSetor({
        plantaBaixaId: planta.id,
        nome: nomeSetorInput.trim(),
        cor: corSetorInput,
        x: retanguloTemporario.startX,
        y: retanguloTemporario.startY,
        width: width,
        height: height,
      });

      if (resultado.success) {
        // Recarregar dados da planta
        const resultadoPlanta = await buscarPlantaBaixa(params.plantaId);
        if (resultadoPlanta.success && resultadoPlanta.data) {
          setPlanta(resultadoPlanta.data);
        }
        
        setModalNomeSetor(false);
        setNomeSetorInput('');
        setCorSetorInput('#00FF00');
        setRetanguloTemporario(null);
        router.refresh();
      } else {
        alert('Erro ao salvar setor: ' + resultado.message);
      }
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      alert('Erro ao salvar setor');
    } finally {
      setSaving(false);
    }
  };

  // Cancelar modos de edição
  const handleCancelarEdicao = () => {
    setMode('VIEW');
    setPontoTemporario(null);
    setRetanguloTemporario(null);
    setIsDrawing(false);
  };

  // Handler de upload de foto 360
  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!pontoSelecionado || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    
    try {
      setUploadingFoto(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pontoMonitoramentoId', pontoSelecionado.id);
      formData.append('dataCaptura', new Date().toISOString());

      const resultado = await uploadFoto360(formData);

      if (resultado.success) {
        // Recarregar dados da planta
        const resultadoPlanta = await buscarPlantaBaixa(params.plantaId);
        if (resultadoPlanta.success && resultadoPlanta.data) {
          setPlanta(resultadoPlanta.data);
          // Atualizar ponto selecionado
          const pontoAtualizado = resultadoPlanta.data.pontos.find(p => p.id === pontoSelecionado.id);
          if (pontoAtualizado) {
            setPontoSelecionado(pontoAtualizado);
          }
        }
        router.refresh();
        alert('Foto 360 enviada com sucesso!');
      } else {
        alert('Erro ao enviar foto: ' + resultado.message);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploadingFoto(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando planta...</p>
        </div>
      </div>
    );
  }

  if (!planta) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">Planta não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/registros-360/${params.construtoraId}/${params.obraId}/configuracoes`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{planta.nome}</h1>
            <p className="text-slate-400">
              Edição de Marcações - {planta.tipo === 'IMPLANTACAO' ? 'Planta de Implantação' : 'Planta de Pavimento'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Obra: {planta.obra.codigo} | {planta.obra.nome}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Planta
        </button>
      </div>

      {/* Área Principal - Layout em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Área de Renderização da Planta (3 colunas) */}
        <div className="lg:col-span-3">
          {/* Toolbar sobre a planta */}
          <div className="bg-slate-800 border border-slate-700 rounded-t-lg p-3 flex items-center gap-3">
            <span className="text-sm text-slate-400">Ferramentas:</span>
            <button
              onClick={() => setMode(mode === 'ADD_POINT' ? 'VIEW' : 'ADD_POINT')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                mode === 'ADD_POINT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Adicionar Ponto
            </button>
            {planta.tipo === 'IMPLANTACAO' && (
              <button
                onClick={() => setMode(mode === 'DRAW_SECTOR' ? 'VIEW' : 'DRAW_SECTOR')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  mode === 'DRAW_SECTOR'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Square className="w-4 h-4" />
                Adicionar Setor/Link
              </button>
            )}
            {mode !== 'VIEW' && (
              <button
                onClick={handleCancelarEdicao}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>

          {/* Container do Mapa com Zoom/Pan */}
          <div 
            ref={containerRef}
            className="bg-slate-800 border-x border-b border-slate-700 rounded-b-lg min-h-[600px] relative overflow-hidden"
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isDrawing) {
                handleMouseUp();
              }
            }}
          >
            {mode !== 'VIEW' && (
              <div className="absolute top-4 left-4 bg-amber-900/80 border border-amber-700 rounded-lg p-2 text-xs text-amber-200 z-20">
                {mode === 'ADD_POINT' 
                  ? 'Clique na planta para adicionar um ponto de captura'
                  : 'Clique e arraste na planta para desenhar um setor'}
              </div>
            )}

            {planta.imagemUrl ? (
              <TransformWrapper
                disabled={isDrawing || mode !== 'VIEW'}
                initialScale={initialScale || 1}
                minScale={0.1}
                maxScale={4}
                centerOnInit
                limitToBounds={false}
                wheel={{ step: 0.05 }}
              >
                <TransformComponent>
                  <div 
                    className="relative"
                    style={{ cursor: mode !== 'VIEW' ? 'crosshair' : 'default' }}
                  >
                    <img
                      ref={imageRef}
                      src={planta.imagemUrl}
                      alt={planta.nome}
                      className="max-w-none select-none"
                      draggable={false}
                      onClick={handleImageClick}
                      onMouseMove={isDrawing ? handleMouseMove : undefined}
                    />

                    {/* Overlay para pontos e setores */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Renderizar setores existentes */}
                      {planta.setores.map((setor) => (
                        <div
                          key={setor.id}
                          className="absolute border-2 rounded pointer-events-auto cursor-pointer"
                          style={{
                            borderColor: setor.cor || '#00FF00',
                            backgroundColor: setor.cor ? `${setor.cor}20` : '#00FF0020',
                            left: `${setor.x}%`,
                            top: `${setor.y}%`,
                            width: `${setor.width}%`,
                            height: `${setor.height}%`,
                          }}
                          title={setor.nome}
                        >
                          <div 
                            className="absolute -top-6 left-0 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                            style={{ backgroundColor: setor.cor || '#00FF00' }}
                          >
                            {setor.nome}
                          </div>
                        </div>
                      ))}

                      {/* Renderizar retângulo temporário (enquanto desenha) */}
                      {retanguloTemporario && (
                        <div
                          className="absolute border-2 border-dashed border-green-500 bg-green-500/10"
                          style={{
                            left: `${retanguloTemporario.startX}%`,
                            top: `${retanguloTemporario.startY}%`,
                            width: `${Math.abs(retanguloTemporario.endX - retanguloTemporario.startX)}%`,
                            height: `${Math.abs(retanguloTemporario.endY - retanguloTemporario.startY)}%`,
                          }}
                        />
                      )}

                      {/* Renderizar pontos existentes */}
                      {planta.pontos.map((ponto) => (
                        <div
                          key={ponto.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-10"
                          style={{
                            left: `${ponto.x}%`,
                            top: `${ponto.y}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPontoSelecionado(ponto);
                            setModalDetalhesPonto(true);
                          }}
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:scale-125 transition-transform">
                            <MapPin className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap pointer-events-none">
                            {ponto.nome}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TransformComponent>
              </TransformWrapper>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Map className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg font-semibold">Área de Renderização da Planta</p>
                  <p className="text-slate-600 text-sm mt-2">Faça upload da imagem da planta baixa para começar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Pontos e Setores (1 coluna) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Elementos
            </h3>
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
              {/* Pontos */}
              <div>
                <p className="text-xs text-slate-500 mb-2 uppercase font-semibold">Pontos ({planta.pontos.length})</p>
                <div className="space-y-2">
                  {planta.pontos.map((ponto) => (
                    <div
                      key={ponto.id}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => {
                        setPontoSelecionado(ponto);
                        setModalDetalhesPonto(true);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-mono text-blue-400">{ponto.id.slice(0, 8)}...</span>
                        {ponto.fotos.length > 0 && (
                          <span className="ml-auto text-xs text-purple-400 flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {ponto.fotos.length}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white">{ponto.nome}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Coord: ({ponto.x.toFixed(1)}%, {ponto.y.toFixed(1)}%)
                      </p>
                    </div>
                  ))}
                  {planta.pontos.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Nenhum ponto cadastrado</p>
                  )}
                </div>
              </div>

              {/* Setores (apenas para implantação) */}
              {planta.tipo === 'IMPLANTACAO' && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase font-semibold">Setores ({planta.setores.length})</p>
                  <div className="space-y-2">
                    {planta.setores.map((setor) => (
                      <div
                        key={setor.id}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-green-500 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Square className="w-3 h-3" style={{ color: setor.cor || '#00FF00' }} />
                          <span className="text-xs font-mono text-green-400">{setor.id.slice(0, 8)}...</span>
                        </div>
                        <p className="text-sm text-white">{setor.nome}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {setor.plantasFilhas.length} planta(s) vinculada(s)
                        </p>
                      </div>
                    ))}
                    {planta.setores.length === 0 && (
                      <p className="text-xs text-slate-500 italic">Nenhum setor cadastrado</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Nome do Ponto */}
      {modalNomePonto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Nome do Ponto de Monitoramento</h3>
              <button
                onClick={() => {
                  setModalNomePonto(false);
                  setNomePontoInput('');
                  setPontoTemporario(null);
                }}
                className="p-1 hover:bg-slate-800 rounded"
                disabled={saving}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Nome do Ponto</label>
              <input
                type="text"
                value={nomePontoInput}
                onChange={(e) => setNomePontoInput(e.target.value)}
                placeholder="Ex: Ponto 01 - Entrada Principal"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                autoFocus
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !saving && nomePontoInput.trim()) {
                    handleConfirmarPonto();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setModalNomePonto(false);
                  setNomePontoInput('');
                  setPontoTemporario(null);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPonto}
                disabled={saving || !nomePontoInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nome do Setor */}
      {modalNomeSetor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Nome do Setor</h3>
              <button
                onClick={() => {
                  setModalNomeSetor(false);
                  setNomeSetorInput('');
                  setCorSetorInput('#00FF00');
                  setRetanguloTemporario(null);
                }}
                className="p-1 hover:bg-slate-800 rounded"
                disabled={saving}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Nome do Setor</label>
                <input
                  type="text"
                  value={nomeSetorInput}
                  onChange={(e) => setNomeSetorInput(e.target.value)}
                  placeholder="Ex: Torre A"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  autoFocus
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !saving && nomeSetorInput.trim()) {
                      handleConfirmarSetor();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Cor do Setor</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corSetorInput}
                    onChange={(e) => setCorSetorInput(e.target.value)}
                    className="w-16 h-10 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                    disabled={saving}
                  />
                  <input
                    type="text"
                    value={corSetorInput}
                    onChange={(e) => setCorSetorInput(e.target.value)}
                    placeholder="#00FF00"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 font-mono text-sm"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setModalNomeSetor(false);
                  setNomeSetorInput('');
                  setCorSetorInput('#00FF00');
                  setRetanguloTemporario(null);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarSetor}
                disabled={saving || !nomeSetorInput.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Ponto */}
      {modalDetalhesPonto && pontoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                {pontoSelecionado.nome}
              </h3>
              <button
                onClick={() => {
                  setModalDetalhesPonto(false);
                  setPontoSelecionado(null);
                }}
                className="p-1 hover:bg-slate-800 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Informações do Ponto */}
            <div className="mb-6 p-4 bg-slate-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">ID</p>
                  <p className="text-white font-mono">{pontoSelecionado.id}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Coordenadas</p>
                  <p className="text-white">
                    ({pontoSelecionado.x.toFixed(2)}%, {pontoSelecionado.y.toFixed(2)}%)
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Status</p>
                  <p className="text-white">{pontoSelecionado.status}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Total de Fotos</p>
                  <p className="text-white font-bold">{pontoSelecionado.fotos.length}</p>
                </div>
              </div>
            </div>

            {/* Upload de Nova Foto */}
            <div className="mb-6 p-4 bg-slate-800 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                Adicionar Foto 360
              </h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg"
                onChange={handleUploadFoto}
                disabled={uploadingFoto}
                className="hidden"
                id="foto360-upload"
              />
              <label
                htmlFor="foto360-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  uploadingFoto
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {uploadingFoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Selecionar Foto 360 (JPG Equirretangular)
                  </>
                )}
              </label>
              <p className="text-xs text-slate-400 mt-2">
                Selecione uma imagem JPG em formato equirretangular para visualização 360º
              </p>
            </div>

            {/* Histórico de Fotos */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Histórico de Fotos ({pontoSelecionado.fotos.length})
              </h4>
              {pontoSelecionado.fotos.length === 0 ? (
                <div className="text-center py-8 bg-slate-800 rounded-lg">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400">Nenhuma foto registrada ainda</p>
                  <p className="text-sm text-slate-500 mt-1">Faça upload da primeira foto 360º</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {pontoSelecionado.fotos
                    .sort((a, b) => new Date(b.dataCaptura).getTime() - new Date(a.dataCaptura).getTime())
                    .map((foto) => (
                      <div
                        key={foto.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-purple-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Camera className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-white font-medium">
                                {formatDate(new Date(foto.dataCaptura).toISOString())}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">{foto.id}</p>
                            </div>
                          </div>
                          <a
                            href={foto.urlArquivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Ver arquivo
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
