<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProjectStore } from './stores/project'
import { MODEL_KINDS, MODEL_META } from './metamodel/naming'
import type { ModelKind } from './metamodel/types'
import ObjectEditor from './components/editors/ObjectEditor.vue'
import BehaviorEditor from './components/editors/BehaviorEditor.vue'
import EventEditor from './components/editors/EventEditor.vue'
import RuleEditor from './components/editors/RuleEditor.vue'
import PolicyEditor from './components/editors/PolicyEditor.vue'
import AggregateGraph from './components/graph/AggregateGraph.vue'
import EventChainGraph from './components/graph/EventChainGraph.vue'
import ValidationPanel from './components/ValidationPanel.vue'
import YamlView from './components/YamlView.vue'

const store = useProjectStore()
const rightTab = ref<'aggregate' | 'chain' | 'validate' | 'yaml'>('chain')

onMounted(() => store.init())

const counts = computed(() => store.counts())

function pickKind(kind: ModelKind) {
  const first = (store.list(kind) as { id: string }[])[0]?.id ?? null
  store.select(kind, first)
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <strong>本体模型设计器</strong>
        <span class="sub">Ontology Designer · MVP</span>
      </div>
      <input class="proj-name" v-model="store.project.name" title="项目名称" />
      <div class="top-actions">
        <span class="stat">
          <i class="ok" v-if="store.errorCount === 0">✓ 校验通过</i>
          <i class="bad" v-else>✖ {{ store.errorCount }} 错误</i>
          <i v-if="store.warningCount" class="warn">{{ store.warningCount }} 警告</i>
        </span>
        <button @click="store.loadSample()">加载示例</button>
        <button @click="store.loadSupplierSample()">加载供应商示例</button>
        <button @click="store.newEmpty()">新建空白</button>
      </div>
    </header>

    <div class="body">
      <!-- 左侧：模型导航 + 列表 -->
      <aside class="sidebar">
        <nav class="kind-tabs">
          <button
            v-for="k in MODEL_KINDS"
            :key="k"
            :class="['kind-tab', { active: store.selectedKind === k }]"
            :style="{ '--c': MODEL_META[k].color }"
            @click="pickKind(k)"
          >
            <span class="code">{{ k }}</span>
            <span class="lbl">{{ MODEL_META[k].label }}</span>
            <span class="cnt">{{ counts[k] }}</span>
          </button>
        </nav>

        <div class="list-head">
          <span>{{ MODEL_META[store.selectedKind].label }}列表</span>
          <button class="mini" @click="store.addModel(store.selectedKind)">+ 新建</button>
        </div>
        <ul class="model-list">
          <li
            v-for="m in (store.currentList as { id: string; name: string }[])"
            :key="m.id"
            :class="{ active: store.selectedId === m.id }"
            @click="store.select(store.selectedKind, m.id)"
          >
            <div class="m-main">
              <span class="m-name">{{ m.name }}</span>
              <span class="m-id">{{ m.id }}</span>
            </div>
            <button
              class="del"
              title="删除"
              @click.stop="store.removeModel(store.selectedKind, m.id)"
            >
              ×
            </button>
          </li>
          <li v-if="!store.currentList.length" class="empty-li">暂无模型，点击「+ 新建」</li>
        </ul>
      </aside>

      <!-- 中间：编辑器 -->
      <main class="editor-area">
        <div v-if="store.selectedModel" class="editor-card">
          <ObjectEditor
            v-if="store.selectedKind === 'OBJ'"
            :key="store.selectedId!"
            :model="store.selectedModel as any"
          />
          <BehaviorEditor
            v-else-if="store.selectedKind === 'BHV'"
            :key="store.selectedId!"
            :model="store.selectedModel as any"
          />
          <EventEditor
            v-else-if="store.selectedKind === 'EVT'"
            :key="store.selectedId!"
            :model="store.selectedModel as any"
          />
          <RuleEditor
            v-else-if="store.selectedKind === 'RULE'"
            :key="store.selectedId!"
            :model="store.selectedModel as any"
          />
          <PolicyEditor
            v-else
            :key="store.selectedId!"
            :model="store.selectedModel as any"
          />
        </div>
        <div v-else class="placeholder">
          请选择左侧模型，或点击「+ 新建」开始建模。
        </div>
      </main>

      <!-- 右侧：可视化 / 校验 / YAML -->
      <section class="inspector">
        <nav class="insp-tabs">
          <button :class="{ active: rightTab === 'chain' }" @click="rightTab = 'chain'">事件链</button>
          <button :class="{ active: rightTab === 'aggregate' }" @click="rightTab = 'aggregate'">聚合图</button>
          <button :class="{ active: rightTab === 'validate' }" @click="rightTab = 'validate'">
            校验<span v-if="store.errorCount" class="dot-err">{{ store.errorCount }}</span>
          </button>
          <button :class="{ active: rightTab === 'yaml' }" @click="rightTab = 'yaml'">YAML</button>
        </nav>
        <div class="insp-body">
          <EventChainGraph v-if="rightTab === 'chain'" />
          <AggregateGraph v-else-if="rightTab === 'aggregate'" />
          <ValidationPanel v-else-if="rightTab === 'validate'" />
          <YamlView v-else />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 18px;
  background: #0f172a;
  color: #fff;
}
.brand strong {
  font-size: 16px;
}
.brand .sub {
  margin-left: 8px;
  font-size: 12px;
  color: #94a3b8;
}
.proj-name {
  margin-left: auto;
  background: #1e293b;
  border: 1px solid #334155;
  color: #fff;
  border-radius: 6px;
  padding: 5px 10px;
  width: 200px;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat {
  font-size: 12px;
  display: flex;
  gap: 8px;
  margin-right: 4px;
}
.stat .ok {
  color: #4ade80;
}
.stat .bad {
  color: #f87171;
}
.stat .warn {
  color: #fbbf24;
}
.top-actions button {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}
.top-actions button:last-child {
  background: #334155;
}

.body {
  flex: 1;
  display: grid;
  grid-template-columns: 240px minmax(360px, 1fr) minmax(420px, 1.1fr);
  min-height: 0;
}

/* 左侧 */
.sidebar {
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f8fafc;
}
.kind-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 10px;
}
.kind-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid var(--c);
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  position: relative;
}
.kind-tab.active {
  background: var(--c);
  color: #fff;
}
.kind-tab .code {
  font-weight: 700;
  font-size: 12px;
}
.kind-tab .lbl {
  font-size: 11px;
}
.kind-tab .cnt {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 11px;
  opacity: 0.7;
}
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  color: #475569;
  border-top: 1px solid #e2e8f0;
}
.mini {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 12px;
}
.model-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  flex: 1;
}
.model-list li {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eef2f6;
}
.model-list li.active {
  background: #e0edff;
}
.m-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.m-name {
  font-size: 13px;
  color: #0f172a;
}
.m-id {
  font-size: 11px;
  color: #94a3b8;
}
.model-list .del {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 16px;
  cursor: pointer;
}
.model-list .del:hover {
  color: #dc2626;
}
.empty-li {
  color: #94a3b8;
  font-size: 13px;
  cursor: default !important;
}

/* 中间 */
.editor-area {
  overflow: auto;
  padding: 18px;
  min-height: 0;
}
.editor-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
}
.placeholder {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 右侧 */
.inspector {
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.insp-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 8px 0;
  border-bottom: 1px solid #e2e8f0;
}
.insp-tabs button {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 7px 12px;
  cursor: pointer;
  color: #64748b;
  font-size: 13px;
}
.insp-tabs button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}
.dot-err {
  background: #dc2626;
  color: #fff;
  border-radius: 999px;
  font-size: 10px;
  padding: 0 5px;
  margin-left: 4px;
}
.insp-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
