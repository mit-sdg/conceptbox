<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "../api/client.ts";
import Dialog from "../reusable/ui/Dialog.vue";
import Icon from "../reusable/ui/Icon.vue";
import { type FileId, useBox } from "./useBox.ts";

/** Shows a picture full screen, or shows why it can't be shown and reloads the box without it, as `download` does. */
const props = defineProps<{ file: FileId; name: string; details: string }>();
const emit = defineEmits<{ close: [] }>();
const { error, call, refresh, download } = useBox();
const picture = ref<string | null>(null);

onMounted(async () => {
  const result = await call("/files/view", api.files.view({ file: props.file }));
  if ("error" in result) {
    error.value = result.error;
    emit("close");
    await refresh();
  } else {
    picture.value = result.url;
  }
});
</script>

<template>
  <Dialog dark :title="name" :subtitle="details" @close="$emit('close')">
    <template #actions>
      <button type="button" class="button download" @click="download(file)"><Icon name="download" />Download</button>
    </template>
    <div class="stage">
      <img v-if="picture" :src="picture" :alt="name" />
    </div>
  </Dialog>
</template>

<style scoped>
.download {
  color: var(--color-text);
  background: var(--color-page);
}
.stage {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  place-items: center;
}
img {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-md);
  object-fit: contain;
}
</style>
