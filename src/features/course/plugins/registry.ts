import { CoursePlugin } from './CoursePlugin';
import { ioTrapezoidPlugin } from './ioTrapezoid';
import { windwardLeewardPlugin } from './windwardLeeward';
import { trianglePlugin } from './triangle';
import { iqfoilSlalomPlugin } from './iqfoilSlalom';
import { optimistTrapezoidPlugin } from './optimistTrapezoid';

export type CourseTypeId = 
  | 'windwardLeeward'     // 迎尾风航线
  | 'triangle'           // 三角形航线  
  | 'iqfoilSlalom'       // iQFoil障碍滑航
  | 'optimistTrapezoid'  // OP梯形航线
  | 'ioTrapezoid'        // 现有: IO梯形
  | string;

/**
 * 所有已注册的航线插件。
 * - key 为插件 id
 * - value 为插件实例
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const registry = {
  // 标准国际航线
  windwardLeeward: windwardLeewardPlugin,
  triangle: trianglePlugin,
  iqfoilSlalom: iqfoilSlalomPlugin,
  optimistTrapezoid: optimistTrapezoidPlugin,
  // 现有航线（保持兼容）
  ioTrapezoid: ioTrapezoidPlugin,
} as Record<CourseTypeId, CoursePlugin<any>>;

/** 方便遍历 */
export const allCoursePlugins: CoursePlugin<any>[] = Object.values(registry); 