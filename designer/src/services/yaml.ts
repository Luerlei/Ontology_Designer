import { dump, load } from 'js-yaml'
import type { OntologyProject } from '../metamodel/types'
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

  const parsed = ontologyProjectSchema.safeParse(raw)
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    )
    return { ok: false, errors }
  }
  return { ok: true, project: parsed.data as OntologyProject }
}
