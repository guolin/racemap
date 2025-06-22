export interface GeoThrottleOptions extends PositionOptions {
  /**
   * 最小回调间隔（毫秒），默认 0 表示不过滤。
   */
  throttleTime?: number;
}

/**
 * 与 navigator.geolocation.watchPosition 行为一致，但会按照 throttleTime
 * 对成功回调进行节流。
 */
export function watchPositionThrottled(
  success: PositionCallback,
  error?: PositionErrorCallback,
  options?: GeoThrottleOptions
): number {
  const { throttleTime = 0, ...rest } = options ?? {};
  let last = 0;
  // 包装成功回调，按节流间隔触发
  const wrappedSuccess: PositionCallback = (pos) => {
    const now = Date.now();
    if (throttleTime === 0 || now - last >= throttleTime) {
      last = now;
      success(pos);
    }
  };
  return navigator.geolocation.watchPosition(wrappedSuccess, error, rest);
}

export function clearWatch(id: number) {
  navigator.geolocation.clearWatch(id);
} 