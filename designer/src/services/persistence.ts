import localforage from 'localforage'
import type { OntologyProject } from '../metamodel/types'

const store = localforage.createInstance({
  name: 'ontology-designer',
  storeName: 'projects',
})

const CURRENT_KEY = 'current-project'

export async function saveProject(project: OntologyProject): Promise<void> {
  await store.setItem(CURRENT_KEY, JSON.parse(JSON.stringify(project)))
}

export async function loadProject(): Promise<OntologyProject | null> {
  const raw = (await store.getItem<OntologyProject>(CURRENT_KEY)) ?? null
  if (!raw) return null

  const project = raw as unknown as {
    version: string
    name: string
    objects: OntologyProject['objects']
    behaviors: OntologyProject['behaviors']
    events: OntologyProject['events']
    rules: Array<Record<string, unknown>>
    policies?: OntologyProject['policies']
  }

  const policies = Array.isArray(project.policies) ? [...project.policies] : []
  const rules: OntologyProject['rules'] = []

  for (const r of project.rules ?? []) {
    const type = String(r.type ?? '')
    if (type === 'event-driven') {
      policies.push({
        id: String(r.id ?? ''),
        name: String(r.name ?? ''),
        description: r.description ? String(r.description) : undefined,
        subscribedEventRefs: Array.isArray(r.subscribedEventRefs)
          ? r.subscribedEventRefs.map((x) => String(x))
          : [],
        condition: String(r.condition ?? ''),
        triggeredEventRefs: Array.isArray(r.triggeredEventRefs)
          ? r.triggeredEventRefs.map((x) => String(x))
          : [],
      })
      continue
    }
    rules.push({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      description: r.description ? String(r.description) : undefined,
      type: (String(r.type ?? 'validation') as OntologyProject['rules'][number]['type']),
      condition: String(r.condition ?? ''),
    })
  }

  return {
    version: project.version,
    name: project.name,
    objects: project.objects,
    behaviors: project.behaviors,
    events: project.events,
    rules,
    policies,
  }
}

export async function clearProject(): Promise<void> {
  await store.removeItem(CURRENT_KEY)
}
