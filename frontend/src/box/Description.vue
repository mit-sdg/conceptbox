<script setup lang="ts">
import { computed } from "vue";
import { api } from "../api/client.ts";
import { useBox, type MyFile } from "./useBox.ts";

const props = defineProps<{ row: MyFile }>();
const { box, working, change } = useBox();
const latest = computed(() => props.row.descriptions.at(-1));
</script>

<template>
  <template v-if="latest">
    <p v-if="latest.stage === 'ABANDONED'" class="description muted">
      No description: {{ latest.reason }}
      <button type="button" class="text-button" :disabled="working" @click="change('/files/describe', api.files.describe({ file: row.file }))">Try again</button>
    </p>
    <p v-else-if="latest.stage === 'WAITING' || !latest.answer.trim()" class="description writing">
      Writing a description…
    </p>
    <p v-else class="description">{{ latest.answer }}</p>
  </template>
  <p v-else-if="box?.describing.on" class="description">
    <button type="button" class="text-button" :disabled="working" @click="change('/files/describe', api.files.describe({ file: row.file }))">Describe</button>
  </p>
</template>

<style scoped>
.description {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-text);
  white-space: pre-line;
}
.description.muted {
  color: var(--color-text-muted);
}
.writing {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
}
.writing::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
