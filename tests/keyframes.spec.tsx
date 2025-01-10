import { mount } from "@vue/test-utils";
import { Keyframes, Theme, useCacheToken, useStyleRegister } from "cssinjs-vue";
import { beforeEach, describe, expect, it } from "vitest";
import { computed, defineComponent } from "vue";

interface DesignToken {
  primaryColor: string;
}

interface DerivativeToken extends DesignToken {
  primaryColorDisabled: string;
}

function derivative(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    primaryColorDisabled: designToken.primaryColor,
  };
}

const baseToken: DesignToken = {
  primaryColor: "#1890ff",
};

const theme = computed(() => new Theme(derivative));
const animation = new Keyframes("anim", {
  to: {
    transform: `rotate(360deg)`,
  },
});

describe("animation", () => {
  beforeEach(() => {
    const styles = Array.from(document.head.querySelectorAll("style"));
    styles.forEach((style) => {
      style.parentNode?.removeChild(style);
    });
  });

  describe("without hashed", () => {
    const Box = defineComponent({
      setup() {
        const tokens = computed(() => [baseToken]);
        const cacheToken = useCacheToken(theme, tokens);
        const info = computed(() => ({
          theme: theme.value,
          token: cacheToken.value[0],
          hashId: cacheToken.value[1],
          path: [".box"],
        }));
        useStyleRegister(info, () => ({
          ".box": {
            animationName: animation,
          },
        }));
        useStyleRegister(info, () => ({
          ".test": {
            animationName: animation,
          },
        }));
        useStyleRegister(info, () => ({
          ".nest": {
            ".child": {
              animationName: animation,
            },
          },
        }));

        return () => <div class="hash">{cacheToken.value[1]}</div>;
      },
    });

    it("no conflict keyframes", () => {
      expect(document.head.querySelectorAll("style")).toHaveLength(0);

      // Multiple time only has one style instance
      const app = mount(Box);
      const hashId = app.find(".hash")?.text();

      let count = 0;
      const styles = Array.from(document.head.querySelectorAll("style"));
      styles.forEach((style) => {
        if (style.textContent?.includes(`@keyframes ${hashId}-anim`)) {
          count += 1;
        }
      });

      expect(count).toEqual(1);
      app.unmount();
    });
  });
});
