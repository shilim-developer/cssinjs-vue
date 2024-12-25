// 通用框架
import type { DerivativeToken } from "./theme";
import { type CSSInterpolation, type CSSObject, unit } from "cssinjs-vue";

export function genSharedButtonStyle(prefixCls: string, token: DerivativeToken): CSSInterpolation {
  return {
    [`.${prefixCls}`]: {
      padding: "0 10px",
      borderColor: token.borderColor,
      borderStyle: "solid",
      borderWidth: `${unit(token.borderWidth)}`,
      borderRadius: token.borderRadius,

      cursor: "pointer",

      transition: "background 0.3s",
    },
  };
}

// 实心底色样式
export function genSolidButtonStyle(prefixCls: string, token: DerivativeToken, postFn: () => CSSObject): CSSInterpolation {
  return [
    genSharedButtonStyle(prefixCls, token),
    {
      [`.${prefixCls}`]: {
        ...postFn(),
      },
    },
  ];
}

// 默认样式
export function genDefaultButtonStyle(prefixCls: string, token: DerivativeToken): CSSInterpolation {
  return genSolidButtonStyle(prefixCls, token, () => ({
    "backgroundColor": token.componentBackgroundColor,
    "color": token.textColor,

    "&:hover": {
      borderColor: token.primaryColor,
      color: token.primaryColor,
    },
  }));
}

// 主色样式
export function genPrimaryButtonStyle(prefixCls: string, token: DerivativeToken): CSSInterpolation {
  return genSolidButtonStyle(prefixCls, token, () => ({
    "backgroundColor": token.primaryColor,
    "border": `${unit(token.borderWidth)} solid ${token.primaryColor}`,
    "color": token.reverseTextColor,

    "&:hover": {
      backgroundColor: token.primaryColorDisabled,
    },
  }));
}

// 透明按钮
export function genGhostButtonStyle(prefixCls: string, token: DerivativeToken): CSSInterpolation {
  return [
    genSharedButtonStyle(prefixCls, token),
    {
      [`.${prefixCls}`]: {
        "backgroundColor": "transparent",
        "color": token.primaryColor,
        "border": `${unit(token.borderWidth)} solid ${token.primaryColor}`,

        "&:hover": {
          borderColor: token.primaryColor,
          color: token.primaryColor,
        },
      },
    },
  ];
}
