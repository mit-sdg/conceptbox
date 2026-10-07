<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api } from "../api/client.ts";
import { useSession } from "../reusable/session.ts";
import Avatar from "../reusable/ui/Avatar.vue";
import Dialog from "../reusable/ui/Dialog.vue";
import HelpTip from "../reusable/ui/HelpTip.vue";
import { useBox, type MyFile, type Person, type UserId } from "./useBox.ts";

const props = defineProps<{ row: MyFile }>();
defineEmits<{ close: [] }>();
const { me } = useSession();
const { error, call, refresh } = useBox();
const people = ref<Person[]>([]);
const username = ref("");
const refusal = ref<string | null>(null);
const working = ref(false);

onMounted(async () => {
  const result = await call("/people", api.people());
  if ("error" in result) error.value = result.error;
  else people.value = result.people;
});

/** People I share files with or who share files with me, who don't have this file yet and whose names start with what I typed. */
const suggestions = computed(() => {
  const typed = username.value.trim().toLowerCase();
  const hasIt = new Set(props.row.sharedWith.map((person) => person.recipient));
  return people.value
    .filter((person) => !hasIt.has(person.person) && person.username.toLowerCase().startsWith(typed))
    .slice(0, 5);
});

async function add(name: string) {
  if (!name.trim()) return;
  working.value = true;
  const result = await call("/files/share", api.files.share({ file: props.row.file, username: name.trim() }));
  if ("error" in result) {
    refusal.value = result.error;
  } else {
    refusal.value = null;
    username.value = "";
    await refresh();
  }
  working.value = false;
}

async function remove(recipient: UserId) {
  working.value = true;
  const result = await call("/files/revoke", api.files.revoke({ file: props.row.file, recipient }));
  if ("error" in result) {
    refusal.value = result.error;
  } else {
    refusal.value = null;
    await refresh();
  }
  working.value = false;
}
</script>

<template>
  <Dialog :title="`Share ${row.name}`" @close="$emit('close')">
    <form class="add" @submit.prevent="add(username)">
      <div class="label">
        <label for="share-username">Add people</label>
        <HelpTip label="About adding people">
          Suggestions come from files you've shared and files shared with you. For anyone else, type their exact username.
        </HelpTip>
      </div>
      <div class="entry" :class="{ wrong: refusal }">
        <input
          id="share-username"
          v-model="username"
          placeholder="Username"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          autofocus
          :aria-invalid="refusal !== null"
          aria-describedby="share-refusal"
          @input="refusal = null"
        />
        <button type="submit" class="button primary" :disabled="working">Add</button>
      </div>
      <p v-if="refusal" id="share-refusal" class="refusal" role="alert">{{ refusal }}</p>
      <ul v-if="suggestions.length" class="suggestions" aria-label="Suggestions">
        <li v-for="person in suggestions" :key="person.person">
          <button type="button" :disabled="working" @click="add(person.username)">
            <Avatar :username="person.username" :size="32" />
            <strong>{{ person.username }}</strong>
            <span class="add-label">Add</span>
          </button>
        </li>
      </ul>
    </form>

    <section class="access">
      <h3>Shared with</h3>
      <ul>
        <li>
          <Avatar :username="me?.username ?? ''" :size="32" />
          <strong>{{ me?.username }} <span class="muted">(you)</span></strong>
          <span class="muted">Owner</span>
        </li>
        <li v-for="person in row.sharedWith" :key="person.recipient">
          <Avatar :username="person.username" :size="32" />
          <strong>{{ person.username }}</strong>
          <button type="button" class="button outline" :disabled="working" @click="remove(person.recipient)">Remove</button>
        </li>
      </ul>
    </section>
  </Dialog>
</template>

<style scoped>
.add {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm);
  font-weight: 600;
}
.entry {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 50px;
  padding: 0 6px 0 14px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
}
.entry:focus-within {
  border-color: var(--color-accent);
}
.entry.wrong {
  border-color: var(--color-danger);
}
.entry input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 16px;
}
ul {
  list-style: none;
  padding: 0;
}
.suggestions button {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 48px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
}
.suggestions button:hover {
  background: var(--color-page);
}
.suggestions strong,
.access strong {
  flex: 1;
  font-weight: 600;
}
.add-label {
  color: var(--color-accent);
  font-weight: 600;
}
h3 {
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}
.access li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 48px;
}
.access .button {
  min-height: 34px;
  padding: 0 12px;
  font-weight: 400;
}
</style>
