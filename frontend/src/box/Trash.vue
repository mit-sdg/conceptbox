<script setup lang="ts">
import { ref } from "vue";
import { api } from "../api/client.ts";
import HelpTip from "../reusable/ui/HelpTip.vue";
import Icon from "../reusable/ui/Icon.vue";
import { formatDate, formatSize } from "./format.ts";
import { useBox, type TrashedFile } from "./useBox.ts";

defineProps<{ files: TrashedFile[] }>();
const { working, change } = useBox();
const open = ref(false);
const confirming = ref<string | null>(null);
</script>

<template>
  <section v-if="files.length" class="trash">
    <div class="heading">
      <button type="button" class="toggle" :aria-expanded="open" @click="open = !open">
        <Icon name="trash" />Trash ({{ files.length }})
      </button>
      <HelpTip label="About the trash">
        People you shared these files with can't see them. Restore a file, and they can see it again.
      </HelpTip>
    </div>
    <div v-if="open" class="tiles">
      <article v-for="row in files" :key="row.file" class="card tile">
        <div class="about">
          <span class="mark"><Icon name="file" :size="22" /></span>
          <div>
            <p class="name">{{ row.name }}</p>
            <p class="muted">{{ formatSize(row.size) }}, trashed {{ formatDate(row.trashedAt) }}</p>
          </div>
        </div>
        <div v-if="confirming === row.file" class="confirm" role="alert">
          <p><strong>Delete {{ row.name }}?</strong> You can't undo this.</p>
          <div class="choices">
            <button type="button" class="button outline" @click="confirming = null">Cancel</button>
            <button type="button" class="button danger" :disabled="working" @click="change('/files/purge', api.files.purge({ file: row.file }))">Delete</button>
          </div>
        </div>
        <div v-else class="choices">
          <button type="button" class="button soft" :disabled="working" @click="change('/files/restore', api.files.restore({ file: row.file }))">Restore</button>
          <button type="button" class="button outline" @click="confirming = row.file">Delete</button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.trash {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text-muted);
}
.toggle:hover,
.toggle[aria-expanded="true"] {
  color: var(--color-text);
}
.tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}
.about {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.about > div {
  min-width: 0;
}
.mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-line);
  color: var(--color-text-muted);
}
.name {
  font-weight: 700;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
.confirm {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-danger-soft);
  font-size: var(--text-sm);
}
.choices {
  display: flex;
  gap: var(--space-2);
}
.choices .button {
  flex: 1;
}
</style>
