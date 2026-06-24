<script setup lang="ts">
import { computed } from 'vue'
import type { RuleModel } from '../../metamodel/types'
import { RULE_TYPES } from '../../metamodel/naming'
import { useProjectStore } from '../../stores/project'
import RefMultiSelect from '../common/RefMultiSelect.vue'

const props = defineProps<{ model: RuleModel }>()
const store = useProjectStore()

const eventOptions = computed(() =>
  store.project.events.map((e) => ({ value: e.id, label: `${e.id} · ${e.name}` })),
)
const isEventDriven = computed(() => props.model.type === 'event-driven')
</script>

<template>
  <div class="editor">
    <div class="grid2">
      <label class="field"><span>id</span><input v-model="model.id" /></label>
      <label class="field"><span>名称</span><input v-model="model.name" /></label>
      <label class="field">
        <span>规则类型</span>
        <select v-model="model.type">
          <option v-for="t in RULE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </label>
      <label class="field"><span>描述</span><input v-model="model.description" /></label>
    </div>

    <section>
      <h4>条件判断</h4>
      <textarea v-model="model.condition" rows="2" placeholder="例如：产品类型为实物 且 存在空闲配送员" />
    </section>

    <section v-if="isEventDriven">
      <h4>订阅的事件 <small>（触发本规则）</small></h4>
      <RefMultiSelect v-model="model.subscribedEventRefs" :options="eventOptions" empty-hint="尚未定义事件" />
    </section>
    <section v-if="isEventDriven">
      <h4>触发的事件 <small>（满足条件时发布）</small></h4>
      <RefMultiSelect v-model="model.triggeredEventRefs" :options="eventOptions" empty-hint="尚未定义事件" />
    </section>
    <p v-else class="hint">
      非事件驱动规则不参与事件链；改为「事件驱动规则」可订阅/触发事件，成为智能决策节点。
    </p>
  </div>
</template>

<style scoped>
@import './editor.css';
textarea {
  width: 100%;
  resize: vertical;
  font-family: inherit;
}
.hint {
  color: #94a3b8;
  font-size: 13px;
}
</style>
