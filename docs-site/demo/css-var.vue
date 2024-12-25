<script lang="ts" setup>
import { ref } from "vue";
import Button from "./components/button";
import DesignTokenContext from "./components/DesignTokenContext.vue";

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
      <DesignTokenContext :css-var="{ key: 'default' }" hashed>
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
      </DesignTokenContext>
    </div>
    <div v-if="show" style="margin-top: 5px;">
      <DesignTokenContext :token="{ primaryColor: 'green' }" :css-var="{ key: 'default2' }" hashed>
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
      </DesignTokenContext>
    </div>
  </div>
</template>

<style lang="less">
.btn-override {
  background: rgb(255, 200, 200);
}
</style>
