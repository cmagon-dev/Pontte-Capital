'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Building2,
  Users,
  FolderKanban,
  Hammer,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Receipt,
  BarChart3,
  ClipboardList,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle2,
  Landmark,
  Camera,
  LogOut,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import type { ChavePermissao } from '@/lib/permissoes';

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  permissao?: ChavePermissao;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    permissao: 'dashboard:ver',
  },
  {
    label: 'Cadastros',
    icon: <Building2 className="w-5 h-5" />,
    permissao: 'cadastros:ver',
    children: [
      { label: 'Fundos (Cessionários)', href: '/cadastros/fundos', icon: <FolderKanban className="w-4 h-4" /> },
      { label: 'Construtoras (Cedentes)', href: '/cadastros/construtoras', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Fiadores (Avalistas)', href: '/cadastros/fiadores', icon: <Users className="w-4 h-4" /> },
      { label: 'Contratantes (Sacados)', href: '/cadastros/contratantes', icon: <Landmark className="w-4 h-4" /> },
      { label: 'Fontes de Recurso', href: '/cadastros/fontes-recurso', icon: <Banknote className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Engenharia',
    icon: <Hammer className="w-5 h-5" />,
    permissao: 'eng:ver',
    children: [
      { label: 'Contratos', href: '/eng/contratos/contratos-obras', icon: <FileText className="w-4 h-4" /> },
      { label: 'Orçamento', href: '/eng/orcamento', icon: <DollarSign className="w-4 h-4" /> },
      { label: 'Plan. & Medições', href: '/eng/plan-medicoes', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'Acompanhamento', href: '/eng/acompanhamento', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Registros 360º', href: '/eng/registros-360', icon: <Camera className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Financeiro',
    icon: <DollarSign className="w-5 h-5" />,
    permissao: 'fin:ver',
    children: [
      { label: 'Cadastros', href: '/fin/cadastros', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Operações', href: '/fin/operacoes', icon: <Wallet className="w-4 h-4" /> },
      { label: 'Acompanhamento', href: '/fin/acompanhamento', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Relatórios', href: '/fin/relatorios', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Aprovações',
    icon: <CheckCircle2 className="w-5 h-5" />,
    children: [
      {
        label: 'Contratos',
        href: '/aprovacoes/contratos',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: 'Engenharia (Técnica)',
        href: '/aprovacoes/engenharia',
        icon: <Hammer className="w-4 h-4" />,
        permissao: 'aprovacoes:engenharia:ver',
      },
      {
        label: 'Financeiro (Fundo)',
        href: '/aprovacoes/financeiro',
        icon: <DollarSign className="w-4 h-4" />,
        permissao: 'aprovacoes:financeiro:ver',
      },
    ],
  },
  {
    label: 'Admin',
    icon: <Settings className="w-5 h-5" />,
    permissao: 'admin:ver',
    children: [
      {
        label: 'Usuários',
        href: '/admin/usuarios',
        icon: <Users className="w-4 h-4" />,
        permissao: 'admin:usuarios:gerenciar',
      },
      {
        label: 'Perfis e Permissões',
        href: '/admin/parametros/perfis',
        icon: <ShieldCheck className="w-4 h-4" />,
        permissao: 'admin:perfis:gerenciar',
      },
    ],
  },
];

function filterMenuItems(items: MenuItem[], permissoes: string[]): MenuItem[] {
  return items
    .filter((item) => !item.permissao || permissoes.includes(item.permissao))
    .map((item) => ({
      ...item,
      children: item.children ? filterMenuItems(item.children, permissoes) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0 || item.href);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const permissoes = session?.user?.permissoes ?? [];
  const visibleItems = filterMenuItems(menuItems, permissoes);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isParentActive = (item: MenuItem): boolean => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => {
        if (child.href && isActive(child.href)) return true;
        if (child.children) {
          return child.children.some((grandchild) => isActive(grandchild.href));
        }
        return false;
      });
    }
    return false;
  };

  const parseLabel = (label: string) => {
    const match = label.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      return { title: match[1].trim(), subtitle: match[2].trim() };
    }
    return { title: label, subtitle: null };
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const menuKey = `${item.label}-${level}`;
    const isOpen = openMenus.includes(menuKey);
    const isItemActive = isParentActive(item);
    const { title, subtitle } = parseLabel(item.label);

    return (
      <li key={item.label}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleMenu(menuKey)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                isItemActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <div className="flex flex-col">
                  <span className={`${level === 0 ? 'text-sm font-medium' : 'text-sm'}`}>{title}</span>
                  {subtitle && (
                    <span className="text-xs text-slate-400 mt-0.5">{subtitle}</span>
                  )}
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isOpen && (
              <ul className="mt-1 space-y-1">
                {item.children!.map((child) => renderMenuItem(child, level + 1))}
              </ul>
            )}
          </>
        ) : (
          <Link
            href={item.href || '#'}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : level === 0
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {item.icon}
            <div className="flex flex-col">
              <span className={`${level === 0 ? 'text-sm font-medium' : 'text-sm'}`}>{title}</span>
              {subtitle && (
                <span className={`text-xs mt-0.5 ${
                  isActive(item.href) ? 'text-blue-200' : 'text-slate-400'
                }`}>{subtitle}</span>
              )}
            </div>
          </Link>
        )}
      </li>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 h-screen">
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Pontte Capital</h1>
        <p className="text-xs text-slate-400 mt-1">Engenharia & Controle</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => renderMenuItem(item, 0))}
        </ul>
      </nav>

      {session?.user && (
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-300 uppercase">
                {session.user.name?.charAt(0) ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-slate-400 truncate">{session.user.perfilNome}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
