<script setup lang="ts">
import { computed, ref } from "vue";
import { useSession } from "./session.ts";
import Icon, { type IconName } from "./ui/Icon.vue";

/** The app's logo icon, and a line under the title on the sign-in form. */
defineProps<{ icon: IconName; lead?: string }>();
const { register, signIn, error } = useSession();
const creating = ref(false);
const username = ref("");
const password = ref("");
const working = ref(false);
const words = computed(() =>
  creating.value
    ? { title: "Create an account", action: "Create account", other: "Have an account?", switchTo: "Sign in" }
    : { title: "Sign in", action: "Sign in", other: "New here?", switchTo: "Create an account" },
);

async function submit() {
  working.value = true;
  await (creating.value ? register : signIn)(username.value.trim(), password.value);
  working.value = false;
}

function switchMode() {
  creating.value = !creating.value;
  error.value = null;
}
</script>

<template>
  <form class="card sign-in" @submit.prevent="submit">
    <span class="logo"><Icon :name="icon" :size="24" /></span>
    <div>
      <h1>{{ words.title }}</h1>
      <p v-if="!creating && lead" class="lead">{{ lead }}</p>
    </div>
    <label class="field">
      Username
      <!-- Browsers compile `pattern` with the v flag, which needs the hyphen escaped. -->
      <input
        v-model="username"
        autocomplete="username"
        autocapitalize="off"
        spellcheck="false"
        required
        :pattern="creating ? '[A-Za-z0-9_\\-]{3,32}' : undefined"
      />
      <span v-if="creating" class="hint">3 to 32 letters, digits, _ or -</span>
    </label>
    <label class="field">
      Password
      <input
        v-model="password"
        type="password"
        :autocomplete="creating ? 'new-password' : 'current-password'"
        required
        :minlength="creating ? 8 : undefined"
      />
      <span v-if="creating" class="hint">8 to 128 characters</span>
    </label>
    <p v-if="error" class="refusal" role="alert">{{ error }}</p>
    <button type="submit" class="button primary submit" :disabled="working">{{ words.action }}</button>
    <p class="switch">
      {{ words.other }} <button type="button" class="text-button" @click="switchMode">{{ words.switchTo }}</button>
    </p>
  </form>
</template>

<style scoped>
.sign-in {
  width: 100%;
  max-width: 400px;
  margin: var(--space-12) auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 36px 32px;
  border-radius: var(--radius-xl);
}
.logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: #ffffff;
}
h1 {
  font-size: var(--text-2xl);
}
.lead {
  margin-top: 6px;
  color: var(--color-text-muted);
}
.submit {
  min-height: 46px;
  border-radius: var(--radius-md);
  font-weight: 700;
}
.switch {
  text-align: center;
  color: var(--color-text-muted);
}
</style>
