import { CoursePlugin } from './CoursePlugin';
import { simpleCoursePlugin } from './simple';
import { oneFourPlugin } from './oneFour';
import { simple1aPlugin } from './simple1a';
import { ioTrapezoidPlugin } from './ioTrapezoid';

export type CourseTypeId = 'simple' | 'simple1a' | 'oneFour' | 'ioTrapezoid' | string;

/**
 * 所有已注册的航线插件。
 * - key 为插件 id
 * - value 为插件实例
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const registry = {
  simple: simpleCoursePlugin,
  simple1a: simple1aPlugin,
  oneFour: oneFourPlugin,
  ioTrapezoid: ioTrapezoidPlugin,
} as Record<CourseTypeId, CoursePlugin<any>>;

/** 方便遍历 */
export const allCoursePlugins: CoursePlugin<any>[] = Object.values(registry); 