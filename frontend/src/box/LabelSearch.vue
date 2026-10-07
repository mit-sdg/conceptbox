<script setup lang="ts">
import { computed, ref } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import { useBox } from "./useBox.ts";

const { box, searchByLabel } = useBox();
const typed = ref("");
const focused = ref(false);

/** Each label on my files, with how many files have it, alphabetically. */
const labels = computed(() => {
  const counts = new Map<string, number>();
  for (const row of box.value?.myFiles ?? []) {
    for (const label of row.labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
});

const matches = computed(() => {
  const start = typed.value.trim().replace(/^#/, "").toLowerCase();
  return start ? labels.value.filter(([label]) => label.startsWith(start)).slice(0, 6) : [];
});

/** Hides the suggestions once the focus leaves the search, but not when it moves to a suggestion. */
function closeIfOutside(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) focused.value = false;
}

function find(label: string) {
  typed.value = "";
  searchByLabel(label);
}
</script>

<template>
  <form
    v-if="labels.length"
    class="search"
    role="search"
    @submit.prevent="matches[0] && find(matches[0][0])"
    @focusin="focused = true"
    @focusout="closeIfOutside"
  >
    <label class="box">
      <Icon name="search" :size="16" />
      <input
        v-model="typed"
        placeholder="Find files by label"
        aria-label="Find files by label"
        autocomplete="off"
      />
    </label>
    <ul v-if="focused && matches.length" class="matches">
      <li v-for="[label, count] in matches" :key="label">
        <!-- Safari doesn't focus a button on click, so mousedown.prevent keeps the focus in the input until the click. -->
        <button type="button" @mousedown.prevent @click="find(label)">
          <span>#{{ label }}</span>
          <span class="muted">{{ count }} {{ count === 1 ? "file" : "files" }}</span>
        </button>
      </li>
    </ul>
  </form>
</template>

<style scoped>
.search {
  position: relative;
  flex: 0 1 300px;
}
@media (max-width: 600px) {
  .search {
    flex-basis: 100%;
  }
}
.box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 14px;
  border: 1.5px solid transparent;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-muted);
  box-shadow: var(--shadow-card);
}
.box:focus-within {
  border-color: var(--color-accent);
}
input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--color-text);
}
.matches {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 10;
  padding: 6px;
  list-style: none;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}
.matches button {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
}
.matches button:hover {
  background: var(--color-page);
}
</style>
