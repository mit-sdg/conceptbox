<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import DropZone from "./DropZone.vue";
import FileTile from "./FileTile.vue";
import SharedWithMe from "./SharedWithMe.vue";
import { useBox } from "./useBox.ts";

const { box, error, refresh, reset } = useBox();

onMounted(() => {
  // A reply that came back after the last session ended may have set `error` after BoxPage unmounted.
  reset();
  refresh();
  // Someone may have shared a file while this tab was in the background.
  window.addEventListener("focus", refresh);
});
onUnmounted(() => {
  window.removeEventListener("focus", refresh);
  reset();
});
</script>

<template>
  <div class="page">
    <p v-if="error" class="banner" role="alert">
      {{ error }}
      <button type="button" class="icon-button" aria-label="Dismiss" @click="error = null"><Icon name="close" :size="16" /></button>
    </p>
    <template v-if="box">
      <DropZone />
      <section v-if="box.myFiles.length" class="mine">
        <h2>My files</h2>
        <div class="tiles">
          <FileTile v-for="row in box.myFiles" :key="row.file" :row="row" />
        </div>
      </section>
      <SharedWithMe :files="box.sharedWithMe" />
    </template>
    <p v-else-if="!error" class="muted">Loading your files…</p>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
.banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 10px 10px 16px;
  border-radius: var(--radius-md);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.banner .icon-button {
  margin-left: auto;
  color: inherit;
}
.mine {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
