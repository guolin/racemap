import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { registry, CourseTypeId } from './plugins/registry';

interface CourseState {
  /** 当前航线类型 */
  type: CourseTypeId;
  /** 当前航线参数（不同类型结构不同） */
  params: Record<string, any>;

  // --- 新 API ---
  setType: (t: CourseTypeId) => void;
  /** 局部更新 params */
  setParams: (patch: Record<string, any>) => void;

  // --- 兼容旧字段（仅 simple 航线生效，后续可移除） ---
  axis: number;
  distanceNm: number;
  startLineM: number;
  setAxis: (v: number) => void;
  setDistanceNm: (v: number) => void;
  setStartLineM: (v: number) => void;
  setAll: (a: number, d: number, s: number) => void;
}

const defaultSimple = registry.simple.defaultParams;

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      // ---- state ----
      type: 'simple',
      params: { ...defaultSimple },

      // legacy mirror values
      axis: defaultSimple.axis,
      distanceNm: defaultSimple.distanceNm,
      startLineM: defaultSimple.startLineM,

      // ---- actions ----
      setType: (t) => {
        const plugin = registry[t];
        if (!plugin) return;
        const defaults = { ...plugin.defaultParams };
        set({
          type: t,
          params: defaults,
          axis: (defaults as any).axis ?? 0,
          distanceNm: (defaults as any).distanceNm ?? 0,
          startLineM: (defaults as any).startLineM ?? 0,
        });
      },

      setParams: (patch) => {
        set((state) => {
          let changed = false;
          const newParams: Record<string, any> = { ...state.params };
          for (const k in patch) {
            if (patch[k] !== state.params[k]) {
              newParams[k] = patch[k];
              changed = true;
            }
          }
          if (!changed) return state; // no update needed

          return {
            params: newParams,
            axis: patch.axis ?? state.axis,
            distanceNm: patch.distanceNm ?? state.distanceNm,
            startLineM: patch.startLineM ?? state.startLineM,
          } as CourseState;
        });
      },

      // ---- legacy setters ----
      setAxis: (v) => set((state) => ({
        axis: v,
        params: state.type === 'simple' ? { ...state.params, axis: v } : state.params,
      })),

      setDistanceNm: (v) => set((state) => ({
        distanceNm: v,
        params: state.type === 'simple' ? { ...state.params, distanceNm: v } : state.params,
      })),

      setStartLineM: (v) => set((state) => ({
        startLineM: v,
        params: state.type === 'simple' ? { ...state.params, startLineM: v } : state.params,
      })),

      setAll: (a, d, s) => set((state) => ({
        axis: a,
        distanceNm: d,
        startLineM: s,
        params:
          state.type === 'simple'
            ? { ...state.params, axis: a, distanceNm: d, startLineM: s }
            : state.params,
      })),
    }),
    {
      name: 'course-settings',
      version: 2,
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1) {
          // old shape: { axis, distanceNm, startLineM }
          const { axis = 40, distanceNm = 0.9, startLineM = 100 } = persistedState as any;
          return {
            type: 'simple',
            params: { axis, distanceNm, startLineM },
            axis,
            distanceNm,
            startLineM,
          };
        }
        return persistedState as CourseState;
      },
    }
  )
);

/** Convenience hooks */
export const useCourseParams = () => useCourseStore((s) => ({ type: s.type, params: s.params })); 