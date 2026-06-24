<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useProjectStore } from '../../stores/project'
import { buildAggregateGraph } from '../../services/graph'

const store = useProjectStore()
const pickedId = ref(store.selectedKind === 'OBJ' && store.selectedId ? store.selectedId : store.project.objects[0]?.id ?? '')

watch(
  () => store.project.objects.map((o) => o.id).join(','),
  () => {
    if (!store.project.objects.some((o) => o.id === pickedId.value)) {
      pickedId.value = store.project.objects[0]?.id ?? ''
    }
  },
)

const current = computed(() => store.project.objects.find((o) => o.id === pickedId.value) ?? null)
const graph = computed(() =>
  current.value ? buildAggregateGraph(current.value) : { nodes: [], edges: [] },
)
</script>

<template>
  <div class="graph-panel">
    <div class="toolbar">
      <span>聚合：</span>
      <select v-model="pickedId">
        <option v-for="o in store.project.objects" :key="o.id" :value="o.id">
          {{ o.name }} ({{ o.id }})
        </option>
      </select>
      <span class="legend">
        <i class="dot" style="border-color: #2563eb"></i>聚合根
        <i class="dot" style="border-color: #0891b2"></i>子实体
        <i class="dot" style="border-color: #64748b"></i>值对象
        <i class="dot dash" style="border-color: #2563eb"></i>引用聚合
      </span>
    </div>
    <div class="flow-wrap">
      <VueFlow
        :nodes="graph.nodes"
        :edges="graph.edges"
        :fit-view-on-init="true"
        :min-zoom="0.2"
        :max-zoom="2"
      >
        <Background :gap="16" />
        <Controls />
      </VueFlow>
      <p v-if="!current" class="empty">暂无对象模型，请先在「对象」标签创建聚合。</p>
    </div>
  </div>
</template>

<style scoped>
@import './graph.css';
</style>
