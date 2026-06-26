// 一次性校验脚本：用 esbuild 打包后由 node 运行，输出供应商示例的 schema 解析与一致性校验结果。
import { ontologyProjectSchema } from '../src/metamodel/schema'
import { validateProject } from '../src/services/validation'
import { supplierSampleProject } from '../src/metamodel/sample.supplier'

const parsed = ontologyProjectSchema.safeParse(supplierSampleProject)
console.log('--- Schema 解析 ---')
console.log(parsed.success ? 'schema OK' : JSON.stringify(parsed.error.issues, null, 2))

const counts = {
  OBJ: supplierSampleProject.objects.length,
  BHV: supplierSampleProject.behaviors.length,
  EVT: supplierSampleProject.events.length,
  RULE: supplierSampleProject.rules.length,
  POLICY: supplierSampleProject.policies.length,
}
console.log('--- 模型规模 ---')
console.log(JSON.stringify(counts))

const issues = validateProject(supplierSampleProject)
console.log('--- 一致性校验 ---')
for (const i of issues) {
  console.log(`[${i.level}] ${i.code} ${i.ref ?? ''} ${i.message}`)
}
const errors = issues.filter((i) => i.level === 'error').length
const warnings = issues.filter((i) => i.level === 'warning').length
console.log(`RESULT errors=${errors} warnings=${warnings}`)
