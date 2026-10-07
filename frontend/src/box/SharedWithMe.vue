<script setup lang="ts">
import { ref } from "vue";
import { useSession } from "../reusable/session.ts";
import Avatar from "../reusable/ui/Avatar.vue";
import FileThumb from "./FileThumb.vue";
import { formatDate, formatSize, isViewable } from "./format.ts";
import ImagePreview from "./ImagePreview.vue";
import { useBox, type SharedFile } from "./useBox.ts";

defineProps<{ files: SharedFile[] }>();
const { me } = useSession();
const { download } = useBox();
const opened = ref<string | null>(null);

function openFile(row: SharedFile) {
  if (isViewable(row.mediaType)) opened.value = row.file;
  else download(row.file);
}
</script>

<template>
  <section class="shared">
    <h2>Shared with me</h2>
    <p v-if="files.length === 0" class="card empty">
      Nothing shared with you yet. Your username is <strong>{{ me?.username }}</strong>.
    </p>
    <div v-else class="tiles">
      <article v-for="row in files" :key="row.file" class="card tile">
        <button type="button" class="thumb-button" :aria-label="`Open ${row.name}`" @click="openFile(row)">
          <FileThumb :file="row.file" :media-type="row.mediaType" />
        </button>
        <div class="about">
          <Avatar :username="row.ownerName" :size="36" />
          <div>
            <button type="button" class="name" @click="openFile(row)">{{ row.name }}</button>
            <p class="muted">From {{ row.ownerName }}, {{ formatSize(row.size) }}</p>
          </div>
        </div>
        <ImagePreview
          v-if="opened === row.file"
          :file="row.file"
          :name="row.name"
          :details="`From ${row.ownerName}, ${formatSize(row.size)}, ${formatDate(row.uploadedAt)}`"
          @close="opened = null"
        />
      </article>
    </div>
  </section>
</template>

<style scoped>
.shared {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.empty {
  padding: var(--space-5) var(--space-6);
  color: var(--color-text-muted);
}
.empty strong {
  color: var(--color-text);
}
.tile {
  display: flex;
  flex-direction: column;
}
.thumb-button {
  padding: 0;
  border: 0;
  background: none;
}
.about {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 14px 16px;
}
.about > div {
  min-width: 0;
}
.name {
  padding: 0;
  border: 0;
  background: none;
  font-weight: 700;
  text-align: left;
  overflow-wrap: anywhere;
}
.name:hover {
  color: var(--color-accent);
}
</style>
