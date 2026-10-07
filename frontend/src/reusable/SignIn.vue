<script setup lang="ts">
import { useSession } from "./session.ts";
import Icon, { type IconName } from "./ui/Icon.vue";

/** The app's logo icon and a line under the title. Put the ways of signing in the app offers inside, such as `CommonsButton` and `PasswordForm`. */
defineProps<{ icon: IconName; lead?: string }>();
const { error } = useSession();
</script>

<template>
  <section class="card form-card">
    <span class="logo"><Icon :name="icon" :size="24" /></span>
    <div>
      <h1>Sign in</h1>
      <p v-if="lead" class="lead">{{ lead }}</p>
    </div>
    <p v-if="error" class="refusal" role="alert">{{ error }}</p>
    <slot />
  </section>
</template>

<style scoped>
.logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: #ffffff;
}
.lead {
  margin-top: 6px;
  color: var(--color-text-muted);
}
</style>
