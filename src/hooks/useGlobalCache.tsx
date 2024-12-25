import type { ComputedRef } from "vue";
import type { MaybeComputedRef } from "../util";
import { computed, onBeforeUnmount, watch } from "vue";
import { type KeyType, pathKey } from "../cache";
import { useStyleInject } from "../styleContext";

export type ExtractStyle<CacheValue> = (
  cache: CacheValue,
  effectStyles: Record<string, boolean>,
  options?: {
    plain?: boolean;
  }
) => [order: number, styleId: string, style: string] | null;

export default function useGlobalCache<CacheType>(
  prefix: string,
  keyPath: MaybeComputedRef<KeyType[]>,
  cacheFn: () => CacheType,
  onCacheRemove?: (cache: CacheType, fromHMR: boolean) => void,
  onCacheEffect?: (cachedValue: CacheType) => void,
): ComputedRef<CacheType> {
  const { cache: globalCache } = useStyleInject();

  const fullPath = computed(() => {
    return [prefix, ...keyPath.value];
  });
  const fullPathStr = computed(() => pathKey(fullPath.value));

  type UpdaterArgs = [times: number, cache: CacheType];

  const buildCache = (updater?: (data: UpdaterArgs) => UpdaterArgs) => {
    globalCache.opUpdate(fullPathStr.value, (prevCache) => {
      const [times = 0, cache] = prevCache || [undefined, undefined];

      const mergedCache = cache || cacheFn();

      const data: UpdaterArgs = [times, mergedCache];

      // Call updater if need additional logic
      return updater ? updater(data) : data;
    });
  };

  const clearCache = (fullPathStr: string, removeCache: boolean) => {
    globalCache.opUpdate(fullPathStr, (prevCache) => {
      const [times = 0, cache] = prevCache || [];
      const nextCount = times - 1;

      if (nextCount === 0) {
        onCacheRemove?.(cache, removeCache);
        return null;
      }

      return [times - 1, cache];
    });
  };

  // Create cache
  watch(
    () => fullPathStr.value,
    (newVal, oldVal) => {
      if (oldVal !== newVal) {
        oldVal && clearCache(oldVal, true);
        buildCache(([times, cache]) => {
          if (times === 0) {
            onCacheEffect?.(cache);
          }
          return [times + 1, cache];
        });
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    clearCache(fullPathStr.value, false);
  });
  return computed(() => {
    const cache = globalCache.opGet(fullPathStr.value);
    return cache![1];
  });
}
