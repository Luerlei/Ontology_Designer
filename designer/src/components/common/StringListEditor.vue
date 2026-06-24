<script setup lang="ts">
const model = defineModel<string[]>({ default: () => [] })
defineProps<{ placeholder?: string }>()

function add() {
  model.value = [...model.value, '']
}
function update(i: number, val: string) {
  const next = [...model.value]
  next[i] = val
  model.value = next
}
function remove(i: number) {
  model.value = model.value.filter((_, idx) => idx !== i)
}
</script>

<template>
  <div class="string-list">
    <div v-for="(item, i) in model" :key="i" class="row">
      <input
        :value="item"
        :placeholder="placeholder"
        @input="update(i, ($event.target as HTMLInputElement).value)"
      />
      <button class="icon-btn" title="删除" @click="remove(i)">×</button>
    </div>
    <button class="add-btn" @click="add">+ 添加</button>
  </div>
</template>

<style scoped>
.string-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: flex;
  gap: 6px;
}
.row input {
  flex: 1;
}
</style>
