<script lang="tsx" setup>
import { createCache, StyleProvider } from "cssinjs-vue";
import { createApp, ref, watchEffect } from "vue";
import Button from "./components/button";
import DesignTokenContext from "./components/DesignTokenContext.vue";
import Spin from "./components/spin";

const visible = ref(true);
const pRef = ref<HTMLParagraphElement>();

let rootElement: HTMLDivElement;
watchEffect(() => {
  if (visible.value) {
    rootElement = document.createElement("div");
    pRef.value?.parentElement?.appendChild(rootElement);

    const shadowRoot = rootElement.attachShadow({ mode: "open" });
    const container = document.createElement("div");
    container.id = "vueRoot";
    shadowRoot.appendChild(container);
    const root = createApp(() => (
      <DesignTokenContext hashed>
        <StyleProvider container={shadowRoot} cache={createCache()}>
          <div style={{ border: "6px solid #000", padding: "8px" }}>
            <h1>Shadow Root!</h1>
            <Button type="primary">Hello World!</Button>
            <Spin />
          </div>
        </StyleProvider>
      </DesignTokenContext>
    ));
    root.mount(container);
  }
  else {
    rootElement?.remove();
  }
});
</script>

<template>
  <button
    :style="{
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '0 10px',
      marginBottom: '10px',
    }"
    @click="visible = !visible"
  >
    Trigger {{ visible }}
  </button>
  <p ref="pRef" />
</template>

<style lang="less" scoped>

</style>
