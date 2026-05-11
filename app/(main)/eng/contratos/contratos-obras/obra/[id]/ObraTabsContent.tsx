'use client';

import { useState } from 'react';
import { FileText, Upload, TrendingUp, Receipt, FileCheck, Link2 } from 'lucide-react';
import DetalhesTab from './tabs/DetalhesTab';
import DocumentosTab from './tabs/DocumentosTab';
import AditivosTab from './tabs/AditivosTab';
import ReajustesTab from './tabs/ReajustesTab';
import EmpenhosTab from './tabs/EmpenhosTab';
import VinculosTab from './tabs/VinculosTab';

type TabType = 'detalhes' | 'documentos' | 'aditivos' | 'reajustes' | 'empenhos' | 'vinculos';

interface FonteRecurso {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  esfera: string;
}

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: number;
  prazoMeses?: number | null;
  dataInicio?: Date | string | null;
  dataFim?: Date | string | null;
  prazoExecucaoMeses?: number | null;
  dataInicioExecucao?: Date | string | null;
  dataFimExecucao?: Date | string | null;
  status: string;
  cno?: string | null;
  art?: string | null;
  alvara?: string | null;
  recursoFinanceiro?: string | null;
  fonteRecursoId?: string | null;
  fonteRecurso?: FonteRecurso | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  construtora: any;
  contratante?: any;
  construtoraId: string;
  contratanteId?: string | null;
}

interface ObraTabsContentProps {
  obra: Obra;
  documentos: any[];
  vinculoFundo: any;
  vinculosFiadores: any[];
  aditivos: any[];
  reajustes: any[];
  empenhos: any[];
}

export default function ObraTabsContent({ 
  obra, 
  documentos, 
  vinculoFundo, 
  vinculosFiadores, 
  aditivos, 
  reajustes, 
  empenhos 
}: ObraTabsContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('detalhes');

  const tabs = [
    { id: 'detalhes', label: 'Resumo', icon: FileText },
    { id: 'documentos', label: 'Contrato', icon: Upload },
    { id: 'aditivos', label: 'Aditivos/Supressões', icon: FileCheck },
    { id: 'reajustes', label: 'Reajustes', icon: TrendingUp },
    { id: 'empenhos', label: 'Empenhos', icon: Receipt },
    { id: 'vinculos', label: 'Vínculos', icon: Link2 },
  ];

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'detalhes' && (
          <DetalhesTab 
            obra={obra}
            aditivos={aditivos}
            reajustes={reajustes}
            empenhos={empenhos}
            documentos={documentos}
            vinculoFundo={vinculoFundo}
            vinculosFiadores={vinculosFiadores}
          />
        )}
        {activeTab === 'documentos' && <DocumentosTab obra={obra} documentos={documentos} />}
        {activeTab === 'aditivos' && <AditivosTab obraId={obra.id} aditivos={aditivos} />}
        {activeTab === 'reajustes' && <ReajustesTab obraId={obra.id} reajustes={reajustes} />}
        {activeTab === 'empenhos' && <EmpenhosTab obraId={obra.id} initialEmpenhos={empenhos} />}
        {activeTab === 'vinculos' && (
          <VinculosTab 
            obra={obra} 
            vinculoFundo={vinculoFundo}
            vinculosFiadores={vinculosFiadores}
          />
        )}
      </div>
    </div>
  );
}
