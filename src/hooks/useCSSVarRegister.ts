import type { TokenWithCSSVar } from "../util/cssVariables";
import type { ExtractStyle } from "./useGlobalCache";
import { computed } from "vue";
import { removeCSS, updateCSS } from "../dom/dynamicCSS";
import { ATTR_MARK, ATTR_TOKEN, CSS_IN_JS_INSTANCE, useStyleInject } from "../styleContext";
import { isClientSide, toStyleStr } from "../util";
import { transformToken } from "../util/cssVariables";
import useGlobalCache from "./useGlobalCache";
import { uniqueHash } from "./useStyleRegister";

export const CSS_VAR_PREFIX = "cssVar";

type CSSVarCacheValue<V, T extends Record<string, V> = Record<string, V>> = [
  cssVarToken: TokenWithCSSVar<V, T>,
  cssVarStr: string,
  styleId: string,
  cssVarKey: string,
];

function useCSSVarRegister<V, T extends Record<string, V>>(config: {
  path: string[];
  key: string;
  prefix?: string;
  unitless?: Record<string, boolean>;
  ignore?: Record<string, boolean>;
  scope?: string;
  token: any;
}, fn: () => T) {
  const { key, prefix, unitless, ignore, token, scope = "" } = config;
  const { _tokenKey: tokenKey } = token;

  const stylePath = computed(() => [...config.path, key, scope, tokenKey]);

  const contextProps = useStyleInject();

  const cache = useGlobalCache<CSSVarCacheValue<V, T>>(
    CSS_VAR_PREFIX,
    stylePath,
    () => {
      const originToken = fn();
      const [mergedToken, cssVarsStr] = transformToken<V, T>(originToken, key, {
        prefix,
        unitless,
        ignore,
        scope,
      });
      const styleId = uniqueHash(stylePath.value, cssVarsStr);
      return [mergedToken, cssVarsStr, styleId, key];
    },
    ([, , styleId]) => {
      if (isClientSide) {
        removeCSS(styleId, { mark: ATTR_MARK });
      }
    },
    ([, cssVarsStr, styleId]) => {
      if (!cssVarsStr) {
        return;
      }
      const style = updateCSS(cssVarsStr, styleId, {
        mark: ATTR_MARK,
        prepend: "queue",
        attachTo: contextProps.container,
        priority: -999,
      });

      (style as any)[CSS_IN_JS_INSTANCE] = contextProps.cache.instanceId;

      // Used for `useCacheToken` to remove on batch when token removed
      style.setAttribute(ATTR_TOKEN, key);
    },
  );

  return cache;
}

export const extract: ExtractStyle<CSSVarCacheValue<any>> = (
  cache,
  effectStyles,
  options,
) => {
  const [, styleStr, styleId, cssVarKey] = cache;
  const { plain } = options || {};

  if (!styleStr) {
    return null;
  }

  const order = -999;

  // ====================== Style ======================
  // Used for rc-util
  const sharedAttrs = {
    "data-rc-order": "prependQueue",
    "data-rc-priority": `${order}`,
  };

  const styleText = toStyleStr(
    styleStr,
    cssVarKey,
    styleId,
    sharedAttrs,
    plain,
  );

  return [order, styleId, styleText];
};

export default useCSSVarRegister;
