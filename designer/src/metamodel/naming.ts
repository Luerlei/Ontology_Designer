import type { ModelKind, AttributeType, DeliverySemantics, RuleType } from './types'

/** 模型元信息：语义化命名 + 旧编号对照 + 展示属性 */
export interface ModelMeta {
  code: ModelKind
  legacy: string
  label: string
  /** 对应 OntologyProject 中的集合字段 */
  collection: 'objects' | 'behaviors' | 'events' | 'rules' | 'policies'
  color: string
  question: string
}

export const MODEL_META: Record<ModelKind, ModelMeta> = {
  OBJ: {
    code: 'OBJ',
    legacy: 'M1',
    label: '对象模型',
    collection: 'objects',
    color: '#2563eb',
    question: '是什么',
  },
  BHV: {
    code: 'BHV',
    legacy: 'M2',
    label: '行为模型',
    collection: 'behaviors',
    color: '#16a34a',
    question: '做什么',
  },
  EVT: {
    code: 'EVT',
    legacy: 'ME',
    label: '事件模型',
    collection: 'events',
    color: '#d97706',
    question: '如何传播',
  },
  RULE: {
    code: 'RULE',
    legacy: 'M3',
    label: '规则模型',
    collection: 'rules',
    color: '#9333ea',
    question: '为什么',
  },
  POLICY: {
    code: 'POLICY',
    legacy: 'M4',
    label: '策略模型',
    collection: 'policies',
    color: '#7c3aed',
    question: '如何反应',
  },
}

export const MODEL_KINDS: ModelKind[] = ['OBJ', 'BHV', 'EVT', 'RULE', 'POLICY']

export const ATTRIBUTE_TYPES: AttributeType[] = [
  'string',
  'number',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'enum',
  'reference',
  'object',
]

export const DELIVERY_SEMANTICS: DeliverySemantics[] = [
  'AT_LEAST_ONCE',
  'EXACTLY_ONCE',
  'BEST_EFFORT',
]

export const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'validation', label: '验证规则' },
  { value: 'calculation', label: '计算规则' },
  { value: 'derivation', label: '推导规则' },
  { value: 'risk', label: '风控规则' },
]
