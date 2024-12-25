import classNames from "classnames";
import { useStyleRegister } from "cssinjs-vue";
import { computed, defineComponent } from "vue";
import {
  genDefaultButtonStyle,
  genGhostButtonStyle,
  genPrimaryButtonStyle,
} from "./button.style";
import { useToken } from "./theme";

export default defineComponent({
  name: "Button",
  props: {
    type: {
      type: String,
      default: "default",
    },
  },
  setup(props, { slots, attrs }) {
    const prefixCls = "ant-btn";
    const [theme, token, hashId, cssVarKey] = useToken();
    const registerParam = computed(() => {
      return {
        theme: theme.value,
        token: token.value,
        hashId: hashId.value,
        path: [prefixCls],
      };
    });
    const defaultCls = `${prefixCls}-default`;
    const primaryCls = `${prefixCls}-primary`;
    const ghostCls = `${prefixCls}-ghost`;
    const wrapSSR = useStyleRegister(registerParam, () => {
      return [
        genDefaultButtonStyle(defaultCls, token.value),
        genPrimaryButtonStyle(primaryCls, token.value),
        genGhostButtonStyle(ghostCls, token.value),
      ];
    });

    return () => {
      const typeCls: any = {
        [defaultCls]: props.type === "default",
        [primaryCls]: props.type === "primary",
        [ghostCls]: props.type === "ghost",
      };
      const className = slots?.class;
      return wrapSSR(
        <button
          class={classNames(prefixCls, typeCls, hashId.value, className, cssVarKey.value)}
          {...attrs}
        >
          {slots?.default?.()}
        </button>,
      );
    };
  },
});
