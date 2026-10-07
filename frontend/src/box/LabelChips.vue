<script setup lang="ts">
import { computed } from "vue";
import { api } from "../api/client.ts";
import Icon from "../reusable/ui/Icon.vue";
import { useBox, type MyFile } from "./useBox.ts";

const props = defineProps<{ row: MyFile }>();
const { working, change, searchByLabel } = useBox();
const latest = computed(() => props.row.labelQuestions.at(-1));
</script>

<template>
  <ul v-if="row.labels.length" class="labels">
    <li v-for="label in row.labels" :key="label" class="label">
      <button type="button" class="find" @click="searchByLabel(label)">#{{ label }}</button>
      <button
        type="button"
        class="remove"
        :aria-label="`Remove label ${label}`"
        :disabled="working"
        @click="change('/files/unlabel', api.files.unlabel({ file: row.file, label }))"
      >
        <Icon name="close" :size="12" />
      </button>
    </li>
  </ul>
  <p v-if="latest?.stage === 'ABANDONED'" class="muted">
    No labels: {{ latest.reason }}
    <button type="button" class="text-button" :disabled="working" @click="change('/files/relabel', api.files.relabel({ file: row.file }))">Try again</button>
  </p>
</template>

<style scoped>
.labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  padding: 0;
  list-style: none;
}
.label {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: var(--text-xs);
}
.find {
  padding: 2px 10px;
  border: 0;
  background: none;
  color: inherit;
}
.label:hover .find {
  padding-right: 2px;
}
/* The remove button is shown on hover or focus, and always on touch screens. */
.remove {
  display: none;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-right: 3px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
}
.label:hover .remove,
.label:focus-within .remove {
  display: grid;
}
.remove:hover {
  background: #ffffff;
}
@media (hover: none) {
  .remove {
    display: grid;
  }
  .find {
    padding-right: 2px;
  }
}
</style>
