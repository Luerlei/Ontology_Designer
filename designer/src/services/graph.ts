import type { Edge, Node } from '@vue-flow/core'
import type { ObjectModel, OntologyProject } from '../metamodel/types'
import { MODEL_META } from '../metamodel/naming'
import { detectCycles } from './validation'

/** 单个聚合的内部结构图：聚合根 + 子实体 + 值对象 + 对外引用 */
export function buildAggregateGraph(obj: ObjectModel): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const rootColor = MODEL_META.OBJ.color

  nodes.push({
    id: `root:${obj.id}`,
    position: { x: 40, y: 160 },
    label: `${obj.name}\n«聚合根»`,
    style: nodeStyle(rootColor, true),
  })

  obj.entities.forEach((e, i) => {
    const id = `ent:${e.id}`
    nodes.push({
      id,
      position: { x: 340, y: 40 + i * 110 },
      label: `${e.name}\n«子实体»`,
      style: nodeStyle('#0891b2'),
    })
    edges.push({ id: `e_${id}`, source: `root:${obj.id}`, target: id, label: '包含' })
  })

  obj.valueObjects.forEach((v, i) => {
    const id = `vo:${v.id}`
    nodes.push({
      id,
      position: { x: 340, y: 40 + (obj.entities.length + i) * 110 },
      label: `${v.name}\n«值对象»`,
      style: nodeStyle('#64748b'),
    })
    edges.push({ id: `e_${id}`, source: `root:${obj.id}`, target: id, label: '值对象' })
  })

  obj.references.forEach((r, i) => {
    const id = `extref:${r.targetObjectId}`
    nodes.push({
      id,
      position: { x: 660, y: 100 + i * 110 },
      label: `${r.targetObjectId}\n«引用聚合»`,
      style: nodeStyle(rootColor, false, true),
    })
    edges.push({
      id: `e_ref_${r.targetObjectId}`,
      source: `root:${obj.id}`,
      target: id,
      label: `${r.refField} (ID引用)`,
      animated: true,
      style: { stroke: rootColor, strokeDasharray: '4 4' },
    })
  })

  return { nodes, edges }
}

/** 全局事件链图：行为 / 事件 / 规则 三类节点，含环路高亮 */
export function buildEventChainGraph(p: OntologyProject): { nodes: Node[]; edges: Edge[] } {
  const adj = new Map<string, string[]>()
  const rawEdges: { id: string; source: string; target: string; label: string }[] = []
  const addEdge = (source: string, target: string, label: string) => {
    if (!adj.has(source)) adj.set(source, [])
    adj.get(source)!.push(target)
    rawEdges.push({ id: `${source}__${target}__${label}`, source, target, label })
  }

  for (const b of p.behaviors) {
    b.producedEventRefs.forEach((e) => addEdge(`BHV:${b.id}`, `EVT:${e}`, '产生'))
    b.subscribedEventRefs.forEach((e) => addEdge(`EVT:${e}`, `BHV:${b.id}`, '订阅'))
  }
  for (const r of p.rules) {
    r.subscribedEventRefs.forEach((e) => addEdge(`EVT:${e}`, `RULE:${r.id}`, '订阅'))
    r.triggeredEventRefs.forEach((e) => addEdge(`RULE:${r.id}`, `EVT:${e}`, '触发'))
  }

  // 收集所有节点
  const nodeIds = new Set<string>()
  rawEdges.forEach((e) => {
    nodeIds.add(e.source)
    nodeIds.add(e.target)
  })
  // 把未连边的孤立模型也放进来
  p.behaviors.forEach((b) => nodeIds.add(`BHV:${b.id}`))
  p.events.forEach((e) => nodeIds.add(`EVT:${e.id}`))
  p.rules.forEach((r) => nodeIds.add(`RULE:${r.id}`))

  // 最长路径分层
  const layer = new Map<string, number>()
  nodeIds.forEach((n) => layer.set(n, 0))
  for (let iter = 0; iter < nodeIds.size; iter++) {
    let changed = false
    for (const e of rawEdges) {
      if ((layer.get(e.target) ?? 0) < (layer.get(e.source) ?? 0) + 1) {
        layer.set(e.target, (layer.get(e.source) ?? 0) + 1)
        changed = true
      }
    }
    if (!changed) break
  }

  const perLayerCount = new Map<number, number>()
  const labelOf = (id: string): string => {
    const [kind, ref] = id.split(':')
    if (kind === 'BHV') return p.behaviors.find((b) => b.id === ref)?.name ?? ref
    if (kind === 'EVT') return p.events.find((e) => e.id === ref)?.name ?? ref
    if (kind === 'RULE') return p.rules.find((r) => r.id === ref)?.name ?? ref
    return ref
  }
  const colorOf = (id: string): string => {
    const kind = id.split(':')[0]
    if (kind === 'BHV') return MODEL_META.BHV.color
    if (kind === 'EVT') return MODEL_META.EVT.color
    return MODEL_META.RULE.color
  }

  const nodes: Node[] = []
  for (const id of nodeIds) {
    const l = layer.get(id) ?? 0
    const idx = perLayerCount.get(l) ?? 0
    perLayerCount.set(l, idx + 1)
    const kind = id.split(':')[0]
    nodes.push({
      id,
      position: { x: l * 240 + 40, y: idx * 110 + 40 },
      label: `${kind} · ${labelOf(id)}`,
      style: nodeStyle(colorOf(id)),
    })
  }

  // 环路高亮
  const cycleNodes = new Set<string>()
  for (const c of detectCycles(p)) c.forEach((n) => cycleNodes.add(n))

  const edges: Edge[] = rawEdges.map((e) => {
    const inCycle = cycleNodes.has(e.source) && cycleNodes.has(e.target)
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: inCycle,
      style: inCycle
        ? { stroke: '#dc2626', strokeWidth: 2 }
        : { stroke: '#94a3b8' },
    }
  })

  return { nodes, edges }
}

function nodeStyle(color: string, isRoot = false, dashed = false): Record<string, string> {
  return {
    background: '#fff',
    border: `${isRoot ? 3 : 2}px ${dashed ? 'dashed' : 'solid'} ${color}`,
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#1e293b',
    whiteSpace: 'pre-line',
    textAlign: 'center',
    minWidth: '120px',
  }
}
