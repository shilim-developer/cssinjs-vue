import type { InjectionKey, PropType, Ref } from "vue";
import type { Linter } from "./linters";
import type { Transformer } from "./transformers/interface";
import { computed, defineComponent, inject, provide, unref } from "vue";
import CacheEntity from "./cache";

export const ATTR_TOKEN = "data-token-hash";
export const ATTR_MARK = "data-css-hash";
export const ATTR_DEV_CACHE_PATH = "data-dev-cache-path";

// Mark css-in-js instance in style element
export const CSS_IN_JS_INSTANCE = "__cssinjs_instance__";

export function createCache() {
  const cssinjsInstanceId = Math.random().toString(12).slice(2);
  if (typeof document !== "undefined" && document.head && document.body) {
    const styles = document.body.querySelectorAll(`style[${ATTR_MARK}]`) || [];
    const { firstChild } = document.head;

    Array.from(styles).forEach((style) => {
      (style as any)[CSS_IN_JS_INSTANCE]
        = (style as any)[CSS_IN_JS_INSTANCE] || cssinjsInstanceId;

      // Not force move if no head
      document.head.insertBefore(style, firstChild);
    });

    // Deduplicate of moved styles
    const styleHash: Record<string, boolean> = {};
    Array.from(document.querySelectorAll(`style[${ATTR_MARK}]`)).forEach(
      (style) => {
        const hash = style.getAttribute(ATTR_MARK)!;
        if (styleHash[hash]) {
          if ((style as any)[CSS_IN_JS_INSTANCE] === cssinjsInstanceId)
            style.parentNode?.removeChild(style);
        }
        else {
          styleHash[hash] = true;
        }
      },
    );
  }

  return new CacheEntity(cssinjsInstanceId);
}

export type HashPriority = "low" | "high";

export interface StyleContextProps {
  autoClear?: boolean;
  mock?: "server" | "client";
  /**
   * Only set when you need ssr to extract style on you own.
   * If not provided, it will auto create <style /> on the end of Provider in server side.
   */
  cache: CacheEntity;
  /** Tell children that this context is default generated context */
  defaultCache: boolean;
  /** Use `:where` selector to reduce hashId css selector priority */
  hashPriority?: HashPriority;
  /** Tell cssinjs where to inject style in */
  container?: Element | ShadowRoot;
  /** Component wil render inline  `<style />` for fallback in SSR. Not recommend. */
  ssrInline?: boolean;
  /** Transform css before inject in document. Please note that `transformers` do not support dynamic update */
  transformers?: Transformer[];
  /**
   * Linters to lint css before inject in document.
   * Styles will be linted after transforming.
   * Please note that `linters` do not support dynamic update.
   */
  linters?: Linter[];
  /** Wrap css in a layer to avoid global style conflict */
  layer?: boolean;
}

const StyleContextKey: InjectionKey<StyleContextProps>
  = Symbol("StyleContextKey");

export type StyleProviderProps =
  | Partial<StyleContextProps>
  | Ref<Partial<StyleContextProps>>;

// If there is no provider, automatically generate a global provider
const globalCache = createCache();
export function useStyleInject() {
  return inject(StyleContextKey, {
    hashPriority: "low",
    cache: globalCache,
    defaultCache: true,
  });
}
export function useStyleProvider(props: StyleProviderProps) {
  const parentContext = useStyleInject();

  const context = computed<StyleContextProps>(() => {
    const mergedContext: StyleContextProps = {
      ...parentContext,
    };
    const propsValue = unref(props);
    (Object.keys(propsValue) as (keyof StyleContextProps)[]).forEach((key) => {
      const value = propsValue[key];
      if (propsValue[key] !== undefined)
        (mergedContext as any)[key] = value;
    });

    const { cache } = propsValue;
    mergedContext.cache = mergedContext.cache || createCache();
    mergedContext.defaultCache = !cache && parentContext.defaultCache;

    return mergedContext;
  });

  return context;
}

export const StyleProvider = defineComponent({
  name: "StyleProvider",
  props: {
    autoClear: Boolean,
    mock: String as PropType<StyleContextProps["mock"]>,
    cache: {
      type: Object as PropType<StyleContextProps["cache"]>,
      default: () => createCache(),
    },
    hashPriority: {
      type: String as PropType<StyleContextProps["hashPriority"]>,
      default: "low",
    },
    container: Object as PropType<StyleContextProps["container"]>,
    ssrInline: Boolean,
    transformers: Array as PropType<StyleContextProps["transformers"]>,
    linters: Array as PropType<StyleContextProps["linters"]>,
    defaultCache: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, ctx) {
    provide(StyleContextKey, props);
    return () => ctx.slots.default?.();
  },
});

export default {
  useStyleInject,
  useStyleProvider,
  StyleProvider,
};
