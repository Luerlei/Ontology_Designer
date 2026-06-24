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
  return (await store.getItem<OntologyProject>(CURRENT_KEY)) ?? null
}

export async function clearProject(): Promise<void> {
  await store.removeItem(CURRENT_KEY)
}
