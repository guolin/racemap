'use client';
import React from 'react';
import { AlertCircle, Settings, MapPin } from 'lucide-react';
import { useT } from 'src/locale';

interface Props {
  /** 是否管理员，决定是否显示 ⚙️ 按钮 */
  isAdmin: boolean;
  /** 点击🚤按钮执行：手动获取并定位当前位置 */
  onLocate?: () => void;
  /** 点击⚙️按钮执行：打开设置面板（仅管理员） */
  onSettings?: () => void;
  /** 点击ℹ️按钮执行：打开坐标信息对话框 */
  onInfo?: () => void;
}

const SideToolbar: React.FC<Props> = ({ isAdmin, onLocate, onSettings, onInfo }) => {
  const t = useT();
  
  const buttonClass = "w-14 h-14 rounded-xl border-0 bg-card text-foreground cursor-pointer shadow-md hover:bg-muted-hover transition-colors flex items-center justify-center";
  
  return (
    <div className="absolute top-[100px] right-3 flex flex-col gap-3 z-[1000]">
      <button 
        className={buttonClass}
        title={t('common.locate_tooltip')} 
        onClick={onLocate}
      >
        <MapPin className="w-6 h-6" />
      </button>
      <button 
        className={buttonClass}
        title={t('common.info_tooltip')} 
        onClick={onInfo}
      >
        <AlertCircle className="w-6 h-6" />
      </button>
      {isAdmin && (
        <button 
          className={buttonClass}
          onClick={onSettings} 
          title={t('common.settings_tooltip')}
        >
          <Settings className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default SideToolbar; 