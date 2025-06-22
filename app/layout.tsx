import './globals.css';
import { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import { GpsProvider } from "../context/GpsContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0 }}>
        <GpsProvider>
          {children}
        </GpsProvider>
      </body>
    </html>
  );
} 