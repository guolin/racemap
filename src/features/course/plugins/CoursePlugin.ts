import L from 'leaflet';
import type React from 'react';
// 使用 any 作为占位，后续可替换为 zod::ZodTypeAny
type ParamSchema = any;

/**
 * Props passed to a custom SettingsPanel of a course plugin.
 * - `params` 当前参数对象
 * - `setParams` 修改参数的回调 （应保证不可变更新）
 */
export interface SettingsPanelProps<P extends Record<string, any>> {
  params: P;
  setParams: (newParams: P) => void;
}

export interface CoursePluginI18n {
  zh: {
    name: string;
    labels: Record<string, string>;
    tooltips: Record<string, string>;
  };
  en: {
    name: string;
    labels: Record<string, string>;
    tooltips: Record<string, string>;
  };
}

/**
 * 统一的航线插件接口定义。
 * 每个插件应实现并在 registry 中注册，供地图绘制 & 设置面板使用。
 *
 * @typeParam P 参数对象类型（不同航线可自定义）
 */
export interface CoursePlugin<T = any> {
  /** 插件唯一标识，例如 'simple' | 'oneFour' */
  id: string;
  /** 用户可读名称，用于下拉框 / 设置面板展示 */
  name?: string; // 保持向后兼容
  /** 参数校验 Schema（推荐 zod 对象），用于表单生成、类型安全 */
  i18n?: CoursePluginI18n; // 新增多语言支持
  paramSchema: Record<string, any>;
  /** 给定航线的默认参数 */
  defaultParams: T;
  /**
   * 绘制航线。
   * @param map Leaflet Map 实例
   * @param origin 当前位置（起航船）
   * @param params 航线参数
   * @param existing 已存在的 FeatureGroup，可在内部清理后复用
   * @returns 绘制完成的 FeatureGroup（需已 addTo(map)）
   */
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: T,
    existing?: L.FeatureGroup | null
  ) => L.FeatureGroup;
  /**
   * 可选：自定义设置面板。
   * 若未提供，则使用通用表单渲染。
   */
  SettingsPanel?: React.ComponentType<{
    params: T;
    setParams: (updates: Partial<T>) => void;
  }>;
} 