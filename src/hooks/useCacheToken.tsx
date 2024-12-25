import type { ComputedRef, Ref } from "vue";
import type Theme from "../theme/Theme";
import type { ExtractStyle } from "./useGlobalCache";
import hash from "@emotion/hash";
import { computed, ref } from "vue";
import { updateCSS } from "../dom/dynamicCSS";
import {
  ATTR_MARK,
  ATTR_TOKEN,
  CSS_IN_JS_INSTANCE,
  useStyleInject,
} from "../styleContext";
import { flattenToken, token2key, toStyleStr } from "../util";
import { transformToken } from "../util/cssVariables";
import useGlobalCache from "./useGlobalCache";

const EMPTY_OVERRIDE = {};

// Generate different prefix to make user selector break in production env.
// This helps developer not to do style override directly on the hash id.
const hashPrefix
  = process.env.NODE_ENV !== "production"
    ? "css-dev-only-do-not-override"
    : "css";

export interface Option<DerivativeToken, DesignToken> {
  /**
   * Generate token with salt.
   * This is used to generate different hashId even same derivative token for different version.
   */
  salt?: string;
  override?: object;
  /**
   * Format token as you need. Such as:
   *
   * - rename token
   * - merge token
   * - delete token
   *
   * This should always be the same since it's one time process.
   * It's ok to useMemo outside but this has better cache strategy.
   */
  formatToken?: (mergedToken: any) => DerivativeToken;
  /**
   * Get final token with origin token, override token and theme.
   * The parameters do not contain formatToken since it's passed by user.
   * @param origin The original token.
   * @param override Extra tokens to override.
   * @param theme Theme instance. Could get derivative token by `theme.getDerivativeToken`
   */
  getComputedToken?: (
    origin: DesignToken,
    override: object,
    theme: Theme<any, any>
  ) => DerivativeToken;

  /**
   * Transform token to css variables.
   */
  cssVar?: {
    /** Prefix for css variables */
    prefix?: string;
    /** Tokens that should not be appended with unit */
    unitless?: Record<string, boolean>;
    /** Tokens that should not be transformed to css variables */
    ignore?: Record<string, boolean>;
    /** Tokens that preserves origin value */
    preserve?: Record<string, boolean>;
    /** Key for current theme. Useful for customizing and should be unique */
    key?: string;
  };
}

const tokenKeys = new Map<string, number>();
function recordCleanToken(tokenKey: string) {
  tokenKeys.set(tokenKey, (tokenKeys.get(tokenKey) || 0) + 1);
}

function removeStyleTags(key: string, instanceId: string) {
  if (typeof document !== "undefined") {
    const styles = document.querySelectorAll(`style[${ATTR_TOKEN}="${key}"]`);

    styles.forEach((style) => {
      if ((style as any)[CSS_IN_JS_INSTANCE] === instanceId) {
        style.parentNode?.removeChild(style);
      }
    });
  }
}

const TOKEN_THRESHOLD = 0;

// Remove will check current keys first
function cleanTokenStyle(tokenKey: string, instanceId: string) {
  tokenKeys.set(tokenKey, (tokenKeys.get(tokenKey) || 0) - 1);

  const tokenKeyList = Array.from(tokenKeys.keys());
  const cleanableKeyList = tokenKeyList.filter((key) => {
    const count = tokenKeys.get(key) || 0;
    return count <= 0;
  });

  // Should keep tokens under threshold for not to insert style too often
  if (tokenKeyList.length - cleanableKeyList.length > TOKEN_THRESHOLD) {
    cleanableKeyList.forEach((key) => {
      removeStyleTags(key, instanceId);
      tokenKeys.delete(key);
    });
  }
}

export function getComputedToken<
  DerivativeToken = object,
  DesignToken = DerivativeToken,
>(originToken: DesignToken, overrideToken: object, theme: Theme<any, any>, format?: (token: DesignToken) => DerivativeToken) {
  const derivativeToken = theme.getDerivativeToken(originToken);

  // Merge with override
  let mergedDerivativeToken = {
    ...derivativeToken,
    ...overrideToken,
  };

  // Format if needed
  if (format) {
    mergedDerivativeToken = format(mergedDerivativeToken);
  }

  return mergedDerivativeToken;
}

export const TOKEN_PREFIX = "token";

