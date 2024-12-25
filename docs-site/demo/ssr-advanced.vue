<script lang="tsx" setup>
import { createCache, extractStyle, StyleProvider } from "cssinjs-vue";
import { defineComponent, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import Button from "./components/button";
import DesignTokenContext from "./components/DesignTokenContext.vue";
import Spin from "./components/spin";

function Demo() {
  return (
    <div style={{ display: "flex", columnGap: 8 }}>
      {Array.from({ length: 3 }).fill(0).map((_, i) => (
        <Button key={i} type="ghost">
          Button
          {" "}
          {i + 1}
        </Button>
      ))}
      <Spin />

      <DesignTokenContext
        token={{ primaryColor: "red" }}
        hashed={true}
      >
        <Button type="ghost">
          Button
        </Button>
        <Spin />
      </DesignTokenContext>
      <DesignTokenContext
        token={{ primaryColor: "green" }}
        hashed="v5"
      >
        <Button type="ghost">
          Button
        </Button>
        <Spin />
      </DesignTokenContext>
    </div>
  );
}

const PreComponent = defineComponent({
  name: "PreComponent",
  props: {
    type: {
      type: String,
      default: "default",
    },
  },
  setup(_, { slots }) {
    return () => (
      <pre
        style={{
          background: "#FFF",
          padding: "8px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {slots.default?.()}
      </pre>
    );
  },
});

const cacheRef = createCache();
const ssrHTML = ref("");
renderToString(
  <StyleProvider
    // Tell cssinjs not insert dom style. No need in real world
    mock="server"
    cache={cacheRef}
  >
    <Demo />
  </StyleProvider>,
).then((html) => {
  ssrHTML.value = html;
});
const ssrStyle = extractStyle(cacheRef);
const plainStyle = extractStyle(cacheRef, true);
</script>

<template>
  <div :style="{ background: 'rgba(0,0,0,0.1)', padding: '16px' }">
    <h3 :style="{ 'margin-top': 0, 'margin-bottom': '0.5em' }">
      服务端渲染提前获取所有样式
    </h3>

    <PreComponent>{{ plainStyle }}</PreComponent>
    <PreComponent>{{ ssrStyle }}</PreComponent>
    <PreComponent>{{ ssrHTML }}</PreComponent>

    <h4>SSR Style</h4>
    <div id="ssr" v-html="ssrHTML" />
    <div className="ant-cssinjs-cache-path" />
  </div>
</template>

<style lang="scss" scoped>

</style>
