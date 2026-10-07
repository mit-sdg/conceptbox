<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { api } from "../api/client.ts";
import Icon from "../reusable/ui/Icon.vue";
import { formatSize } from "./format.ts";
import { useBox } from "./useBox.ts";

// I drop files here or choose them from my computer. Each upload shows a progress bar until `/files/finish` returns.

/** A file I'm uploading: how many of its bytes have been sent, or the sentence for why the upload failed. */
interface Upload {
  id: number;
  name: string;
  size: number;
  sent: number;
  error: string | null;
}

/** Files over 25 MB are refused by `Storing.finish` after the upload; checking here first saves sending the bytes. */
const MAX_BYTES = 25_000_000;

const { box, call, refresh } = useBox();
const empty = computed(() => box.value?.myFiles.length === 0);
const uploads = ref<Upload[]>([]);
const picker = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
let nextUpload = 0;

async function upload(file: File) {
  const progress = reactive<Upload>({ id: nextUpload++, name: file.name, size: file.size, sent: 0, error: null });
  uploads.value.push(progress);
  if (file.size > MAX_BYTES) {
    progress.error = "A file can be at most 25 MB.";
    return;
  }
  const started = await call("/files/start", api.files.start({ name: file.name, mediaType: file.type || "application/octet-stream" }));
  if ("error" in started) {
    progress.error = started.error;
    return;
  }
  if (!(await sendBytes(started.uploadUrl, file, (sent) => (progress.sent = sent)))) {
    progress.error = "The upload didn't go through. Try again.";
    return;
  }
  const finished = await call("/files/finish", api.files.finish({ file: started.file }));
  if ("error" in finished) {
    progress.error = finished.error;
    return;
  }
  await refresh();
  dismiss(progress.id);
}

/**
 * Sends the file's bytes to the upload URL with a PUT, calling `onProgress` with the count sent so far.
 * Returns whether the bucket returned a 2xx status. XMLHttpRequest is used because fetch has no upload progress events.
 */
function sendBytes(url: string, file: File, onProgress: (sent: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.upload.onprogress = (event) => onProgress(event.loaded);
    request.onload = () => resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.send(file);
  });
}

function dismiss(id: number) {
  uploads.value = uploads.value.filter((upload) => upload.id !== id);
}

function uploadAll(files: FileList | null | undefined) {
  for (const file of files ?? []) upload(file);
}

function dropped(event: DragEvent) {
  dragging.value = false;
  uploadAll(event.dataTransfer?.files);
}

function picked() {
  uploadAll(picker.value?.files);
  if (picker.value) picker.value.value = "";
}
</script>

<template>
  <section
    class="zone"
    :class="{ empty, dragging }"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="dropped"
  >
    <span class="mark"><Icon name="upload" :size="empty ? 30 : 26" /></span>
    <div class="words">
      <h1 v-if="empty">Drop files here</h1>
      <p v-else class="lead">Drop files here</p>
      <p v-if="!empty" class="choose">or <button type="button" class="text-button" @click="picker?.click()">choose files</button></p>
    </div>
    <button type="button" class="button primary pick" :class="{ always: empty }" @click="picker?.click()">
      Choose files
    </button>
    <input ref="picker" type="file" multiple hidden @change="picked" />

    <ul v-if="uploads.length" class="uploads">
      <li v-for="item in uploads" :key="item.id">
        <div class="line">
          <strong>{{ item.name }}</strong>
          <span v-if="item.error" class="refusal" role="alert">{{ item.error }}</span>
          <span v-else class="muted">{{ formatSize(item.sent) }} of {{ formatSize(item.size) }}</span>
          <button v-if="item.error" type="button" class="icon-button" :aria-label="`Dismiss ${item.name}`" @click="dismiss(item.id)">
            <Icon name="close" :size="16" />
          </button>
        </div>
        <progress v-if="!item.error" :value="item.sent" :max="item.size" :aria-label="`Uploading ${item.name}`" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.zone {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-6) 28px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}
.zone.dragging {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}
.zone.empty {
  flex-direction: column;
  padding: var(--space-12) 28px;
  text-align: center;
}
.mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-accent-soft);
  color: var(--color-accent);
}
.empty .mark {
  width: 64px;
  height: 64px;
}
.words {
  flex: 1 1 200px;
}
.empty .words {
  flex: none;
}
.empty h1 {
  font-size: 24px;
}
.lead {
  font-size: var(--text-lg);
  font-weight: 700;
}
.choose {
  color: var(--color-text-muted);
}
.pick:not(.always) {
  display: none;
}
.uploads {
  flex: 1 1 300px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  text-align: left;
}
.empty .uploads {
  flex: none;
  width: min(420px, 100%);
}
.uploads li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--color-page);
}
.line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}
.line strong {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line .icon-button {
  width: 28px;
  height: 28px;
}
progress {
  width: 100%;
  height: 6px;
  accent-color: var(--color-accent);
}

/* Files can't be dragged on a phone, so the zone becomes one button. */
@media (max-width: 600px) {
  .zone,
  .zone.empty {
    padding: 0;
    border: 0;
    background: none;
  }
  .mark,
  .words {
    display: none;
  }
  .pick,
  .pick:not(.always) {
    display: inline-flex;
    flex: 1 1 100%;
    min-height: 52px;
    border-radius: var(--radius-lg);
  }
}
</style>
