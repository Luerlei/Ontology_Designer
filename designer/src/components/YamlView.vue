<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProjectStore } from '../stores/project'
import { exportYaml, importYaml } from '../services/yaml'

const store = useProjectStore()
const importErrors = ref<string[]>([])
const importText = ref('')
const mode = ref<'export' | 'import'>('export')

const yamlText = computed(() => exportYaml(store.project))

function download() {
  const blob = new Blob([yamlText.value], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${store.project.name || 'ontology'}.yaml`
  a.click()
  URL.revokeObjectURL(url)
}

async function copy() {
  await navigator.clipboard.writeText(yamlText.value)
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    importText.value = String(reader.result)
  }
  reader.readAsText(file)
}

function doImport() {
  importErrors.value = []
  const result = importYaml(importText.value)
  if (!result.ok) {
    importErrors.value = result.errors ?? ['未知错误']
    return
  }
  store.replaceProject(result.project!)
  mode.value = 'export'
  importText.value = ''
}
</script>

<template>
  <div class="yaml-view">
    <div class="tabs">
      <button :class="{ active: mode === 'export' }" @click="mode = 'export'">导出</button>
      <button :class="{ active: mode === 'import' }" @click="mode = 'import'">导入</button>
    </div>

    <div v-if="mode === 'export'" class="pane">
      <div class="actions">
        <button class="primary" @click="download">下载 .yaml</button>
        <button @click="copy">复制</button>
      </div>
      <pre class="code">{{ yamlText }}</pre>
    </div>

    <div v-else class="pane">
      <div class="actions">
        <input type="file" accept=".yaml,.yml,.txt" @change="onFile" />
        <button class="primary" @click="doImport">解析并导入</button>
      </div>
      <textarea v-model="importText" class="code" placeholder="在此粘贴 YAML，或选择文件…" />
      <ul v-if="importErrors.length" class="errs">
        <li v-for="(e, i) in importErrors" :key="i">{{ e }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.yaml-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px 0;
}
.tabs button {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 6px 12px;
  cursor: pointer;
  color: #64748b;
}
.tabs button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}
.pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  flex: 1;
  min-height: 0;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.code {
  flex: 1;
  min-height: 200px;
  overflow: auto;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.5;
  white-space: pre;
  margin: 0;
  border: none;
  resize: none;
}
.errs {
  color: #b91c1c;
  font-size: 12.5px;
  margin: 0;
  padding-left: 18px;
}
</style>
