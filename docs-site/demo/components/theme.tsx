import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { CSSObject, Theme } from "../../../src";
import type { MaybeComputedRef } from "../../../src/util";
import { TinyColor } from "@ctrl/tinycolor";
import { computed, inject } from "vue";
import { createTheme, useCacheToken } from "../../../src";

export type GetStyle = (prefixCls: string, token: DerivativeToken) => CSSObject;

export interface DesignToken {
  primaryColor: string;
  textColor: string;
  reverseTextColor: string;

  componentBackgroundColor: string;

  borderRadius: number;
  borderColor: string;
  borderWidth: string;
}

export interface DerivativeToken extends DesignToken {
  primaryColorDisabled: string;
}

export const defaultDesignToken: DesignToken = {
  primaryColor: "#1890ff",
  textColor: "#333333",
  reverseTextColor: "#FFFFFF",

  componentBackgroundColor: "#FFFFFF",

  borderRadius: 2,
  borderColor: "black",
  borderWidth: "1px",
};

// 模拟推导过程
function derivative(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    primaryColorDisabled: new TinyColor(designToken.primaryColor)
      .setAlpha(0.5)
      .toString(),
  };
}

const defaultTheme = createTheme(derivative);

export const DesignTokenContextKey: InjectionKey<{
  token?: Partial<DesignToken>;
  hashed?: string | boolean | undefined;
  theme?: Theme<any, any>;
  cssVar?: {
    key: string;
  };
}> = Symbol("DesignTokenContext");
export const defaultConfig = {
  token: defaultDesignToken,
  hashed: true,
  cssVar: undefined,
};

export function useToken(): [
  MaybeComputedRef<Theme<any, any>>,
  ComputedRef<DerivativeToken>,
  ComputedRef<string>,
  ComputedRef<string | undefined>,
] {
  const designTokenContext = inject(DesignTokenContextKey, defaultConfig);
  const salt = computed(() => `${designTokenContext.hashed || ""}`);

  const mergedTheme = computed(() => designTokenContext.theme || defaultTheme);
  const cacheToken = useCacheToken<DesignToken, DerivativeToken>(
    mergedTheme,
    computed(() => {
      return [defaultDesignToken, designTokenContext.token];
    }) as Ref<DesignToken[]>,
    computed(() => ({
      salt: salt.value,
      cssVar: designTokenContext.cssVar && {
        key: designTokenContext.cssVar.key,
      },
    })),
  );

  return [
    mergedTheme,
    computed(() => cacheToken.value[0]) as any,
    computed(() => (designTokenContext.hashed ? cacheToken.value[1] : "")),
    computed(() => designTokenContext.cssVar?.key),
  ];
}
