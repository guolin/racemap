import { useT } from 'src/locale';

interface Props {
  courseAxis: number;
  courseSizeNm: number;
}

/**
 * 底部信息文本（替代原来的卡片）
 * - 两行文字：方向、距离
 * - 固定在左下角，位于地图指示器（attribution）上方
 * - pointer-events: none，避免遮挡地图交互
 */
export default function BottomInfoCards({ courseAxis, courseSizeNm }: Props) {
  const t = useT();
  return (
    <div
      className="fixed left-3 z-[1000] bottom-info-cards pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline text-foreground">
          <span className="text-xl font-bold">{courseAxis}</span>
          <span className="text-sm ml-0.5">°M</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground">{t('common.direction')}</span>
        </div>
        <div className="flex items-baseline text-foreground">
          <span className="text-xl font-bold">{courseSizeNm.toFixed(2)}</span>
          <span className="text-sm ml-0.5">NM</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground">{t('common.distance')}</span>
        </div>
      </div>
    </div>
  );
} 