<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import DescribingSwitch from "./DescribingSwitch.vue";
import DropZone from "./DropZone.vue";
import FileTile from "./FileTile.vue";
import LabelSearch from "./LabelSearch.vue";
import SharedWithMe from "./SharedWithMe.vue";
import Trash from "./Trash.vue";
import { useBox } from "./useBox.ts";

const { box, error, search, refresh, reset, clearSearch } = useBox();

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

// A reaction labels a file just after the agent concludes its label question, so the box is reloaded once more
// after the last open question is concluded.
const answering = computed(() => box.value?.myFiles.some((row) => row.openQuestions > 0) ?? false);
let refreshOnceMore = false;
const timer = setInterval(() => {
  if (answering.value || refreshOnceMore) refresh();
  refreshOnceMore = answering.value;
}, 1000);
onUnmounted(() => clearInterval(timer));

/** My files, or only those with the label I searched for. */
const shown = computed(() => {
  const files = box.value?.myFiles ?? [];
  const found = search.value?.files;
  return found ? files.filter((row) => found.includes(row.file)) : files;
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
      <section class="mine">
        <div class="heading">
          <template v-if="search">
            <h2>Labeled #{{ search.label }}</h2>
            <button type="button" class="button outline" @click="clearSearch">All files</button>
          </template>
          <h2 v-else-if="box.myFiles.length">My files</h2>
          <span class="tools">
            <DescribingSwitch />
            <LabelSearch />
          </span>
        </div>
        <p v-if="search?.files?.length === 0" class="muted">None of your files have this label.</p>
        <div v-if="shown.length" class="tiles">
          <FileTile v-for="row in shown" :key="row.file" :row="row" />
        </div>
      </section>
      <SharedWithMe :files="box.sharedWithMe" />
      <Trash :files="box.myTrash" />
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
.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}
.tools {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
}
@media (max-width: 600px) {
  .tools {
    flex-basis: 100%;
    justify-content: space-between;
  }
}
</style>
