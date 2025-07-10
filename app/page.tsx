'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getMyRaceId } from '../utils/race';

export default function Home() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [myId, setMyId] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMyId(getMyRaceId());
  }, []);

  const navContent = (
    <ul className="space-y-3">
      <li>
        <a
          className="text-text-100 opacity-90 hover:text-primary-100 transition-colors"
          href="https://example.com/help"
          target="_blank"
          rel="noreferrer"
        >
          帮助
        </a>
      </li>
      <li>
        <details className="group">
          <summary className="cursor-pointer text-text-100 opacity-90 group-open:text-primary-100">
            关于我
          </summary>
          <ul className="pl-4 mt-2 space-y-2 text-text-200">
            <li>
              <a href="#" className="hover:text-primary-100">爸爸，果儿 编辑航线</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-100">工作支持</a>
            </li>
            <li>
              <a
                href="https://github.com/your-repo"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-100"
              >
                开源代码
              </a>
            </li>
          </ul>
        </details>
      </li>
    </ul>
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-100 text-text-100 relative px-4">
      {/* Mobile hamburger */}
      <button
        className="md:hidden absolute top-5 right-5 z-20 p-2 rounded-md bg-bg-300 bg-opacity-70 backdrop-blur"
        onClick={() => setMenuOpen(true)}
        aria-label="打开菜单"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5m-16.5 5.25h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Card */}
      <div className="w-full max-w-sm bg-bg-100 rounded-xl shadow-lg p-6 flex flex-col items-center gap-5">
        <h1 className="text-2xl font-bold">帆船裁判工具</h1>

        <input
          type="text"
          placeholder="输入房间码"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full px-4 py-3 rounded-md text-center text-lg text-text-100 focus:outline-none"
        />

        <button
          className="w-full py-3 rounded-md bg-primary-100 hover:bg-primary-200 transition-colors text-lg font-semibold"
          onClick={() => code && router.push(`/race/${code}`)}
        >
          加入比赛
        </button>

        <button
          className="w-full py-3 rounded-md bg-accent-100 hover:bg-accent-200 transition-colors text-lg font-semibold disabled:opacity-50"
          onClick={() => myId && router.push(`/race/${myId}`)}
          disabled={!myId}
        >
          {myId ? `进入我的比赛（${myId}）` : '进入我的比赛'}
        </button>

        <button
          className="w-full py-3 rounded-md bg-primary-200 hover:bg-primary-300 transition-colors text-lg font-semibold"
          onClick={() => window.open('/timer', '_blank')}
        >
          Timer 计时器
        </button>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:block mt-10">{navContent}</nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 flex" onClick={() => setMenuOpen(false)}>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" />
          <div
            className="w-64 bg-bg-100 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="mb-6 p-2 rounded-md bg-bg-300"
              onClick={() => setMenuOpen(false)}
              aria-label="关闭菜单"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {navContent}
          </div>
        </div>
      )}
    </main>
  );
} 