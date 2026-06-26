import { dump, load } from 'js-yaml'
import type { OntologyProject, PolicyModel } from '../metamodel/types'
import { ontologyProjectSchema } from '../metamodel/schema'

export function exportYaml(project: OntologyProject): string {
  return dump(project, { noRefs: true, lineWidth: 120, sortKeys: false })
}

export interface ImportResult {
  ok: boolean
  project?: OntologyProject
  errors?: string[]
}

export function importYaml(text: string): ImportResult {
  let raw: unknown
  try {
    raw = load(text)
  } catch (e) {
    return { ok: false, errors: [`YAML 解析失败：${(e as Error).message}`] }
  }

  const migrated = migrateLegacyProject(raw)
  const parsed = ontologyProjectSchema.safeParse(migrated)
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    )
    return { ok: false, errors }
  }
  return { ok: true, project: parsed.data as OntologyProject }
}

function migrateLegacyProject(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw

  const project = raw as {
    rules?: Array<Record<string, unknown>>
    policies?: Array<Record<string, unknown>>
  }

  const legacyRules = Array.isArray(project.rules) ? project.rules : []
  const existingPolicies = Array.isArray(project.policies) ? project.policies : []

  const migratedPolicies: PolicyModel[] = []
  const pureRules: Array<Record<string, unknown>> = []

  for (const rule of legacyRules) {
    const type = String(rule.type ?? '')
    if (type === 'event-driven') {
      migratedPolicies.push({
        id: String(rule.id ?? ''),
        name: String(rule.name ?? ''),
        description: rule.description ? String(rule.description) : undefined,
        subscribedEventRefs: Array.isArray(rule.subscribedEventRefs)
          ? rule.subscribedEventRefs.map((x) => String(x))
          : [],
        condition: String(rule.condition ?? ''),
        triggeredEventRefs: Array.isArray(rule.triggeredEventRefs)
          ? rule.triggeredEventRefs.map((x) => String(x))
          : [],
      })
      continue
    }
    const nextRule = { ...rule }
    delete nextRule.subscribedEventRefs
    delete nextRule.triggeredEventRefs
    pureRules.push(nextRule)
  }

  return {
    ...(project as Record<string, unknown>),
    rules: pureRules,
    policies: [...existingPolicies, ...migratedPolicies],
  }
}
