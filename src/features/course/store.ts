import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { registry, CourseTypeId } from './plugins/registry';

interface CourseState {
  /** 当前航线类型 */
  type: CourseTypeId;
  /** 当前航线参数（不同类型结构不同） */
  params: Record<string, any>;

  // --- 新 API ---
  setType: (_t: CourseTypeId) => void;
  /** 局部更新 params */
  setParams: (_patch: Record<string, any>) => void;

  // --- 兼容旧字段（仅 windwardLeeward 航线生效，后续可移除） ---
  axis: number;
  distanceNm: number;
  startLineM: number;
  setAxis: (_v: number) => void;
  setDistanceNm: (_v: number) => void;
  setStartLineM: (_v: number) => void;
  setAll: (_a: number, _d: number, _s: number) => void;
}

const defaultWindwardLeeward = registry.windwardLeeward.defaultParams;

export const useCourseStore = create<CourseState>()(
  persist(
    (set, _get) => ({
      // ---- state ----
      type: 'windwardLeeward',
      params: { ...defaultWindwardLeeward },

      // legacy mirror values
      axis: defaultWindwardLeeward.axis,
      distanceNm: defaultWindwardLeeward.distanceNm,
      startLineM: defaultWindwardLeeward.startLineM,

      // ---- actions ----
      setType: (_t) => {
        const plugin = registry[_t];
        if (!plugin) return;
        const defaults = { ...plugin.defaultParams };
        set({
          type: _t,
          params: defaults,
          axis: (defaults as any).axis ?? 0,
          distanceNm: (defaults as any).distanceNm ?? 0,
          startLineM: (defaults as any).startLineM ?? 0,
        });
      },

      setParams: (_patch) => {
        set((state) => {
          let changed = false;
          const newParams: Record<string, any> = { ...state.params };
          for (const k in _patch) {
            if (_patch[k] !== state.params[k]) {
              newParams[k] = _patch[k];
              changed = true;
            }
          }
          if (!changed) return state; // no update needed

          return {
            params: newParams,
            axis: _patch.axis ?? state.axis,
            distanceNm: _patch.distanceNm ?? state.distanceNm,
            startLineM: _patch.startLineM ?? state.startLineM,
          } as CourseState;
        });
      },

      // ---- legacy setters ----
      setAxis: (_v) => set((state) => ({
        axis: _v,
        params: state.type === 'windwardLeeward' ? { ...state.params, axis: _v } : state.params,
      })),

      setDistanceNm: (_v) => set((state) => ({
        distanceNm: _v,
        params: state.type === 'windwardLeeward' ? { ...state.params, distanceNm: _v } : state.params,
      })),

      setStartLineM: (_v) => set((state) => ({
        startLineM: _v,
        params: state.type === 'windwardLeeward' ? { ...state.params, startLineM: _v } : state.params,
      })),

      setAll: (_a, _d, _s) => set((state) => ({
        axis: _a,
        distanceNm: _d,
        startLineM: _s,
        params:
          state.type === 'windwardLeeward'
            ? { ...state.params, axis: _a, distanceNm: _d, startLineM: _s }
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
            type: 'windwardLeeward',
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