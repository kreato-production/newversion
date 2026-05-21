import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: 'Kreato — Sistema de Gestão de Produção',
  description:
    'Sistema de gestão de gravações, programas, equipes e recursos de produção audiovisual.',
  icons: {
    icon: [{ url: '/Kreato.png', type: 'image/png' }],
    apple: '/Kreato.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
