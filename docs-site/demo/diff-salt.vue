<script lang="tsx" setup>
import classNames from "classnames";
import { type CSSInterpolation, useStyleRegister } from "cssinjs-vue";
import { computed } from "vue";
import DesignTokenContext from "./components/DesignTokenContext.vue";
import { type DerivativeToken, useToken } from "./components/theme";

// Style 1
function genStyle1(prefixCls: string, token: DerivativeToken): CSSInterpolation {
  return [
    {
      [`.${prefixCls}`]: {
        width: 20,
        height: 20,
        backgroundColor: token.primaryColor,
        borderRadius: token.borderRadius,
      },
    },
  ];
}

// Style 2
function genStyle2(prefixCls: string, token: DerivativeToken): CSSInterpolation {
  return [
    {
      [`.${prefixCls}`]: {
        width: 20,
        height: 20,
        backgroundColor: token.primaryColor,
        borderRadius: token.borderRadius * 3,
      },
    },
  ];
}

// Component
function genComponent(genStyle: typeof genStyle1) {
  return ({ className, ...restProps }: any) => {
    const prefixCls = "ant-box";

    // 【自定义】制造样式
    const [theme, token, hashId] = useToken();

    const registerParam = computed(() => {
      return {
        theme: theme.value,
        token: token.value,
        hashId: hashId.value,
        path: [prefixCls],
      };
    });

    // 全局注册，内部会做缓存优化
    useStyleRegister(registerParam, () => [
      genStyle(prefixCls, token.value),
    ]);

    return (
      <div
        className={classNames(prefixCls, hashId.value, className)}
        {...restProps}
      />
    );
  };
}

const Box1 = genComponent(genStyle1);
const Box2 = genComponent(genStyle2);
</script>

<template>
  <div
    :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }"
  >
    <h3 :style="{ 'margin-top': 0, 'margin-bottom': '0.5em' }">
      相同 Token 不同 Salt 互不冲突
    </h3>

    <div
      :style="{ display: 'flex', columnGap: '8px' }"
    >
      <DesignTokenContext hashed="123">
        <Box1 />
      </DesignTokenContext>
      <DesignTokenContext hashed="234">
        <Box2 />
      </DesignTokenContext>
    </div>
  </div>
</template>

<style lang="less" scoped>
</style>
