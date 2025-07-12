'use client';
import { useState } from 'react';
import { getVersionInfo, getVersionText } from '../utils/version';

export default function VersionInfo() {
  const [showDetails, setShowDetails] = useState(false);
  const versionText = getVersionText();
  const versionInfo = getVersionInfo();
  
  return (
    <div className="mt-8 px-2 max-w-[400px] mx-auto">
      <div className="text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 font-mono hover:text-gray-700 transition-colors cursor-pointer"
          title="点击查看详细信息"
        >
          {versionText}
        </button>
        
        {showDetails && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-left">
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>版本:</strong> {versionInfo.version}</div>
              <div><strong>提交:</strong> {versionInfo.commitHash}</div>
              <div><strong>环境:</strong> {versionInfo.environment}</div>
              <div><strong>构建时间:</strong> {new Date(versionInfo.buildTime).toLocaleString('zh-CN')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 