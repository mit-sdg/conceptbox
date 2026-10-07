<script setup lang="ts">
import { api } from "../api/client.ts";
import HelpTip from "../reusable/ui/HelpTip.vue";
import { useBox } from "./useBox.ts";

const { box, working, change } = useBox();
</script>

<template>
  <div class="describing">
    <button
      type="button"
      role="switch"
      class="switch"
      :aria-checked="box?.describing.on"
      :disabled="working"
      @click="box?.describing.on ? change('/describing/off', api.describing.off()) : change('/describing/on', api.describing.on())"
    >
      Describe uploads
      <span class="track"><span class="knob" /></span>
    </button>
    <HelpTip label="About describing uploads" centered>
      ConceptBox sends each new upload to a language model, which describes and labels it.
    </HelpTip>
  </div>
</template>

<style scoped>
.describing {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}
.switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
}
.track {
  position: relative;
  width: 40px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-border);
  transition: background 0.15s;
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(30, 31, 43, 0.2);
  transition: left 0.15s;
}
.switch[aria-checked="true"] .track {
  background: var(--color-accent);
}
.switch[aria-checked="true"] .knob {
  left: 19px;
}
</style>
