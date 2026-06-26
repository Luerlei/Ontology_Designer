import { z } from 'zod'

/** 标识符规则：字母开头，字母/数字/下划线 */
const idSchema = z
  .string()
  .min(1, 'id 不能为空')
  .regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'id 需以字母开头，仅含字母/数字/下划线')

const attributeTypeSchema = z.enum([
  'string',
  'number',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'enum',
  'reference',
  'object',
])

export const attributeSchema = z.object({
  name: z.string().min(1, '属性名不能为空'),
  type: attributeTypeSchema,
  required: z.boolean(),
  description: z.string().optional(),
})

export const invariantSchema = z.object({
  id: idSchema,
  expression: z.string().min(1, '约束表达式不能为空'),
  description: z.string().optional(),
})

export const childEntitySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  identity: z.string().min(1),
  attributes: z.array(attributeSchema),
})

export const valueObjectSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  attributes: z.array(attributeSchema),
})

export const aggregateRefSchema = z.object({
  targetObjectId: z.string().min(1),
  refField: z.string().min(1),
  description: z.string().optional(),
})

export const objectModelSchema = z.object({
  id: idSchema,
  name: z.string().min(1, '名称不能为空'),
  description: z.string().optional(),
  identity: z.string().min(1, '聚合根需指定唯一标识字段'),
  attributes: z.array(attributeSchema),
  entities: z.array(childEntitySchema),
  valueObjects: z.array(valueObjectSchema),
  invariants: z.array(invariantSchema),
  references: z.array(aggregateRefSchema),
})

export const behaviorModelSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  objectRef: z.string().min(1, '行为必须归属一个聚合根'),
  preconditions: z.array(z.string()),
  postconditions: z.array(z.string()),
  appliedRuleRefs: z.array(z.string()),
  producedEventRefs: z.array(z.string()),
  subscribedEventRefs: z.array(z.string()),
})

export const eventModelSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  payload: z.array(attributeSchema),
  deliverySemantics: z.enum(['AT_LEAST_ONCE', 'EXACTLY_ONCE', 'BEST_EFFORT']),
})

export const ruleModelSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['validation', 'calculation', 'derivation', 'risk']),
  condition: z.string(),
})

export const policyModelSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  subscribedEventRefs: z.array(z.string()),
  condition: z.string().default(''),
  triggeredEventRefs: z.array(z.string()),
})

export const ontologyProjectSchema = z.object({
  version: z.string(),
  name: z.string().min(1),
  objects: z.array(objectModelSchema),
  behaviors: z.array(behaviorModelSchema),
  events: z.array(eventModelSchema),
  rules: z.array(ruleModelSchema),
  policies: z.array(policyModelSchema).default([]),
})
