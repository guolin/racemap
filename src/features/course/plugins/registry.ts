import { CoursePlugin } from './CoursePlugin';
import { ioTrapezoidPlugin } from './ioTrapezoid';
import { windwardLeewardPlugin } from './windwardLeeward';
import { trianglePlugin } from './triangle';
import { optimistTrapezoidPlugin } from './optimistTrapezoid';
import { slalomCoursePlugin } from './slalomCourse';

export type CourseTypeId = 
  | 'windwardLeeward'     // 迎尾风航线
  | 'triangle'           // 三角形航线  
  | 'optimistTrapezoid'  // OP梯形航线
  | 'slalomCourse'       // SLALOM Course障碍航线
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
  optimistTrapezoid: optimistTrapezoidPlugin,
  slalomCourse: slalomCoursePlugin,
  // 现有航线（保持兼容）
  ioTrapezoid: ioTrapezoidPlugin,
} as Record<CourseTypeId, CoursePlugin<any>>;

/** 方便遍历 */
export const allCoursePlugins: CoursePlugin<any>[] = Object.values(registry); 