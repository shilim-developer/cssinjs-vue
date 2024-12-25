<script lang="tsx" setup>
import classNames from "classnames";
import { StyleProvider, Theme, useStyleRegister } from "cssinjs-vue";
import { computed, defineComponent, ref } from "vue";

const DivComponent = defineComponent({
  name: "DivComponent",
  props: {
    type: {
      type: String,
      default: "default",
    },
  },
  setup(props, { slots, attrs }) {
    const theme = ref(new Theme([() => ({})]));
    const token = ref({ _tokenKey: "test" });
    const path = ref(["layer"]);
    const layer = ref({
      name: "layer",
      dependencies: ["shared"],
    });
    const registerParam = computed(() => ({
      theme: theme.value as Theme<any, any>,
      token: token.value,
      path: path.value,
      layer: layer.value,
    }));
    // Layer
    useStyleRegister(
      registerParam,
      () => ({
        ".layer-div": {
          color: "blue",

          span: {
            "color": "pink",
            "cursor": "pointer",

            "&:hover": {
              color: "red",
            },
          },
        },
      }),
    );

    // Shared
    useStyleRegister(
      registerParam,
      () => ({
        "html body .layer-div": {
          color: "green",
        },
      }),
    );

    return () => <div class={classNames(attrs, "layer-div")} {...props}>{slots.default?.()}</div>;
  },
});
</script>

<template>
  <StyleProvider layer>
    <DivComponent>
      Text should be blue.
      <div>
        The link should be <span>pink</span>
      </div>
    </DivComponent>
  </StyleProvider>
</template>

<style lang="scss" scoped>

</style>
