import './globals.css';
import { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import { GpsProvider } from "../context/GpsContext";
import { LangProvider } from 'src/locale';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 使 safe-area 插件生效，禁用缩放 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body style={{ margin: 0 }}>
        <LangProvider>
          <GpsProvider>
            {children}
          </GpsProvider>
        </LangProvider>
      </body>
    </html>
  );
} 