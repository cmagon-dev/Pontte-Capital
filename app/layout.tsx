import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Pontte Capital - Sistema de Engenharia e Controle Financeiro",
  description: "Sistema de alta densidade de informação para Engenharia e Controle Financeiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-slate-950 text-white">
        <div className="flex min-h-screen bg-slate-950">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-slate-950 min-w-0 ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
