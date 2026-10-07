<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api } from "../api/client.ts";
import Icon from "../reusable/ui/Icon.vue";
import { isViewable, lookOf } from "./format.ts";
import { type FileId, useBox } from "./useBox.ts";

/** The top of a tile: the picture itself for an image, otherwise an icon for the kind of file. */
const props = defineProps<{ file: FileId; mediaType: string }>();
const { call } = useBox();
const look = computed(() => lookOf(props.mediaType));
const picture = ref<string | null>(null);

onMounted(async () => {
  if (!isViewable(props.mediaType)) return;
  const result = await call("/files/view", api.files.view({ file: props.file }));
  if (!("error" in result)) picture.value = result.url;
});
</script>

<template>
  <div class="thumb" :style="{ background: look.tint, color: look.ink }">
    <img v-if="picture" :src="picture" alt="" />
    <Icon v-else :name="look.icon" :size="36" />
  </div>
</template>

<style scoped>
.thumb {
  display: grid;
  place-items: center;
  height: 120px;
  overflow: hidden;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
