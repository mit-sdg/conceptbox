<script setup lang="ts">
import { ref, useId } from "vue";

/** A "?" button that shows a tip under it. The tip starts at the button's left edge; set `centered` when that would run off a phone's screen. */
defineProps<{ label: string; centered?: boolean }>();
const open = ref(false);
const id = useId();

/** Pressing Escape closes an open tip. The keydown default is prevented, so a dialog around the tip stays open. */
function escape(event: KeyboardEvent) {
  if (!open.value) return;
  event.preventDefault();
  open.value = false;
}
</script>

<template>
  <span class="help" @mouseenter="open = true" @mouseleave="open = false">
    <button
      type="button"
      class="mark"
      :aria-label="label"
      :aria-describedby="open ? id : undefined"
      :aria-expanded="open"
      @click="open = true"
      @focus="open = true"
      @blur="open = false"
      @keydown.escape="escape"
    >
      ?
    </button>
    <span v-if="open" :id="id" role="tooltip" class="tip" :class="{ centered }"><slot /></span>
  </span>
</template>

<style scoped>
.help {
  position: relative;
  display: inline-flex;
}
.mark {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1.5px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}
.mark:hover,
.mark[aria-expanded="true"] {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.tip {
  position: absolute;
  top: calc(100% + 8px);
  left: -8px;
  z-index: 20;
  width: max-content;
  max-width: min(290px, 70vw);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-tip);
  color: #f3f4f9;
  font-size: var(--text-xs);
  font-weight: 400;
  line-height: 1.45;
}
.tip.centered {
  left: 50%;
  translate: -50% 0;
}
</style>
