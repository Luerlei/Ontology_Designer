<script setup lang="ts">
import { computed } from 'vue'
import type { PolicyModel } from '../../metamodel/types'
import { useProjectStore } from '../../stores/project'
import RefMultiSelect from '../common/RefMultiSelect.vue'

defineProps<{ model: PolicyModel }>()
const store = useProjectStore()

const eventOptions = computed(() =>
  store.project.events.map((e) => ({ value: e.id, label: `${e.id} · ${e.name}` })),
)
</script>

<template>
  <div class="editor">
    <div class="grid2">
      <label class="field"><span>id</span><input v-model="model.id" /></label>
      <label class="field"><span>名称</span><input v-model="model.name" /></label>
      <label class="field"><span>描述</span><input v-model="model.description" /></label>
      <div></div>
    </div>

    <section>
      <h4>条件判断</h4>
      <textarea v-model="model.condition" rows="2" placeholder="例如：产品类型为实物 且 存在空闲配送员" />
    </section>

    <section>
      <h4>订阅的事件 <small>（触发本策略）</small></h4>
      <RefMultiSelect
        v-model="model.subscribedEventRefs"
        :options="eventOptions"
        empty-hint="尚未定义事件"
      />
    </section>

    <section>
      <h4>触发的事件 <small>（满足条件时发布）</small></h4>
      <RefMultiSelect
        v-model="model.triggeredEventRefs"
        :options="eventOptions"
        empty-hint="尚未定义事件"
      />
    </section>
  </div>
</template>

<style scoped>
@import './editor.css';
textarea {
  width: 100%;
  resize: vertical;
  font-family: inherit;
}
</style>
