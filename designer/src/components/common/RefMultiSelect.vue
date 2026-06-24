<script setup lang="ts">
const model = defineModel<string[]>({ default: () => [] })
const props = defineProps<{
  options: { value: string; label: string }[]
  emptyHint?: string
}>()

function toggle(value: string, checked: boolean) {
  if (checked) {
    if (!model.value.includes(value)) model.value = [...model.value, value]
  } else {
    model.value = model.value.filter((v) => v !== value)
  }
}
</script>

<template>
  <div class="ref-select">
    <p v-if="!props.options.length" class="hint">{{ emptyHint ?? '暂无可选项' }}</p>
    <label v-for="opt in props.options" :key="opt.value" class="chk">
      <input
        type="checkbox"
        :checked="model.includes(opt.value)"
        @change="toggle(opt.value, ($event.target as HTMLInputElement).checked)"
      />
      <span>{{ opt.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.ref-select {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}
.chk {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  cursor: pointer;
}
.hint {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}
</style>
