import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/app/components/SessionProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Pontte Capital - Sistema de Engenharia e Controle Financeiro',
  description: 'Sistema de alta densidade de informação para Engenharia e Controle Financeiro',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-slate-950 text-white">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
