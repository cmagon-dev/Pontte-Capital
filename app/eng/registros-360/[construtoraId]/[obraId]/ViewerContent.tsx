'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Map, Camera, Calendar, Layers, X, Loader2 } from 'lucide-react';
import { buscarDadosObra } from '@/app/actions/canteiro-360';
import { formatDate } from '@/lib/utils/format';
import dynamic from 'next/dynamic';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Importar ReactPhotoSphereViewer dinamicamente (não SSR)
const ReactPhotoSphereViewer = dynamic(
  () => import('react-photo-sphere-viewer').then((mod) => mod.ReactPhotoSphereViewer),
  { ssr: false }
);

type Foto360 = {
  id: string;
  dataCaptura: Date;
  urlArquivo: string;
  pontoMonitoramentoId: string;
};

type Ponto = {
  id: string;
  nome: string;
  x: number;
  y: number;
  fotos: Foto360[];
};

type Setor = {
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
};

type PlantaImplantacao = {
  id: string;
  nome: string;
  imagemUrl: string | null;
  pontos: Ponto[];
  setores: Setor[];
};

type Obra = {
  id: string;
  codigo: string;
  nome: string;
};

export default function ViewerContent({
  params,
  obra,
  plantaImplantacao: plantaInicial,
}: {
  params: { construtoraId: string; obraId: string };
  obra: Obra;
  plantaImplantacao: PlantaImplantacao | null;
}) {
  const [planta, setPlanta] = useState<PlantaImplantacao | null>(plantaInicial);
  const [loading, setLoading] = useState(!plantaInicial);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [plantasFilhasDrawer, setPlantasFilhasDrawer] = useState<Array<{ id: string; nome: string }>>([]);
  const [pontoSelecionado, setPontoSelecionado] = useState<Ponto | null>(null);
  const [fotoSelecionada, setFotoSelecionada] = useState<Foto360 | null>(null);
  const viewerRef = useRef<any>(null);

  // Recarregar dados se necessário
  useEffect(() => {
    if (!planta) {
      async function carregarDados() {
        try {
          setLoading(true);
          const resultado = await buscarDadosObra(params.obraId);
          
          if (resultado.success && resultado.data) {
            const implantacao = resultado.data.plantas.find(p => p.tipo === 'IMPLANTACAO');
            if (implantacao) {
              setPlanta({
                id: implantacao.id,
                nome: implantacao.nome,
                imagemUrl: implantacao.imagemUrl,
                pontos: implantacao.pontos.map(p => ({
                  id: p.id,
                  nome: p.nome,
                  x: p.x,
                  y: p.y,
                  fotos: (p.todasFotos || (p.ultimaFoto ? [p.ultimaFoto] : [])).map(f => ({
                    id: f.id,
                    dataCaptura: new Date(f.dataCaptura),
                    urlArquivo: f.urlArquivo,
                    pontoMonitoramentoId: p.id,
                  })),
                })),
                setores: implantacao.setores.map(s => ({
                  id: s.id,
                  nome: s.nome,
                  cor: s.cor,
                  x: s.x,
                  y: s.y,
                  width: s.width,
                  height: s.height,
                  plantasFilhas: s.plantasFilhas || [],
                })),
              });
            }
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setLoading(false);
        }
      }
      carregarDados();
    }
  }, [params.obraId, planta]);

  const handleSetorClick = (setor: Setor) => {
    setPlantasFilhasDrawer(setor.plantasFilhas.map(p => ({ id: p.id, nome: p.nome })));
    setDrawerAberto(true);
  };

  const handlePontoClick = (ponto: Ponto) => {
    setPontoSelecionado(ponto);
    
    // Buscar a foto mais recente do ponto
    if (ponto.fotos && ponto.fotos.length > 0) {
      const fotoMaisRecente = ponto.fotos.sort((a, b) => 
        new Date(b.dataCaptura).getTime() - new Date(a.dataCaptura).getTime()
      )[0];
      setFotoSelecionada(fotoMaisRecente);
    } else {
      setFotoSelecionada(null);
    }
  };

  const handleNavegarParaPlanta = (plantaId: string) => {
    // TODO: Implementar navegação para planta filha
    setDrawerAberto(false);
    alert(`Navegar para planta: ${plantaId} (A ser implementado)`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando visualizador...</p>
        </div>
      </div>
    );
  }

  if (!planta) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md text-center">
          <Map className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma planta de implantação encontrada</h2>
          <p className="text-slate-400 mb-6">
            Para começar a usar o Registros 360º, você precisa criar uma planta de implantação para esta obra.
          </p>
          <Link
            href={`/eng/registros-360/${params.construtoraId}/${params.obraId}/configuracoes`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Settings className="w-5 h-5" />
            Ir para Configurações
          </Link>
        </div>
      </div>
    );
  }

  // Buscar todas as fotos do ponto selecionado para a timeline
  const todasFotosDoPonto = pontoSelecionado?.fotos || [];

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/registros-360/${params.construtoraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{planta.nome}</h1>
            <p className="text-sm text-slate-400">
              {obra.codigo} - {obra.nome}
            </p>
          </div>
        </div>
        <Link
          href={`/eng/registros-360/${params.construtoraId}/${params.obraId}/configuracoes`}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
          Gerenciar Plantas
        </Link>
      </div>

      {/* Área Principal - Mapa e Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área do Mapa (2/3 da tela) */}
        <div className="flex-1 bg-slate-900 border-r border-slate-800 relative overflow-hidden">
          {planta.imagemUrl ? (
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit
              limitToBounds={false}
              wheel={{ step: 0.1 }}
            >
              <TransformComponent>
                <div className="absolute inset-0 p-8 flex items-center justify-center relative">
                  <img
                    src={planta.imagemUrl}
                    alt={planta.nome}
                    className="max-w-none select-none"
                    draggable={false}
                  />

                  {/* Renderizar setores clicáveis */}
                  {planta.setores.map((setor) => (
                    <div
                      key={setor.id}
                      className="absolute border-2 rounded cursor-pointer hover:opacity-80 transition-opacity z-10 pointer-events-auto"
                      style={{
                        borderColor: setor.cor || '#00FF00',
                        backgroundColor: setor.cor ? `${setor.cor}30` : '#00FF0030',
                        left: `${setor.x}%`,
                        top: `${setor.y}%`,
                        width: `${setor.width}%`,
                        height: `${setor.height}%`,
                      }}
                      onClick={() => handleSetorClick(setor)}
                      title={`${setor.nome} - Clique para ver plantas`}
                    >
                      <div 
                        className="absolute -top-6 left-0 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold"
                        style={{ backgroundColor: setor.cor || '#00FF00' }}
                      >
                        {setor.nome}
                      </div>
                    </div>
                  ))}

                  {/* Renderizar pontos clicáveis */}
                  {planta.pontos.map((ponto) => (
                    <div
                      key={ponto.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 pointer-events-auto ${
                        pontoSelecionado?.id === ponto.id ? 'z-30' : ''
                      }`}
                      style={{
                        left: `${ponto.x}%`,
                        top: `${ponto.y}%`,
                      }}
                      onClick={() => handlePontoClick(ponto)}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 shadow-lg hover:scale-125 transition-transform ${
                        pontoSelecionado?.id === ponto.id 
                          ? 'bg-blue-600 border-yellow-400 scale-125' 
                          : 'bg-blue-500 border-white'
                      }`}></div>
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap pointer-events-none">
                        {ponto.nome}
                      </div>
                    </div>
                  ))}
                </div>
              </TransformComponent>
            </TransformWrapper>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map className="w-32 h-32 mx-auto mb-4 text-slate-700" />
                <p className="text-slate-500 text-lg font-semibold">Planta de Implantação</p>
                <p className="text-slate-600 text-sm mt-2">Faça upload da imagem da planta</p>
              </div>
            </div>
          )}
        </div>

        {/* Viewer 360 (1/3 da tela) */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              Viewer 360º
            </h3>
            {pontoSelecionado && (
              <p className="text-sm text-slate-400 mt-2">{pontoSelecionado.nome}</p>
            )}
          </div>
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {fotoSelecionada ? (
              <div className="w-full h-full">
                <ReactPhotoSphereViewer
                  src={fotoSelecionada.urlArquivo}
                  height="100%"
                  width="100%"
                  containerClass="w-full h-full"
                  ref={viewerRef}
                  navbar={[
                    'zoom',
                    'move',
                    'fullscreen',
                  ]}
                  loadingImg={undefined}
                  onReady={(instance: any) => {
                    viewerRef.current = instance;
                  }}
                />
              </div>
            ) : pontoSelecionado ? (
              <div className="text-center p-4">
                <Camera className="w-16 h-16 mx-auto mb-2 text-slate-700" />
                <p className="text-slate-600 text-sm">Nenhuma foto disponível</p>
                <p className="text-slate-700 text-xs mt-1">Faça upload de uma foto 360º no editor</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <Camera className="w-16 h-16 mx-auto mb-2 text-slate-700" />
                <p className="text-slate-600 text-sm">Clique em um ponto no mapa</p>
                <p className="text-slate-700 text-xs mt-1">para visualizar a foto 360º</p>
              </div>
            )}
          </div>
          {/* Timeline de Registros */}
          {pontoSelecionado && todasFotosDoPonto.length > 0 && (
            <div className="p-4 border-t border-slate-800 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Timeline de Registros
              </h4>
              <div className="space-y-2">
                {todasFotosDoPonto
                  .sort((a, b) => new Date(b.dataCaptura).getTime() - new Date(a.dataCaptura).getTime())
                  .map((foto) => (
                    <div
                      key={foto.id}
                      className={`bg-slate-800 border rounded-lg p-3 hover:border-blue-500 transition-colors cursor-pointer ${
                        fotoSelecionada?.id === foto.id ? 'border-blue-500' : 'border-slate-700'
                      }`}
                      onClick={() => setFotoSelecionada(foto)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-mono text-blue-400">{foto.id.slice(0, 8)}...</span>
                      </div>
                      <p className="text-sm text-white">{formatDate(new Date(foto.dataCaptura).toISOString())}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer: Lista de Plantas Filhas */}
      {drawerAberto && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDrawerAberto(false)}>
          <div
            className="fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Plantas do Setor</h3>
                <button
                  onClick={() => setDrawerAberto(false)}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-2">
                {plantasFilhasDrawer.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    Nenhuma planta vinculada a este setor
                  </p>
                ) : (
                  plantasFilhasDrawer.map((planta) => (
                    <button
                      key={planta.id}
                      onClick={() => handleNavegarParaPlanta(planta.id)}
                      className="w-full flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors text-left"
                    >
                      <Layers className="w-5 h-5 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{planta.nome}</p>
                        <p className="text-xs text-slate-400 font-mono">{planta.id}</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
