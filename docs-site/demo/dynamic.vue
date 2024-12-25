<script lang="ts" setup>
import { ref } from "vue";
import Button from "./components/button";
import DesignTokenContext from "./components/DesignTokenContext.vue";
import Spin from "./components/spin";

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}
const show = ref(true);

const primaryColor = ref(randomColor());

function setPrimaryColor() {
  primaryColor.value = randomColor();
}
</script>

<template>
  <div
    :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }"
  >
    <h3 :style="{ 'margin-top': 0, 'margin-bottom': '0.5em' }">
      随机样式，新的 Token 生成删除原本的全部 style
    </h3>

    <label>
      <input type="checkbox" :checked="show" @change="show = !show">
      Show Components
    </label>

    <DesignTokenContext
      :token="{
        primaryColor,
      }"
    >
      <div
        v-if="show" :style="{ display: 'flex', columnGap: '8px' }"
      >
        <Button
          type="primary"
          @click="() => setPrimaryColor()"
        >
          Random Primary Color
        </Button>
        <Spin />
      </div>
    </DesignTokenContext>
  </div>
</template>

<style lang="scss" scoped>

</style>
