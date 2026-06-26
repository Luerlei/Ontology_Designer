import type { ModelKind, OntologyProject } from '../metamodel/types'

export type IssueLevel = 'error' | 'warning'

export interface ValidationIssue {
  level: IssueLevel
  /** 关联模型类型 */
  kind?: ModelKind
  /** 关联模型 id */
  ref?: string
  message: string
  code: string
}

/**
 * 本体一致性校验：
 * 1. id 重复（每个集合内唯一）
 * 2. 跨模型引用完整性（无悬空引用）
 * 3. 事件-规则闭环的环路检测
 */
export function validateProject(p: OntologyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  const objIds = new Set(p.objects.map((o) => o.id))
  const evtIds = new Set(p.events.map((e) => e.id))
  const ruleIds = new Set(p.rules.map((r) => r.id))

  // 1. id 重复检测
  checkDuplicates(p.objects.map((o) => o.id), 'OBJ', issues)
  checkDuplicates(p.behaviors.map((b) => b.id), 'BHV', issues)
  checkDuplicates(p.events.map((e) => e.id), 'EVT', issues)
  checkDuplicates(p.rules.map((r) => r.id), 'RULE', issues)
  checkDuplicates(p.policies.map((x) => x.id), 'POLICY', issues)

  // 2. 引用完整性
  for (const o of p.objects) {
    for (const r of o.references) {
      if (!objIds.has(r.targetObjectId)) {
        issues.push({
          level: 'error',
          kind: 'OBJ',
          ref: o.id,
          code: 'DANGLING_OBJ_REF',
          message: `对象「${o.id}」引用了不存在的聚合：${r.targetObjectId}`,
        })
      }
    }
  }

  for (const b of p.behaviors) {
    if (!objIds.has(b.objectRef)) {
      issues.push({
        level: 'error',
        kind: 'BHV',
        ref: b.id,
        code: 'DANGLING_OBJECT',
        message: `行为「${b.id}」归属的聚合不存在：${b.objectRef || '(未设置)'}`,
      })
    }
    checkRefs(b.appliedRuleRefs, ruleIds, 'BHV', b.id, '规则', 'DANGLING_RULE', issues)
    checkRefs(b.producedEventRefs, evtIds, 'BHV', b.id, '产生事件', 'DANGLING_EVENT', issues)
    checkRefs(b.subscribedEventRefs, evtIds, 'BHV', b.id, '订阅事件', 'DANGLING_EVENT', issues)
  }

  for (const r of p.rules) {
    if (r.type === 'validation' || r.type === 'calculation' || r.type === 'derivation' || r.type === 'risk') {
      // noop
    }
  }

  for (const x of p.policies) {
    checkRefs(x.subscribedEventRefs, evtIds, 'POLICY', x.id, '订阅事件', 'DANGLING_EVENT', issues)
    checkRefs(x.triggeredEventRefs, evtIds, 'POLICY', x.id, '触发事件', 'DANGLING_EVENT', issues)
    if (x.subscribedEventRefs.length === 0) {
      issues.push({
        level: 'warning',
        kind: 'POLICY',
        ref: x.id,
        code: 'POLICY_NO_SUB',
        message: `策略「${x.id}」未订阅任何事件`,
      })
    }
    if (x.triggeredEventRefs.length === 0) {
      issues.push({
        level: 'warning',
        kind: 'POLICY',
        ref: x.id,
        code: 'POLICY_NO_TRIGGER',
        message: `策略「${x.id}」未触发任何事件`,
      })
    }
  }

  // 孤立事件（既无生产者也无订阅者）
  for (const e of p.events) {
    const hasProducer =
      p.behaviors.some((b) => b.producedEventRefs.includes(e.id)) ||
      p.policies.some((x) => x.triggeredEventRefs.includes(e.id))
    const hasConsumer =
      p.behaviors.some((b) => b.subscribedEventRefs.includes(e.id)) ||
      p.policies.some((x) => x.subscribedEventRefs.includes(e.id))
    if (!hasProducer && !hasConsumer) {
      issues.push({
        level: 'warning',
        kind: 'EVT',
        ref: e.id,
        code: 'ORPHAN_EVENT',
        message: `事件「${e.id}」既无生产者也无订阅者`,
      })
    }
  }

  // 3. 环路检测
  for (const cycle of detectCycles(p)) {
    issues.push({
      level: 'error',
      code: 'EVENT_CYCLE',
      message: `检测到事件-规则环路：${cycle.join(' → ')}`,
    })
  }

  return issues
}

function checkDuplicates(ids: string[], kind: ModelKind, issues: ValidationIssue[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      issues.push({
        level: 'error',
        kind,
        ref: id,
        code: 'DUPLICATE_ID',
        message: `${kind} 存在重复 id：${id}`,
      })
    }
    seen.add(id)
  }
}

function checkRefs(
  refs: string[],
  pool: Set<string>,
  kind: ModelKind,
  ownerId: string,
  label: string,
  code: string,
  issues: ValidationIssue[],
) {
  for (const ref of refs) {
    if (!pool.has(ref)) {
      issues.push({
        level: 'error',
        kind,
        ref: ownerId,
        code,
        message: `${kind}「${ownerId}」的${label}引用不存在：${ref}`,
      })
    }
  }
}

/**
 * 在事件-策略有向图上检测环路。
 * 节点：behavior:<id> / policy:<id> / event:<id>
 * 边：BHV --produces--> EVT，EVT --> BHV(订阅)，EVT --> POLICY(订阅)，POLICY --triggers--> EVT
 */
export function detectCycles(p: OntologyProject): string[][] {
  const adj = new Map<string, string[]>()
  const add = (from: string, to: string) => {
    if (!adj.has(from)) adj.set(from, [])
    adj.get(from)!.push(to)
  }

  for (const b of p.behaviors) {
    b.producedEventRefs.forEach((e) => add(`BHV:${b.id}`, `EVT:${e}`))
    b.subscribedEventRefs.forEach((e) => add(`EVT:${e}`, `BHV:${b.id}`))
  }
  for (const x of p.policies) {
    x.subscribedEventRefs.forEach((e) => add(`EVT:${e}`, `POLICY:${x.id}`))
    x.triggeredEventRefs.forEach((e) => add(`POLICY:${x.id}`, `EVT:${e}`))
  }

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()
  const stack: string[] = []
  const cycles: string[][] = []
  const seenCycle = new Set<string>()

  const nodes = new Set<string>()
  for (const [from, tos] of adj) {
    nodes.add(from)
    tos.forEach((t) => nodes.add(t))
  }

  const dfs = (node: string) => {
    color.set(node, GRAY)
    stack.push(node)
    for (const next of adj.get(node) ?? []) {
      const c = color.get(next) ?? WHITE
      if (c === GRAY) {
        const idx = stack.indexOf(next)
        const cycle = stack.slice(idx).concat(next)
        const key = [...cycle].sort().join('|')
        if (!seenCycle.has(key)) {
          seenCycle.add(key)
          cycles.push(cycle)
        }
      } else if (c === WHITE) {
        dfs(next)
      }
    }
    stack.pop()
    color.set(node, BLACK)
  }

  for (const node of nodes) {
    if ((color.get(node) ?? WHITE) === WHITE) dfs(node)
  }

  return cycles
}
