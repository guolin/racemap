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
      <InfoCard title={t('common.direction')} value={`${courseAxis}°M`} />
      <InfoCard title={t('common.distance')} value={`${courseSizeNm.toFixed(1)}NM`} />
    </div>
  );
} 