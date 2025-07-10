'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useT, useLang, useSetLang } from 'src/locale';
import { getMyRaceId } from '../utils/race';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const setLang = useSetLang();
  const [code, setCode] = useState('');
  const [myId, setMyId] = useState('');

  useEffect(() => {
    setMyId(getMyRaceId());
  }, []);

  const appName = lang === 'zh' ? '锚工' : 'Anchor Guru';

  return (
    <>
      <Head>
        <title>{appName}</title>
      </Head>
      <main className="min-h-screen bg-bg-100 text-text-100 px-4 pt-6">
        {/* 顶部logo插画 */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="logo" style={{ width: 320, height: 320, maxWidth: '100%' }} />
        </div>

        {/* 按钮区 */}
        <div className="w-full max-w-[400px] mx-auto flex flex-col gap-4">
          <Button
            size="lg"
            className="w-full text-lg font-semibold h-16"
            onClick={() => myId && router.push(`/race/${myId}`)}
            disabled={!myId}
          >
            {myId ? t('home.enter_my') + ` (${myId})` : t('home.enter_my')}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full text-lg font-semibold h-16"
            onClick={() => router.push('/timer')}
          >
            {t('home.timer')}
          </Button>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t('home.input_placeholder')}
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
              className="flex-1 text-center text-lg h-16"
            />
            <Button
              size="lg"
              className="text-lg font-semibold px-6 h-16"
              onClick={() => code && router.push(`/race/${code}`)}
            >
              {t('home.join_race')}
            </Button>
          </div>
        </div>

        {/* 语言切换和使用说明 */}
        <div className="flex items-center justify-between mt-8 px-2 select-none">
          <div className="flex items-center gap-1">
            <span
              className={lang === 'zh' ? 'font-bold cursor-pointer' : 'cursor-pointer'}
              onClick={() => setLang('zh')}
            >
              文
            </span>
            <span className="text-black">/</span>
            <span
              className={lang === 'en' ? 'font-bold cursor-pointer' : 'cursor-pointer'}
              onClick={() => setLang('en')}
            >
              EN
            </span>
          </div>
          <span className="text-gray-800 text-sm font-medium cursor-pointer" style={{letterSpacing: 1}}>
            {lang === 'zh' ? '使用说明' : 'manual'}
          </span>
        </div>

        {/* 关于我们 */}
        <div className="mt-8 px-2">
          <div className="text-base leading-relaxed text-gray-700">
            {t('home.about')}
          </div>
        </div>
      </main>
    </>
  );
} 