type TokenCacheValue<DerivativeToken> = [
  token: DerivativeToken & { _tokenKey: string; _themeKey: string },
  hashId: string,
  realToken: DerivativeToken & { _tokenKey: string },
  cssVarStr: string,
  cssVarKey: string,
];

/**
 * Cache theme derivative token as global shared one
 * @param theme Theme entity
 * @param tokens List of tokens, used for cache. Please do not dynamic generate object directly
 * @param option Additional config
 * @returns Call Theme.getDerivativeToken(tokenObject) to get token
 */
export default function useCacheToken<
  DerivativeToken = object,
  DesignToken = DerivativeToken,
>(
  theme: Ref<Theme<any, any>>,
  tokens: Ref<Partial<DesignToken>[]>,
  option: Ref<Option<DerivativeToken, DesignToken>> = ref({}),
): ComputedRef<TokenCacheValue<DerivativeToken>> {
  const contextProps = useStyleInject();

  // Basic - We do basic cache here
  const mergedToken = computed(() => {
    return Object.assign({}, ...tokens.value);
  });
  const tokenStr = computed(() => {
    return flattenToken(mergedToken.value);
  });
  const overrideTokenStr = computed(() => {
    return flattenToken(option.value.override || EMPTY_OVERRIDE);
  });

  const cssVarStr = computed(() => {
    return option.value.cssVar ? flattenToken(option.value.cssVar) : "";
  });

  const keyPath = computed(() => [
    option.value.salt || "",
    theme.value.id,
    tokenStr.value,
    overrideTokenStr.value,
    cssVarStr.value,
  ]);
  const cachedToken = useGlobalCache<TokenCacheValue<DerivativeToken>>(
    TOKEN_PREFIX,
    keyPath,
    () => {
      const {
        salt = "",
        override = EMPTY_OVERRIDE,
        formatToken,
        cssVar,
        getComputedToken: compute,
      } = option.value;

      let mergedDerivativeToken = compute
        ? compute(mergedToken.value, override, theme.value)
        : getComputedToken(
            mergedToken.value,
            override,
            theme.value,
            formatToken,
          );
      // Replace token value with css variables
      const actualToken = { ...mergedDerivativeToken };
      let cssVarsStr = "";
      if (cssVar) {
        [mergedDerivativeToken, cssVarsStr] = transformToken(
          mergedDerivativeToken,
          cssVar.key!,
          {
            prefix: cssVar.prefix,
            ignore: cssVar.ignore,
            unitless: cssVar.unitless,
            preserve: cssVar.preserve,
          },
        );
      }

      // Optimize for `useStyleRegister` performance
      const tokenKey = token2key(mergedDerivativeToken, salt);
      mergedDerivativeToken._tokenKey = tokenKey;
      actualToken._tokenKey = token2key(actualToken, salt);

      const themeKey = cssVar?.key ?? tokenKey;
      mergedDerivativeToken._themeKey = themeKey;
      recordCleanToken(themeKey);

      const hashId = `${hashPrefix}-${hash(tokenKey)}`;
      mergedDerivativeToken._hashId = hashId; // Not used

      return [
        mergedDerivativeToken,
        hashId,
        actualToken,
        cssVarsStr,
        cssVar?.key || "",
      ];
    },
    (cache) => {
      // Remove token will remove all related style
      cleanTokenStyle(cache[0]._themeKey, contextProps.cache.instanceId);
    },
    ([token, , , cssVarsStr]) => {
      if (option.value.cssVar && cssVarsStr) {
        const style = updateCSS(
          cssVarsStr,
          hash(`css-variables-${token._themeKey}`),
          {
            mark: ATTR_MARK,
            prepend: "queue",
            attachTo: contextProps.container,
            priority: -999,
          },
        );
        (style as any)[CSS_IN_JS_INSTANCE] = contextProps.cache.instanceId;

        // Used for `useCacheToken` to remove on batch when token removed
        style.setAttribute(ATTR_TOKEN, token._themeKey);
      }
    },
  );

  return cachedToken;
}

export const extract: ExtractStyle<TokenCacheValue<any>> = (
  cache,
  effectStyles,
  options,
) => {
  const [, , realToken, styleStr, cssVarKey] = cache;
  const { plain } = options || {};

  if (!styleStr) {
    return null;
  }

  const styleId = realToken._tokenKey;
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
