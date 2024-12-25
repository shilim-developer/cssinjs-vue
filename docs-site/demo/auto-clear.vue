<script lang="ts" setup>
import { StyleProvider } from "cssinjs-vue";
import { ref } from "vue";
import Button from "./components/button";

const show = ref(true);
</script>

<template>
  <StyleProvider :auto-clear="true">
    <div :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }">
      <h3 :style="{ 'margin-top': 0, 'margin-bottom': '0.5em' }">
        配置同步自动删除添加的样式
      </h3>

      <label>
        <input
          v-model="show"
          type="checkbox"
        >
        Show Components
      </label>

      <div v-if="show">
        <Button>Default</Button>
        <Button type="primary">
          Primary
        </Button>
        <Button type="ghost">
          Ghost
        </Button>
      </div>
    </div>
  </StyleProvider>
</template>

<style lang="less" scoped>
</style>
