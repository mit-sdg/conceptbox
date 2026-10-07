<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ username: string; size?: number }>(), { size: 28 });

/** Pairs of background and text colors; a username always maps to the same pair. */
const colors = [
  ["#e1e9fb", "#1d3f8f"],
  ["#f7e3d2", "#7a3a0e"],
  ["#e3f1e6", "#2b6a43"],
  ["#f6e6f3", "#7d2c6c"],
  ["#e3e1fb", "#312a99"],
  ["#fbf0cf", "#6b4e07"],
];

const style = computed(() => {
  const sum = [...props.username].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  const [background, color] = colors[sum % colors.length]!;
  return { background, color, width: `${props.size}px`, height: `${props.size}px`, fontSize: `${props.size * 0.43}px` };
});
</script>

<template>
  <span class="avatar" :style="style" :title="username">{{ username[0]?.toUpperCase() }}</span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  font-weight: 700;
  line-height: 1;
}
</style>
