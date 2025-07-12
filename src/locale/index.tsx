"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import zh from './zh.json';
import en from './en.json';
import { Button } from '@components/components/ui/button';

export type Lang = 'zh' | 'en';

// 将所有字典集中在一个映射中，便于按语言切换
const dictionaries: Record<Lang, Record<string, string>> = {
  zh: zh as Record<string, string>,
  en: en as Record<string, string>,
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLang: () => {},
  t: (k: string) => k,
});

let globalLang: Lang = 'en';
export const getCurrentLang = () => globalLang;

// 检测用户语言偏好的函数，供外部使用
export const detectUserLanguage = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  
  // 优先检查 localStorage
  const stored = localStorage.getItem('lang') as Lang | null;
  if (stored === 'zh' || stored === 'en') return stored;
  
  // 检查浏览器语言偏好
  const zhLike = (navigator.languages || [navigator.language]).some((l) => 
    l.toLowerCase().startsWith('zh')
  );
  return zhLike ? 'zh' : 'en';
};

// ---------------- Provider ----------------
export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初始状态固定为 'en'，避免服务端渲染水合错误
  const [lang, setLang] = useState<Lang>('en');

  // 把语言写入 localStorage，并同步到全局变量供非 React 场景使用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
    globalLang = lang;
  }, [lang]);

  const t = useMemo(() => {
    const dict = dictionaries[lang];
    return (key: string): string => dict[key] ?? key; // 缺失 key 时直接返回 key 方便排查
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
};

// ---------------- Hooks ----------------
export const useLang = () => useContext(LangContext).lang;
export const useSetLang = () => useContext(LangContext).setLang;
export const useT = () => useContext(LangContext).t;

// ---------------- Switcher ----------------
export const LangSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const lang = useLang();
  const setLang = useSetLang();
  const next = lang === 'zh' ? 'en' : 'zh';
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setLang(next)} 
      className={className} 
      aria-label="switch language"
    >
      {next === 'zh' ? '中文' : 'EN'}
    </Button>
  );
}; 