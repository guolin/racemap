import './globals.css';
import { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import { GpsProvider } from "../context/GpsContext";
import { LangProvider } from 'src/locale';
import { Toaster } from '@components/components/ui/sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 禁用缩放，设置视口 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <script src="/disable-zoom.js" defer></script>
      </head>
      <body style={{ margin: 0 }}>
        <LangProvider>
          <GpsProvider>
            {children}
            <Toaster />
          </GpsProvider>
        </LangProvider>
      </body>
    </html>
  );
} 