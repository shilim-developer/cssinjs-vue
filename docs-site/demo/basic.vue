<script lang="ts" setup>
import { ref } from "vue";
import Button from "./components/button";

const show = ref(true);
</script>

<template>
  <div :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }">
    <h3 :style="{ 'margin-top': 0, 'margin-bottom': '0.5em' }">
      默认情况下不会自动删除添加的样式
    </h3>

    <label>
      <input type="checkbox" :checked="show" @change="show = !show">
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
      <Button class="btn-override">
        Override By ClassName
      </Button>
    </div>
  </div>
</template>

<style lang="less">
.btn-override {
  background: rgb(255, 200, 200);
}
</style>
