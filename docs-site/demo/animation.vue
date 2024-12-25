<script lang="ts" setup>
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

</style>
