<script setup lang="ts">
/** Line icons, each drawn as the paths of a 24×24 outline. */
const paths = {
  box: ["M3 7l9-4 9 4-9 4z", "M3 7v10l9 4 9-4V7", "M12 11v10"],
  upload: ["M12 16V4", "m7 9 5-5 5 5", "M5 20h14"],
  download: ["M12 4v12", "m7 11 5 5 5-5", "M5 20h14"],
  trash: ["M4 7h16", "M10 11v6M14 11v6", "M6 7l1 13h10l1-13", "M9 7V4h6v3"],
  close: ["M6 6l12 12M18 6 6 18"],
  more: ["M5 12h.01M12 12h.01M19 12h.01"],
  file: ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5"],
  text: ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5", "M8 13h8M8 17h5"],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M7 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    "m21 15-5-5L5 21",
  ],
  search: ["M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0", "m20 20-3.5-3.5"],
  describe: ["M4 6h16M4 12h16M4 18h10"],
  tag: ["M3 12V4h8l10 10-8 8z", "M7.5 8.5h.01"],
} as const;

export type IconName = keyof typeof paths;

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 18 });
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="name === 'more' ? 3.5 : 1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="d in paths[name]" :key="d" :d="d" />
  </svg>
</template>
