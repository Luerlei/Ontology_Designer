<script setup lang="ts">
import type { Attribute } from '../../metamodel/types'
import { ATTRIBUTE_TYPES } from '../../metamodel/naming'

const model = defineModel<Attribute[]>({ default: () => [] })

function add() {
  model.value = [...model.value, { name: '', type: 'string', required: false, description: '' }]
}
function patch(i: number, patch: Partial<Attribute>) {
  const next = model.value.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
  model.value = next
}
function remove(i: number) {
  model.value = model.value.filter((_, idx) => idx !== i)
}
</script>

<template>
  <div class="attr-editor">
    <table v-if="model.length">
      <thead>
        <tr>
          <th>属性名</th>
          <th>类型</th>
          <th>必填</th>
          <th>说明</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(attr, i) in model" :key="i">
          <td>
            <input
              :value="attr.name"
              placeholder="name"
              @input="patch(i, { name: ($event.target as HTMLInputElement).value })"
            />
          </td>
          <td>
            <select
              :value="attr.type"
              @change="patch(i, { type: ($event.target as HTMLSelectElement).value as Attribute['type'] })"
            >
              <option v-for="t in ATTRIBUTE_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </td>
          <td class="center">
            <input
              type="checkbox"
              :checked="attr.required"
              @change="patch(i, { required: ($event.target as HTMLInputElement).checked })"
            />
          </td>
          <td>
            <input
              :value="attr.description"
              placeholder="说明"
              @input="patch(i, { description: ($event.target as HTMLInputElement).value })"
            />
          </td>
          <td class="center">
            <button class="icon-btn" title="删除" @click="remove(i)">×</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="add-btn" @click="add">+ 添加属性</button>
  </div>
</template>

<style scoped>
.attr-editor table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.attr-editor th {
  text-align: left;
  color: #64748b;
  font-weight: 500;
  padding: 4px 6px;
}
.attr-editor td {
  padding: 2px 6px;
}
.attr-editor td input[type='text'],
.attr-editor td input:not([type]),
.attr-editor td select {
  width: 100%;
}
.center {
  text-align: center;
}
</style>
