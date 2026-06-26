import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  BehaviorModel,
  EventModel,
  ModelKind,
  ObjectModel,
  OntologyProject,
  PolicyModel,
  RuleModel,
} from '../metamodel/types'
import { MODEL_META } from '../metamodel/naming'
import { emptyProject, sampleProject } from '../metamodel/sample'
import { supplierSampleProject } from '../metamodel/sample.supplier'
import { validateProject, type ValidationIssue } from '../services/validation'
import { loadProject, saveProject } from '../services/persistence'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

function uniqueId(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base
  let i = 1
  while (existing.includes(`${base}${i}`)) i++
  return `${base}${i}`
}

export const useProjectStore = defineStore('project', () => {
  const project = ref<OntologyProject>(clone(sampleProject))
  const selectedKind = ref<ModelKind>('OBJ')
  const selectedId = ref<string | null>(sampleProject.objects[0]?.id ?? null)
  const loaded = ref(false)

  const issues = computed<ValidationIssue[]>(() => validateProject(project.value))
  const errorCount = computed(() => issues.value.filter((i) => i.level === 'error').length)
  const warningCount = computed(() => issues.value.filter((i) => i.level === 'warning').length)

  function list(kind: ModelKind) {
    return project.value[MODEL_META[kind].collection]
  }

  const currentList = computed(() => list(selectedKind.value))
  const selectedModel = computed(() => {
    if (selectedId.value == null) return null
    return (currentList.value as { id: string }[]).find((m) => m.id === selectedId.value) ?? null
  })

  function counts() {
    return {
      OBJ: project.value.objects.length,
      BHV: project.value.behaviors.length,
      EVT: project.value.events.length,
      RULE: project.value.rules.length,
      POLICY: project.value.policies.length,
    }
  }

  function select(kind: ModelKind, id: string | null) {
    selectedKind.value = kind
    selectedId.value = id
  }

  function allIds(kind: ModelKind): string[] {
    return (list(kind) as { id: string }[]).map((m) => m.id)
  }

  function createDefault(kind: ModelKind): ObjectModel | BehaviorModel | EventModel | RuleModel | PolicyModel {
    const ids = allIds(kind)
    switch (kind) {
      case 'OBJ':
        return {
          id: uniqueId('NewObject', ids),
          name: '新对象',
          identity: 'id',
          attributes: [],
          entities: [],
          valueObjects: [],
          invariants: [],
          references: [],
        } satisfies ObjectModel
      case 'BHV':
        return {
          id: uniqueId('NewBehavior', ids),
          name: '新行为',
          objectRef: project.value.objects[0]?.id ?? '',
          preconditions: [],
          postconditions: [],
          appliedRuleRefs: [],
          producedEventRefs: [],
          subscribedEventRefs: [],
        } satisfies BehaviorModel
      case 'EVT':
        return {
          id: uniqueId('NewEvent', ids),
          name: '新事件',
          payload: [],
          deliverySemantics: 'AT_LEAST_ONCE',
        } satisfies EventModel
      case 'RULE':
        return {
          id: uniqueId('NewRule', ids),
          name: '新规则',
          type: 'validation',
          condition: '',
        } satisfies RuleModel
      case 'POLICY':
        return {
          id: uniqueId('NewPolicy', ids),
          name: '新策略',
          subscribedEventRefs: [],
          triggeredEventRefs: [],
          condition: '',
        } satisfies PolicyModel
    }
  }

  function addModel(kind: ModelKind) {
    const model = createDefault(kind)
    ;(list(kind) as unknown[]).push(model)
    select(kind, model.id)
  }

  function removeModel(kind: ModelKind, id: string) {
    const arr = list(kind) as { id: string }[]
    const idx = arr.findIndex((m) => m.id === id)
    if (idx >= 0) arr.splice(idx, 1)
    if (selectedId.value === id) {
      selectedId.value = (list(kind) as { id: string }[])[0]?.id ?? null
    }
  }

  function loadSample() {
    project.value = clone(sampleProject)
    select('OBJ', project.value.objects[0]?.id ?? null)
  }

  function loadSupplierSample() {
    project.value = clone(supplierSampleProject)
    select('OBJ', project.value.objects[0]?.id ?? null)
  }

  function newEmpty() {
    project.value = emptyProject()
    select('OBJ', null)
  }

  function replaceProject(p: OntologyProject) {
    project.value = clone(p)
    select('OBJ', project.value.objects[0]?.id ?? null)
  }

  async function init() {
    const saved = await loadProject()
    if (saved) {
      project.value = saved
      select('OBJ', project.value.objects[0]?.id ?? null)
    }
    loaded.value = true
  }

  // 自动持久化（防抖）
  let timer: ReturnType<typeof setTimeout> | null = null
  watch(
    project,
    (p) => {
      if (!loaded.value) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void saveProject(p), 400)
    },
    { deep: true },
  )

  return {
    project,
    selectedKind,
    selectedId,
    loaded,
    issues,
    errorCount,
    warningCount,
    currentList,
    selectedModel,
    counts,
    list,
    select,
    addModel,
    removeModel,
    loadSample,
    loadSupplierSample,
    newEmpty,
    replaceProject,
    init,
  }
})
