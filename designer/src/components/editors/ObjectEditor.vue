<script setup lang="ts">
import { computed } from 'vue'
import type { ObjectModel } from '../../metamodel/types'
import { useProjectStore } from '../../stores/project'
import AttributeListEditor from '../common/AttributeListEditor.vue'

const props = defineProps<{ model: ObjectModel }>()
const store = useProjectStore()

const otherObjects = computed(() =>
  store.project.objects.filter((o) => o.id !== props.model.id),
)

function addEntity() {
  props.model.entities.push({ id: 'NewEntity', name: '子实体', identity: 'id', attributes: [] })
}
function removeEntity(i: number) {
  props.model.entities.splice(i, 1)
}
function addVo() {
  props.model.valueObjects.push({ id: 'NewVo', name: '值对象', attributes: [] })
}
function removeVo(i: number) {
  props.model.valueObjects.splice(i, 1)
}
function addInv() {
  props.model.invariants.push({ id: 'inv_new', expression: '', description: '' })
}
function removeInv(i: number) {
  props.model.invariants.splice(i, 1)
}
function addRef() {
  props.model.references.push({ targetObjectId: '', refField: '', description: '' })
}
function removeRef(i: number) {
  props.model.references.splice(i, 1)
}
</script>

<template>
  <div class="editor">
    <div class="grid2">
      <label class="field"><span>id</span><input v-model="model.id" /></label>
      <label class="field"><span>名称</span><input v-model="model.name" /></label>
      <label class="field"><span>唯一标识字段</span><input v-model="model.identity" /></label>
      <label class="field"><span>描述</span><input v-model="model.description" /></label>
    </div>

    <section>
      <h4>属性</h4>
      <AttributeListEditor v-model="model.attributes" />
    </section>

    <section>
      <h4>子实体 <small>（聚合内、依赖聚合根）</small></h4>
      <div v-for="(ent, i) in model.entities" :key="i" class="sub-card">
        <div class="grid3">
          <label class="field"><span>id</span><input v-model="ent.id" /></label>
          <label class="field"><span>名称</span><input v-model="ent.name" /></label>
          <label class="field"><span>标识字段</span><input v-model="ent.identity" /></label>
        </div>
        <AttributeListEditor v-model="ent.attributes" />
        <button class="del-row" @click="removeEntity(i)">删除子实体</button>
      </div>
      <button class="add-btn" @click="addEntity">+ 添加子实体</button>
    </section>

    <section>
      <h4>值对象 <small>（无标识、不可变）</small></h4>
      <div v-for="(vo, i) in model.valueObjects" :key="i" class="sub-card">
        <div class="grid2">
          <label class="field"><span>id</span><input v-model="vo.id" /></label>
          <label class="field"><span>名称</span><input v-model="vo.name" /></label>
        </div>
        <AttributeListEditor v-model="vo.attributes" />
        <button class="del-row" @click="removeVo(i)">删除值对象</button>
      </div>
      <button class="add-btn" @click="addVo">+ 添加值对象</button>
    </section>

    <section>
      <h4>不变性约束</h4>
      <div v-for="(inv, i) in model.invariants" :key="i" class="inline-row">
        <input v-model="inv.id" class="w-sm" placeholder="id" />
        <input v-model="inv.expression" class="w-lg" placeholder="约束表达式" />
        <input v-model="inv.description" class="w-md" placeholder="说明" />
        <button class="icon-btn" @click="removeInv(i)">×</button>
      </div>
      <button class="add-btn" @click="addInv">+ 添加约束</button>
    </section>

    <section>
      <h4>对外引用 <small>（ID 引用其他聚合）</small></h4>
      <div v-for="(ref, i) in model.references" :key="i" class="inline-row">
        <select v-model="ref.targetObjectId" class="w-md">
          <option value="">选择聚合…</option>
          <option v-for="o in otherObjects" :key="o.id" :value="o.id">{{ o.id }}</option>
        </select>
        <input v-model="ref.refField" class="w-md" placeholder="引用字段，如 customerId" />
        <input v-model="ref.description" class="w-md" placeholder="说明" />
        <button class="icon-btn" @click="removeRef(i)">×</button>
      </div>
      <button class="add-btn" @click="addRef">+ 添加引用</button>
    </section>
  </div>
</template>

<style scoped>
@import './editor.css';
</style>
