<script setup lang="ts">
import { computed, ref } from "vue";
import { api } from "../api/client.ts";
import Avatar from "../reusable/ui/Avatar.vue";
import Icon from "../reusable/ui/Icon.vue";
import Menu from "../reusable/ui/Menu.vue";
import Description from "./Description.vue";
import FileThumb from "./FileThumb.vue";
import { formatDate, formatSize, isViewable } from "./format.ts";
import ImagePreview from "./ImagePreview.vue";
import LabelChips from "./LabelChips.vue";
import ShareDialog from "./ShareDialog.vue";
import { useBox, type MyFile } from "./useBox.ts";

const props = defineProps<{ row: MyFile }>();
const { box, working, change, download } = useBox();
const open = ref<"preview" | "share" | null>(null);
const details = computed(() => `${formatSize(props.row.size)}, ${formatDate(props.row.uploadedAt)}`);
const loseAccess = computed(() => {
  const names = props.row.sharedWith.map((person) => person.username);
  const list = new Intl.ListFormat("en", { type: "conjunction" }).format(names);
  return `${list} ${names.length === 1 ? "loses" : "lose"} access`;
});

function openFile() {
  if (isViewable(props.row.mediaType)) open.value = "preview";
  else download(props.row.file);
}
</script>

<template>
  <article class="card tile">
    <button type="button" class="thumb-button" :aria-label="`Open ${row.name}`" @click="openFile">
      <FileThumb :file="row.file" :media-type="row.mediaType" />
    </button>
    <div class="about">
      <button type="button" class="name" @click="openFile">{{ row.name }}</button>
      <span class="muted">{{ details }}</span>
      <Description :row="row" />
      <LabelChips :row="row" />
    </div>
    <footer>
      <div class="people">
        <Avatar v-for="person in row.sharedWith" :key="person.recipient" :username="person.username" />
        <span v-if="row.sharedWith.length === 0" class="muted">Only you</span>
      </div>
      <button type="button" class="button soft" @click="open = 'share'">Share</button>
      <Menu :label="`More actions for ${row.name}`">
        <button type="button" @click="download(row.file)"><Icon name="download" />Download</button>
        <template v-if="box?.describing.on">
          <button type="button" :disabled="working" @click="change('/files/describe', api.files.describe({ file: row.file }))"><Icon name="describe" />Describe again</button>
          <button type="button" :disabled="working" @click="change('/files/relabel', api.files.relabel({ file: row.file }))"><Icon name="tag" />Suggest new labels</button>
        </template>
        <button type="button" :disabled="working" @click="change('/files/trash', api.files.trash({ file: row.file }))">
          <Icon name="trash" />
          <span>
            Move to trash
            <span v-if="row.sharedWith.length" class="detail">{{ loseAccess }}</span>
          </span>
        </button>
      </Menu>
    </footer>

    <ImagePreview v-if="open === 'preview'" :file="row.file" :name="row.name" :details="details" @close="open = null" />
    <ShareDialog v-if="open === 'share'" :row="row" @close="open = null" />
  </article>
</template>

<style scoped>
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
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
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
footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 12px 12px 16px;
  border-top: 1px solid var(--color-line);
}
.people {
  flex: 1;
  display: flex;
}
.people > * + * {
  margin-left: -6px;
}
.people :deep(.avatar) {
  border: 2px solid var(--color-surface);
}
</style>
