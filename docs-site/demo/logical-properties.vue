<script lang="tsx" setup>
import type { Theme } from "cssinjs-vue";
import { createTheme, legacyLogicalPropertiesTransformer, StyleProvider, useStyleRegister } from "cssinjs-vue";
import { computed, ref } from "vue";

function Demo() {
  const theme = ref(createTheme(() => ({})));
  const token = ref({});
  const registerParam = computed(() => ({
    theme: theme.value as Theme<any, any>,
    token: token.value,
    path: [".logical-properties-box"],
  }));
  useStyleRegister(
    registerParam,
    () => ({
      ".logical-properties-box": {
        width: "300px",
        height: 100,
        backgroundColor: "pink",
        border: "1px solid #000",
        position: "relative",
        // css logical-properties
        paddingInline: 10,
        borderBlockEndWidth: 3,
        marginBlock: 10,
        borderEndEndRadius: "50%",
        inset: 5,
      },
    }),
  );

  return <div class="logical-properties-box">logicalProperties</div>;
}
</script>

<template>
  <StyleProvider :transformers="[legacyLogicalPropertiesTransformer]">
    <Demo />
  </StyleProvider>
</template>

<style lang="less" scoped>
</style>
