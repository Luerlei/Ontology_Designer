<script setup lang="ts">
import { computed } from 'vue'
import type { BehaviorModel } from '../../metamodel/types'
import { useProjectStore } from '../../stores/project'
import StringListEditor from '../common/StringListEditor.vue'
import RefMultiSelect from '../common/RefMultiSelect.vue'

defineProps<{ model: BehaviorModel }>()
const store = useProjectStore()

const ruleOptions = computed(() =>
  store.project.rules.map((r) => ({ value: r.id, label: `${r.id} · ${r.name}` })),
)
const eventOptions = computed(() =>
  store.project.events.map((e) => ({ value: e.id, label: `${e.id} · ${e.name}` })),
)
</script>

<template>
  <div class="editor">
    <div class="grid2">
      <label class="field"><span>id</span><input v-model="model.id" /></label>
      <label class="field"><span>名称</span><input v-model="model.name" /></label>
      <label class="field">
        <span>所属聚合根</span>
        <select v-model="model.objectRef">
          <option value="">选择聚合…</option>
          <option v-for="o in store.project.objects" :key="o.id" :value="o.id">{{ o.id }}</option>
        </select>
      </label>
      <label class="field"><span>描述</span><input v-model="model.description" /></label>
    </div>

    <section>
      <h4>前置条件</h4>
      <StringListEditor v-model="model.preconditions" placeholder="例如：订单状态为待支付" />
    </section>
    <section>
      <h4>后置条件</h4>
      <StringListEditor v-model="model.postconditions" placeholder="例如：订单状态置为已支付" />
    </section>

    <section>
      <h4>应用的规则</h4>
      <RefMultiSelect v-model="model.appliedRuleRefs" :options="ruleOptions" empty-hint="尚未定义规则" />
    </section>
    <section>
      <h4>产生的事件 <small>（行为完成后发布）</small></h4>
      <RefMultiSelect v-model="model.producedEventRefs" :options="eventOptions" empty-hint="尚未定义事件" />
    </section>
    <section>
      <h4>订阅的事件 <small>（监听并触发本行为）</small></h4>
      <RefMultiSelect v-model="model.subscribedEventRefs" :options="eventOptions" empty-hint="尚未定义事件" />
    </section>
  </div>
</template>

<style scoped>
@import './editor.css';
</style>
