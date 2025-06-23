import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CourseState {
  axis: number; // course axis in degrees
  distanceNm: number; // distance from start to mark1 in NM
  startLineM: number; // start line length in metres

  setAxis: (v: number) => void;
  setDistanceNm: (v: number) => void;
  setStartLineM: (v: number) => void;
  setAll: (a: number, d: number, s: number) => void;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      axis: 40,
      distanceNm: 0.9,
      startLineM: 100,
      setAxis: (v) => set({ axis: v }),
      setDistanceNm: (v) => set({ distanceNm: v }),
      setStartLineM: (v) => set({ startLineM: v }),
      setAll: (a, d, s) => set({ axis: a, distanceNm: d, startLineM: s }),
    }),
    { name: 'course-settings' }
  )
);

/** Convenience hook */
export const useCourseParams = () => useCourseStore(); 