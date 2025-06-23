import './globals.css';
import { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import { GpsProvider } from "../context/GpsContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 使 safe-area 插件生效 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={{ margin: 0 }}>
        <GpsProvider>
          {children}
        </GpsProvider>
      </body>
    </html>
  );
} 