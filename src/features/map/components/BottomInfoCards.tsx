import { InfoCard } from '@shared/ui/InfoCard';
import { useT } from 'src/locale';

interface Props {
  courseAxis: number;
  courseSizeNm: number;
}

/**
 * 底部信息卡片组件
 * 使用 CSS 环境变量和安全区域来处理移动端地址栏问题
 */
export default function BottomInfoCards({ courseAxis, courseSizeNm }: Props) {
  const t = useT();
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 flex gap-3 z-[1000] bottom-info-cards">
      <div className="min-w-[120px] rounded-lg bg-white px-3 py-2 text-center shadow-md">
        <div className="text-lg font-bold">
          {courseAxis}<span className="text-sm text-gray-500">°M</span>
        </div>
        <div className="text-xs text-gray-600">{t('common.direction')}</div>
      </div>
      <div className="min-w-[120px] rounded-lg bg-white px-3 py-2 text-center shadow-md">
        <div className="text-lg font-bold">
          {courseSizeNm.toFixed(2)}<span className="text-sm text-gray-500">NM</span>
        </div>
        <div className="text-xs text-gray-600">{t('common.distance')}</div>
      </div>
    </div>
  );
} 