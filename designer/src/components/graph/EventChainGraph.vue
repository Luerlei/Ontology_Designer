<script setup lang="ts">
import { computed } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useProjectStore } from '../../stores/project'
import { buildEventChainGraph } from '../../services/graph'
import { detectCycles } from '../../services/validation'

const store = useProjectStore()
const graph = computed(() => buildEventChainGraph(store.project))
const cycles = computed(() => detectCycles(store.project))
</script>

<template>
  <div class="graph-panel">
    <div class="toolbar">
      <span class="legend">
        <i class="dot" style="border-color: #16a34a"></i>行为 BHV
        <i class="dot" style="border-color: #d97706"></i>事件 EVT
        <i class="dot" style="border-color: #9333ea"></i>规则 RULE
      </span>
      <span v-if="cycles.length" class="cycle-warn">⚠ 检测到 {{ cycles.length }} 处环路（红色高亮）</span>
    </div>
    <div class="flow-wrap">
      <VueFlow
        :nodes="graph.nodes"
        :edges="graph.edges"
        :fit-view-on-init="true"
        :min-zoom="0.15"
        :max-zoom="2"
      >
        <Background :gap="16" />
        <Controls />
      </VueFlow>
      <p v-if="!graph.nodes.length" class="empty">暂无事件链，请先创建行为、事件、规则并建立引用关系。</p>
    </div>
  </div>
</template>

<style scoped>
@import './graph.css';
.cycle-warn {
  color: #dc2626;
  font-weight: 600;
  font-size: 13px;
}
</style>
