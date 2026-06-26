/**
 * 本体元模型 —— 类型定义（OBJ / BHV / EVT / RULE）
 * 这是设计器的“地基”：描述一份合法本体的结构，表单、校验、序列化都依赖它。
 */

export type ModelKind = 'OBJ' | 'BHV' | 'EVT' | 'RULE' | 'POLICY'

export type AttributeType =
  | 'string'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'reference'
  | 'object'

/** 通用属性（用于对象属性、子实体属性、值对象属性、事件载荷） */
export interface Attribute {
  name: string
  type: AttributeType
  required: boolean
  description?: string
}

/** 不变性约束 */
export interface Invariant {
  id: string
  expression: string
  description?: string
}

/** 子实体（聚合内、依赖聚合根） */
export interface ChildEntity {
  id: string
  name: string
  identity: string
  attributes: Attribute[]
}

/** 值对象（无标识、按属性相等、不可变） */
export interface ValueObject {
  id: string
  name: string
  attributes: Attribute[]
}

/** 聚合间的 ID 引用 */
export interface AggregateRef {
  targetObjectId: string
  refField: string
  description?: string
}

/** OBJ 对象模型（聚合根） */
export interface ObjectModel {
  id: string
  name: string
  description?: string
  identity: string
  attributes: Attribute[]
  entities: ChildEntity[]
  valueObjects: ValueObject[]
  invariants: Invariant[]
  references: AggregateRef[]
}

/** BHV 行为模型（原子操作） */
export interface BehaviorModel {
  id: string
  name: string
  description?: string
  /** 所属聚合根 -> ObjectModel.id */
  objectRef: string
  preconditions: string[]
  postconditions: string[]
  /** 应用的规则 -> RuleModel.id */
  appliedRuleRefs: string[]
  /** 产生的事件 -> EventModel.id */
  producedEventRefs: string[]
  /** 订阅的事件 -> EventModel.id */
  subscribedEventRefs: string[]
}

export type DeliverySemantics = 'AT_LEAST_ONCE' | 'EXACTLY_ONCE' | 'BEST_EFFORT'

/** EVT 事件模型 */
export interface EventModel {
  id: string
  name: string
  description?: string
  payload: Attribute[]
  deliverySemantics: DeliverySemantics
}

export type RuleType = 'validation' | 'calculation' | 'derivation' | 'risk'

/** RULE 规则模型 */
export interface RuleModel {
  id: string
  name: string
  description?: string
  type: RuleType
  condition: string
}

/** POLICY 策略模型（事件驱动反应器） */
export interface PolicyModel {
  id: string
  name: string
  description?: string
  /** 订阅的事件 -> EventModel.id */
  subscribedEventRefs: string[]
  condition: string
  /** 满足条件触发的事件 -> EventModel.id */
  triggeredEventRefs: string[]
}

/** 本体工作区（一个项目 = 一组模型） */
export interface OntologyProject {
  version: string
  name: string
  objects: ObjectModel[]
  behaviors: BehaviorModel[]
  events: EventModel[]
  rules: RuleModel[]
  policies: PolicyModel[]
}

export type AnyModel = ObjectModel | BehaviorModel | EventModel | RuleModel | PolicyModel
