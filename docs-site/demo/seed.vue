<script lang="tsx" setup>
import type { DesignToken } from "./components/theme";
import Button from "./components/button";
import DesignTokenContext from "./components/DesignTokenContext.vue";

function ButtonList() {
  return (
    <div style={{ background: "rgba(0,0,0,0.1)", padding: "16px" }}>
      <Button>Default</Button>
      <Button type="primary">Primary</Button>
      <Button type="ghost">Ghost</Button>
    </div>
  );
}

const redTheme: Partial<DesignToken> = {
  primaryColor: "red",
};
const orangeTheme: Partial<DesignToken> = {
  primaryColor: "orange",
};
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '8px' }">
    <h3 :style="{ 'margin-top': 0, 'margin-bottom': '0.5em' }">
      混合 SeedToken
    </h3>

    <ButtonList />

    <DesignTokenContext :token="redTheme" :hashed="true">
      <ButtonList />
    </DesignTokenContext>

    <DesignTokenContext :token="orangeTheme" :hashed="true">
      <ButtonList />
    </DesignTokenContext>
  </div>
</template>

<style lang="less" scoped>
</style>
