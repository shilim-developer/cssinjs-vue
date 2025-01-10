import type { ComputedRef, InjectionKey, PropType, Ref } from "vue";
import { TinyColor } from "@ctrl/tinycolor";
import { page } from "@vitest/browser/context";
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
import { render } from "vitest-browser-vue";
import { computed, defineComponent, inject, nextTick } from "vue";
import DesignTokenContext from "../docs-site/demo/components/DesignTokenContext.vue";
import { DesignTokenContextKey } from "../docs-site/demo/components/theme";
import { _cf } from "../src/hooks/useStyleRegister";
import { colorNameToRgb, colorsEqual } from "./utils";

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
    const parentContext = inject(DesignTokenContextKey, defaultConfig);
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
  setup() {
    const cls = useStyle();
    return () => <div class={classNames(cls, "box")} style={{ width: "10px", height: "10px" }} />;
  },
});

describe("cSS Variables", () => {
  beforeEach(() => {
    const styles = Array.from(document.head.querySelectorAll("style"));
    styles.forEach((style) => {
      style.parentNode?.removeChild(style);
    });
  });

  it("should work with cssVar", async () => {
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
    const app = render(TestContent);
    await nextTick();
    const styles = Array.from(document.head.querySelectorAll("style"));
    const box = app.container.querySelector(".target") as HTMLDivElement;
    const boxStyle = getComputedStyle(box);
    const baseFontSize = Number.parseInt(getComputedStyle(app.baseElement).fontSize);

    expect(styles.length).toBe(3);
    expect(styles[0].textContent).toContain(".apple{");
    expect(styles[0].textContent).toContain("--rc-line-height:1.5;");
    expect(styles[0].textContent).not.toContain("--rc-line-height-base:1.5;");
    expect(styles[0].textContent).not.toContain("--rc-small-screen:800;");
    expect(styles[1].textContent).toContain("--rc-box-box-color:#5c21ff");
    expect(styles[1].textContent).toContain(".apple.box{");
    expect(styles[2].textContent).toContain("line-height:var(--rc-line-height);");
    expect(styles[2].textContent).toContain("content:\"800\"");
    expect(box).toHaveClass("apple");
    expect(boxStyle.getPropertyValue("--rc-line-height")).toContain(1.5);
    expect(boxStyle.lineHeight).toContain(`${baseFontSize * 1.5}px`);
  });

  it("could mix with non-css-var", async () => {
    const app = render(() => (
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
    await nextTick();
    const styles = Array.from(document.head.querySelectorAll("style"));
    expect(styles).toHaveLength(7);

    const nonCssVarBox = app.container.querySelector(".non-css-var")!;
    const boxStyle = getComputedStyle(nonCssVarBox);
    const baseFontSize = Number.parseInt(getComputedStyle(app.baseElement).fontSize);
    expect(boxStyle.lineHeight).toEqual(`${baseFontSize * 1.5}px`);
    expect(boxStyle.border).toEqual(`1px solid ${colorNameToRgb("black")}`);
    expect(colorsEqual(boxStyle.backgroundColor, "#1890ff")).toBe(true);
    expect(colorsEqual(boxStyle.color, "#5c21ff")).toBe(true);

    const cssVarBox = app.container.querySelector(".css-var")!;
    const cssVarBoxStyle = getComputedStyle(cssVarBox);

    expect(cssVarBoxStyle.getPropertyValue("--rc-line-height")).toEqual("1.5");
    expect(cssVarBoxStyle.getPropertyValue("--rc-border-width")).toEqual("1px");
    expect(cssVarBoxStyle.getPropertyValue("--rc-border-color")).toEqual("black");
    expect(cssVarBoxStyle.getPropertyValue("--rc-primary-color")).toEqual("#1677ff");
    expect(cssVarBoxStyle.getPropertyValue("--rc-box-box-color")).toEqual("#5c21ff");
    expect(cssVarBoxStyle.lineHeight).toEqual(`${baseFontSize * 1.5}px`);
    expect(cssVarBoxStyle.border).toEqual(`1px solid ${colorNameToRgb("black")}`);
    expect(colorsEqual(cssVarBoxStyle.backgroundColor, "#1677ff")).toBe(true);
    expect(colorsEqual(cssVarBoxStyle.color, "#5c21ff")).toBe(true);

    const cssVarBox2 = app.container.querySelector(".css-var-2")!;
    const cssVarBox2Style = getComputedStyle(cssVarBox2);
    expect(cssVarBox2).toHaveClass("banana");
    expect(cssVarBox2).not.toHaveClass("apple");
    expect(cssVarBox2Style.getPropertyValue("--rc-line-height")).toEqual("1.5");
    expect(cssVarBox2Style.getPropertyValue("--rc-border-width")).toEqual("2px");
    expect(cssVarBox2Style.getPropertyValue("--rc-border-color")).toEqual("black");
    expect(cssVarBox2Style.getPropertyValue("--rc-primary-color")).toEqual("#1677ff");
    expect(cssVarBox2Style.getPropertyValue("--rc-box-box-color")).toEqual("#5c21ff");
    expect(cssVarBox2Style.lineHeight).toEqual(`${baseFontSize * 1.5}px`);
    expect(cssVarBox2Style.border).toEqual(`2px solid ${colorNameToRgb("black")}`);
    expect(colorsEqual(cssVarBox2Style.backgroundColor, "#1677ff")).toBe(true);
    expect(colorsEqual(cssVarBox2Style.color, "#5c21ff")).toBe(true);

    const nonCssVarBox2 = app.container.querySelector(".non-css-var-2")!;
    const nonCssVarBox2Style = getComputedStyle(nonCssVarBox2);
    expect(nonCssVarBox2).not.toHaveClass("banana");
    expect(nonCssVarBox2).not.toHaveClass("apple");
    expect(nonCssVarBox2Style.lineHeight).toEqual(`${baseFontSize * 1.5}px`);
    expect(nonCssVarBox2Style.border).toEqual(`3px solid ${colorNameToRgb("black")}`);
    expect(colorsEqual(nonCssVarBox2Style.backgroundColor, "#1677ff")).toBe(true);
    expect(colorsEqual(nonCssVarBox2Style.color, "#5c21ff")).toBe(true);
  });

  it("dynamic", async () => {
    const Demo = defineComponent({
      name: "Demo",
      props: {
        token: {
          type: Object as PropType<Partial<DerivativeToken>>,
        },
      },
      setup(props) {
        return () => (
          <DesignTokenProvider
            theme={{
              token: props.token,
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

    const { container, rerender } = render(<Demo />);
    await nextTick();

    let styles = Array.from(document.head.querySelectorAll("style"));
    const box = container.querySelector(".target")!;
    const boxStyle = getComputedStyle(box);
    console.log("boxStyle:", boxStyle.getPropertyPriority("--rc-line-height"));

    expect(styles.length).toBe(3);
    expect(box).toHaveClass("apple");
    expect(boxStyle.getPropertyPriority("--rc-line-height")).toEqual("1.5");
    expect(boxStyle.lineHeight).toEqual("var(--rc-line-height)");

    rerender(<Demo token={{ lineHeight: 2 }} />);

    styles = Array.from(document.head.querySelectorAll("style"));

    expect(styles.length).toBe(3);
    expect(box).toHaveClass("apple");
    expect(box).toHaveStyle({
      "--rc-line-height": "2",
      "lineHeight": "var(--rc-line-height)",
    });
  });

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
