<!-- <script lang="ts" setup>
import type { DesignToken } from "./components/theme";
import DesignTokenContext from "./components/DesignTokenContext.vue";
import Spin from "./components/spin";

const orangeTheme: Partial<DesignToken> = {
  primaryColor: "orange",
};
</script>

<template>
  <div :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }">
    <Spin />
    <br>
    <DesignTokenContext :token="orangeTheme" :hashed="true">
      <Spin />
    </DesignTokenContext>
  </div>
</template>

<style lang="scss" scoped>

</style> -->

<script lang="tsx" setup name="label-content">
import type { PropType, Ref } from "vue";
import { TinyColor } from "@ctrl/tinycolor";
import classNames from "classnames";
import { Theme, unit, useCacheToken, useCSSVarRegister, useStyleRegister } from "cssinjs-vue";
import { computed, defineComponent, inject } from "vue";
import DesignTokenContext from "./components/DesignTokenContext.vue";
import { DesignTokenContextKey } from "./components/theme";

export interface DesignToken {
  primaryColor: string;
  textColor: string;

  borderRadius: number;
  borderColor: string;
  borderWidth: string;

  lineHeight: number;
  lineHeightBase: number;

  smallScreen: number;
}

export interface DerivativeToken extends DesignToken {
  primaryColorDisabled: string;
}

const defaultDesignToken: DesignToken = {
  primaryColor: "#1890ff",
  textColor: "#333333",

  borderRadius: 2,
  borderColor: "black",
  borderWidth: "1px",

  lineHeight: 1.5,
  lineHeightBase: 1.5,

  smallScreen: 800,
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

const theme = computed(() => new Theme(derivative));

interface DesignTokenProviderProps {
  token?: Partial<DesignToken>;
  hashed?: string | boolean;
  cssVar?: {
    key: string;
    prefix?: string;
  };
}

const defaultConfig = {
  token: defaultDesignToken,
  hashed: true,
};

const DesignTokenProvider = defineComponent({
  props: {
    theme: {
      type: Object as PropType<DesignTokenProviderProps>,
    },
  },
  setup(props, { slots }) {
    const parentContext = defaultConfig;
    const customTheme = computed(() => props.theme!);

    const mergedCtx = computed(() => {
      return {
        token: {
          ...parentContext.token,
          ...customTheme.value.token,
        },
        hashed: customTheme.value.hashed ?? parentContext.hashed,
        cssVar: customTheme.value.cssVar,
      };
    });
    return () => (
      <DesignTokenContext {...mergedCtx.value}>
        {slots.default?.()}
      </DesignTokenContext>
    );
  },
});

function useToken() {
  const designTokenContext = inject(DesignTokenContextKey, defaultConfig);
  const cacheToken = useCacheToken<DesignToken, DerivativeToken>(
    theme,
    computed(() => {
      return [defaultDesignToken, designTokenContext.token];
    }) as Ref<DesignToken[]>,
    computed(() => ({
      salt: typeof designTokenContext.hashed === "string" ? designTokenContext.hashed : "",
      cssVar: designTokenContext.cssVar && {
        prefix: designTokenContext.cssVar.prefix ?? "rc",
        key: designTokenContext.cssVar.key,
        unitless: {
          lineHeight: true,
        },
        ignore: {
          lineHeightBase: true,
        },
        preserve: {
          smallScreen: true,
        },
      },
    })),
  );
  return [
    computed(() => cacheToken.value[0]),
    computed(() => designTokenContext.hashed ? cacheToken.value[1] : ""),
    computed(() => designTokenContext.cssVar?.key || ""),
    computed(() => cacheToken.value[2]),
  ];
}

function useStyle() {
  const [token, hashId, cssVarKey, realToken] = useToken();
  console.log("hashId:", hashId.value);
  const getComponentToken = () => ({ boxColor: "#5c21ff" });

  const cssValueCache = useCSSVarRegister(
    {
      path: ["Box"],
      key: cssVarKey.value as string,
      token: realToken.value,
      prefix: "rc-box",
      unitless: {
        lineHeight: true,
      },
      ignore: {
        lineHeightBase: true,
      },
      scope: "box",
    },
    cssVarKey.value ? getComponentToken : () => ({}),
  );
  const registerParam = computed(() => {
    return {
      theme: theme.value,
      token: token.value,
      hashId: hashId.value,
      path: ["Box"],
    };
  });
  useStyleRegister(
    registerParam as any,
    () => {
      const mergedToken: DerivativeToken & { boxColor: string } = {
        ...token.value as any as DerivativeToken & { boxColor: string },
        ...(cssVarKey.value ? cssValueCache.value[0] : getComponentToken()),
      };

      return {
        ".box": {
          lineHeight: mergedToken.lineHeight,
          border: `${unit(mergedToken.borderWidth)} solid ${
            mergedToken.borderColor
          }`,
          color: mergedToken.boxColor,
          backgroundColor: mergedToken.primaryColor,
          content: `"${mergedToken.smallScreen}"`,
        },
      };
    },
  );

  return `${hashId.value}${cssVarKey.value ? ` ${cssVarKey.value}` : ""}`;
}
const Box = defineComponent({
  setup(_, { attrs }) {
    const cls = useStyle();
    return () => <div class={classNames(cls, "box", attrs.class as any)} style={{ width: "20px", height: "20px" }} />;
  },
});

function App() {
  return (
    <>
      <Box class="non-css-var" />
      <DesignTokenProvider
        theme={{
          token: {
            primaryColor: "#1677ff",
          },
          cssVar: {
            key: "apple",
          },
        }}
      >
        <Box class="css-var" />
        <DesignTokenProvider
          theme={{
            token: {
              borderWidth: "2px",
            },
            cssVar: {
              key: "banana",
            },
          }}
        >
          <Box class="css-var-2" />
        </DesignTokenProvider>
        <DesignTokenProvider
          theme={{
            token: {
              borderWidth: "3px",
            },
          }}
        >
          <Box class="non-css-var-2" />
        </DesignTokenProvider>
      </DesignTokenProvider>
    </>
  );
}
</script>

<template>
  <App />
</template>

<style lang="scss" scoped>

</style>
