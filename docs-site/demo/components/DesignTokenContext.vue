<script lang="ts" setup>
import type { PropType } from "vue";
import type { DesignToken } from "./theme";
import { provide } from "vue";
import { defaultDesignToken, DesignTokenContextKey } from "./theme";

defineOptions({
  name: "DesignTokenContext",
});

const props = defineProps({
  token: {
    type: Object as PropType<Partial<DesignToken>>,
    default: () => defaultDesignToken,
  },
  hashed: {
    type: [Boolean, String] as PropType<boolean | string>,
    default: undefined,
  },
  cssVar: {
    type: Object as PropType<{
      key: string;
    }>,
    default: undefined,
  },
  autoClear: {
    type: Boolean,
    default: false,
  },
});

provide(DesignTokenContextKey, props);
</script>

<template>
  <slot />
</template>
