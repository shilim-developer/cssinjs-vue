import type { ComputedRef, InjectionKey, PropType, Ref } from "vue";
import { TinyColor } from "@ctrl/tinycolor";
import { mount } from "@vue/test-utils";
import classNames from "classnames";
import {
  createCache,
  extractStyle,
  StyleProvider,
  Theme,
  unit,
  useCacheToken,
  useCSSVarRegister,
  useStyleRegister,
} from "cssinjs-vue";
import { beforeEach, describe, expect, it } from "vitest";
import { computed, defineComponent, inject, render } from "vue";
import DesignTokenContext from "../docs-site/demo/components/DesignTokenContext.vue";
import { DesignTokenContextKey } from "../docs-site/demo/components/theme";

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
    return () => <div class={classNames(cls, "box", attrs.class as any)} />;
  },
});

describe("cSS Variables", () => {
  beforeEach(() => {
    const styles = Array.from(document.head.querySelectorAll("style"));
    styles.forEach((style) => {
      style.parentNode?.removeChild(style);
    });
  });

  it("should work with cssVar", () => {
    const TestContent = defineComponent({
      name: "TestContent",
      setup() {
        return () => (
          <DesignTokenProvider
            theme={{
              cssVar: {
                key: "apple",
              },
            }}
          >
            <Box class="target" />
          </DesignTokenProvider>
        );
      },
    });
    const app = mount(TestContent);
    const styles = Array.from(document.head.querySelectorAll("style"));
    const box = app.find<HTMLDivElement>(".target")!;
    const boxStyle = getComputedStyle(box.element);

    expect(styles.length).toBe(3);
    expect(styles[0].textContent).toContain(".apple{");
    expect(styles[0].textContent).toContain("--rc-line-height:1.5;");
    expect(styles[0].textContent).not.toContain("--rc-line-height-base:1.5;");
    expect(styles[0].textContent).not.toContain("--rc-small-screen:800;");
    expect(styles[1].textContent).toContain("--rc-box-box-color:#5c21ff");
    expect(styles[1].textContent).toContain(".apple.box{");
    expect(styles[2].textContent).toContain(
      "line-height:var(--rc-line-height);",
    );
    expect(styles[2].textContent).toContain("content:\"800\"");
    expect(box.classes()).toContain("apple");
    expect(boxStyle.getPropertyValue("--rc-line-height")).toEqual("1.5");
    expect(boxStyle.lineHeight).toEqual("var(--rc-line-height)");
  });

  it("could mix with non-css-var", () => {
    const app = mount(() => (
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
    ));

    const styles = Array.from(document.head.querySelectorAll("style"));
    styles.forEach((item) => {
      console.log("styles:", item.innerHTML);
    });
    expect(styles).toHaveLength(7);

    // const nonCssVarBox = container.querySelector(".non-css-var")!;
    // expect(nonCssVarBox).toHaveStyle({
    //   lineHeight: "1.5",
    //   border: "1px solid black",
    //   backgroundColor: "#1890ff",
    //   color: "#5c21ff",
    // });

    // const cssVarBox = container.querySelector(".css-var")!;
    // expect(cssVarBox).toHaveStyle({
    //   "--rc-line-height": "1.5",
    //   "--rc-border-width": "1px",
    //   "--rc-border-color": "black",
    //   "--rc-primary-color": "#1677ff",
    //   "--rc-box-box-color": "#5c21ff",
    //   "lineHeight": "var(--rc-line-height)",
    //   "border": "var(--rc-border-width) solid var(--rc-border-color)",
    //   "backgroundColor": "var(--rc-primary-color)",
    //   "color": "var(--rc-box-box-color)",
    // });

    // const cssVarBox2 = container.querySelector(".css-var-2")!;
    // expect(cssVarBox2).toHaveClass("banana");
    // expect(cssVarBox2).not.toHaveClass("apple");
    // expect(cssVarBox2).toHaveStyle({
    //   "--rc-line-height": "1.5",
    //   "--rc-border-width": "2px",
    //   "--rc-border-color": "black",
    //   "--rc-primary-color": "#1677ff",
    //   "--rc-box-box-color": "#5c21ff",
    //   "lineHeight": "var(--rc-line-height)",
    //   "border": "var(--rc-border-width) solid var(--rc-border-color)",
    //   "backgroundColor": "var(--rc-primary-color)",
    //   "color": "var(--rc-box-box-color)",
    // });

    // const nonCssVarBox2 = container.querySelector(".non-css-var-2")!;
    // expect(nonCssVarBox2).not.toHaveClass("banana");
    // expect(nonCssVarBox2).not.toHaveClass("apple");
    // expect(nonCssVarBox2).toHaveStyle({
    //   lineHeight: "1.5",
    //   border: "3px solid black",
    //   backgroundColor: "#1677ff",
    //   color: "#5c21ff",
    // });
  });

  // it("dynamic", () => {
  //   const Demo = (props: { token?: Partial<DerivativeToken> }) => (
  //     <DesignTokenProvider
  //       theme={{
  //         token: props.token,
  //         cssVar: {
  //           key: "apple",
  //         },
  //       }}
  //     >
  //       <Box className="target" />
  //     </DesignTokenProvider>
  //   );

  //   const { container, rerender } = render(<Demo />);

  //   let styles = Array.from(document.head.querySelectorAll("style"));
  //   const box = container.querySelector(".target")!;

  //   expect(styles.length).toBe(3);
  //   expect(box).toHaveClass("apple");
  //   expect(box).toHaveStyle({
  //     "--rc-line-height": "1.5",
  //     "lineHeight": "var(--rc-line-height)",
  //   });

  //   rerender(<Demo token={{ lineHeight: 2 }} />);

  //   styles = Array.from(document.head.querySelectorAll("style"));

  //   expect(styles.length).toBe(3);
  //   expect(box).toHaveClass("apple");
  //   expect(box).toHaveStyle({
  //     "--rc-line-height": "2",
  //     "lineHeight": "var(--rc-line-height)",
  //   });
  // });

  // it("could autoClear", () => {
  //   const { rerender } = render(
  //     <StyleProvider autoClear>
  //       <DesignTokenProvider
  //         theme={{
  //           cssVar: {
  //             key: "apple",
  //           },
  //         }}
  //       >
  //         <Box className="target" />
  //       </DesignTokenProvider>
  //     </StyleProvider>,
  //   );

  //   let styles = Array.from(document.head.querySelectorAll("style"));
  //   expect(styles.length).toBe(3);

  //   rerender(
  //     <StyleProvider autoClear>
  //       <DesignTokenProvider
  //         theme={{
  //           cssVar: {
  //             key: "apple",
  //           },
  //         }}
  //       >
  //         <div />
  //       </DesignTokenProvider>
  //     </StyleProvider>,
  //   );

  //   styles = Array.from(document.head.querySelectorAll("style"));
  //   expect(styles.length).toBe(1);
  // });

  // it("support ssr", () => {
  //   const cache = createCache();
  //   render(
  //     <StyleProvider cache={cache}>
  //       <DesignTokenProvider
  //         theme={{
  //           cssVar: {
  //             key: "apple",
  //           },
  //         }}
  //       >
  //         <Box className="target" />
  //       </DesignTokenProvider>
  //     </StyleProvider>,
  //   );

  //   expect(extractStyle(cache)).toMatchSnapshot();
  // });

  // it("css var prefix should regenerate component style", () => {
  //   const { rerender } = render(
  //     <DesignTokenProvider
  //       theme={{
  //         cssVar: {
  //           key: "apple",
  //           prefix: "app",
  //         },
  //       }}
  //     >
  //       <Box className="target" />
  //     </DesignTokenProvider>,
  //   );

  //   let styles = Array.from(document.head.querySelectorAll("style"));
  //   expect(styles.length).toBe(3);
  //   expect(
  //     styles.some(style => style.textContent?.includes("var(--app-")),
  //   ).toBe(true);
  //   expect(
  //     styles.some(style => style.textContent?.includes("var(--bank-")),
  //   ).toBe(false);

  //   rerender(
  //     <DesignTokenProvider
  //       theme={{
  //         cssVar: {
  //           key: "apple",
  //           prefix: "bank",
  //         },
  //       }}
  //     >
  //       <Box className="target" />
  //     </DesignTokenProvider>,
  //   );

  //   styles = Array.from(document.head.querySelectorAll("style"));
  //   expect(styles.length).toBe(4);
  //   expect(
  //     styles.some(style => style.textContent?.includes("var(--app-")),
  //   ).toBe(true);
  //   expect(
  //     styles.some(style => style.textContent?.includes("var(--bank-")),
  //   ).toBe(true);
  // });

  // it("could extract cssVar only", () => {
  //   const cache = createCache();
  //   render(
  //     <StyleProvider cache={cache}>
  //       <DesignTokenProvider
  //         theme={{
  //           cssVar: {
  //             key: "apple",
  //           },
  //         }}
  //       >
  //         <Box className="target" />
  //       </DesignTokenProvider>
  //     </StyleProvider>,
  //   );

  //   const cssVarStyle = extractStyle(cache, {
  //     types: ["cssVar", "token"],
  //     plain: true,
  //   });
  //   const styleStyle = extractStyle(cache, { types: "style", plain: true });

  //   expect(cssVarStyle).toContain("--rc-line-height:1.5;");
  //   expect(cssVarStyle).not.toContain("line-height:var(--rc-line-height)");
  //   expect(styleStyle).toContain("line-height:var(--rc-line-height)");
  //   expect(styleStyle).not.toContain("--rc-line-height:1.5;");
  // });
});
