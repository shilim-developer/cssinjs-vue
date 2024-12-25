import type { CSSInterpolation } from "cssinjs-vue";
import type { DerivativeToken } from "./theme";

import classNames from "classnames";
import { Keyframes, useStyleRegister } from "cssinjs-vue";
import { computed, defineComponent } from "vue";
import { useToken } from "./theme";

const animation = new Keyframes("loadingCircle", {
  to: {
    transform: `rotate(360deg)`,
  },
});

// 通用框架
function genSpinStyle(prefixCls: string, token: DerivativeToken): CSSInterpolation {
  return [
    {
      [`.${prefixCls}`]: {
        width: 20,
        height: 20,
        border: "none",
        backgroundColor: token.primaryColor,

        animationName: animation,
        animationDuration: "1s",
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      },
    },
    animation,
  ];
}

export default defineComponent({
  name: "Spin",
  props: {
    type: {
      type: String,
      default: "default",
    },
  },
  setup(_, { slots, attrs }) {
    const prefixCls = "ant-spin";
    const [theme, token, hashId] = useToken();
    const registerParam = computed(() => {
      return {
        theme: theme.value,
        token: token.value,
        hashId: hashId.value,
        path: [prefixCls],
      };
    });
    const wrapSSR = useStyleRegister(registerParam, () => {
      return [
        genSpinStyle(prefixCls, token.value),
      ];
    });

    return () => {
      const className = slots?.class;
      return wrapSSR(
        <button
          class={classNames(prefixCls, hashId.value, className)}
          {...attrs}
        >
          {slots?.default?.()}
        </button>,
      );
    };
  },
});
