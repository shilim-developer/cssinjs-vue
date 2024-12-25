<script lang="tsx" setup>
import type { Theme } from "cssinjs-vue";
import { createTheme, px2remTransformer, StyleProvider, useStyleRegister } from "cssinjs-vue";
import { computed, ref } from "vue";

function Demo() {
  const theme = ref(createTheme(() => ({})));
  const token = ref({});
  const registerParam = computed(() => ({
    theme: theme.value as Theme<any, any>,
    token: token.value,
    path: [".px2rem-box"],
  }));
  useStyleRegister(
    registerParam,
    () => ({
      ".px2rem-box": {
        width: "400px",
        backgroundColor: "green",
        fontSize: "32px",
        border: "10PX solid #f0f",
        color: "white",
        lineHeight: "1.4",
      },
      "@media only screen and (max-width: 600px)": {
        ".px2rem-box": {
          backgroundColor: "red",
        },
      },
    }),
  );

  return <div class="px2rem-box">px2rem</div>;
}
</script>

<template>
  <StyleProvider :transformers="[px2remTransformer()]">
    <Demo />
  </StyleProvider>
</template>

<style lang="less" scoped>
</style>
