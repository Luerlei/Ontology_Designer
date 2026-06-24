<script setup lang="ts">
import type { EventModel } from '../../metamodel/types'
import { DELIVERY_SEMANTICS } from '../../metamodel/naming'
import AttributeListEditor from '../common/AttributeListEditor.vue'

defineProps<{ model: EventModel }>()
</script>

<template>
  <div class="editor">
    <div class="grid2">
      <label class="field"><span>id</span><input v-model="model.id" /></label>
      <label class="field"><span>名称</span><input v-model="model.name" /></label>
      <label class="field">
        <span>顺序语义</span>
        <select v-model="model.deliverySemantics">
          <option v-for="s in DELIVERY_SEMANTICS" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label class="field"><span>描述</span><input v-model="model.description" /></label>
    </div>

    <section>
      <h4>事件载荷 <small>（payload）</small></h4>
      <AttributeListEditor v-model="model.payload" />
    </section>
  </div>
</template>

<style scoped>
@import './editor.css';
</style>
