# 本体模型设计书（MVP实现范围版）

> 版本：V1 对齐版  
> 状态：与当前可运行 MVP 实现严格对齐  
> 目的：完整展示“当前已经实现了什么、未实现什么、如何验证”的设计边界，作为交付与后续扩展的基线文档。  
> 对齐代码范围：
- [designer/src/metamodel/types.ts](designer/src/metamodel/types.ts)
- [designer/src/metamodel/schema.ts](designer/src/metamodel/schema.ts)
- [designer/src/services/validation.ts](designer/src/services/validation.ts)
- [designer/src/stores/project.ts](designer/src/stores/project.ts)
- [designer/src/components](designer/src/components)

---

## 1. 文档定位

本设计书只描述“已经在 MVP 中落地并可运行”的范围，不包含完整版规格中的扩展层（例如 SCN、ACTOR、QOS、GLOSSARY、REQUIREMENT、MAP、API、VIEW、VER 等独立模型）。

对比关系：
- 完整版规格参考 [阶段一-本体模型设计规格书-完整版.md](阶段一-本体模型设计规格书-完整版.md)
- 本文是其 MVP 子集的工程化落地版本

---

## 2. MVP范围总览

当前 MVP 采用“核心五模型”设计：

1. OBJ（对象模型）
2. BHV（行为模型）
3. EVT（事件模型）
4. RULE（规则模型）
5. POLICY（策略模型）

对应类型定义见 [designer/src/metamodel/types.ts](designer/src/metamodel/types.ts)。

### 2.1 实现边界（已实现）

1. 五模型的新增、编辑、删除、列表切换
2. 事件链图（BHV/EVT/POLICY）可视化
3. 单聚合结构图（聚合根/子实体/值对象/对外引用）可视化
4. 一致性校验（错误与警告分级）
5. YAML 导入导出与 Zod 结构校验
6. 浏览器本地持久化（IndexedDB）
7. 内置示例本体加载与空白项目创建

### 2.2 非目标（当前未实现）

1. SCN 场景编排与补偿流
2. ACTOR 授权模型
3. QOS 质量模型
4. GLOSSARY 术语表
5. REQUIREMENT 需求追溯
6. MAP/API/VIEW/VER 技术投影模型
7. 生命周期状态机（Object.lifecycle）
8. 关系基数与关系类型（AggregateRef.cardinality/kind）

---

## 3. 元模型设计（与代码一致）

### 3.0 模型对象总览（MVP）

| 名称 | 编码 | 集合字段 | 说明 |
|---|---|---|---|
| 对象模型 | OBJ | objects | 以聚合根为中心描述业务对象结构（属性、子实体、值对象、不变量、引用）。 |
| 行为模型 | BHV | behaviors | 描述业务动作，定义归属对象、前后置条件、产生与订阅事件、应用规则。 |
| 事件模型 | EVT | events | 描述事件契约（载荷 + 投递语义），作为行为/策略的解耦连接点。 |
| 规则模型 | RULE | rules | 描述纯业务规则（验证/计算/推导/风控），不直接参与事件订阅与触发。 |
| 策略模型 | POLICY | policies | 描述事件驱动反应逻辑（订阅事件→条件判断→触发事件）。 |

### 3.1 根容器 OntologyProject

当前项目容器结构如下：

```ts
interface OntologyProject {
  version: string
  name: string
  objects: ObjectModel[]
  behaviors: BehaviorModel[]
  events: EventModel[]
  rules: RuleModel[]
  policies: PolicyModel[]
}
```

来源：[designer/src/metamodel/types.ts](designer/src/metamodel/types.ts)

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 版本号 | version | string | 是 | 本体数据版本号。 |
| 项目名称 | name | string | 是 | 当前建模项目显示名。 |
| 对象集合 | objects | ObjectModel[] | 是 | OBJ 模型列表。 |
| 行为集合 | behaviors | BehaviorModel[] | 是 | BHV 模型列表。 |
| 事件集合 | events | EventModel[] | 是 | EVT 模型列表。 |
| 规则集合 | rules | RuleModel[] | 是 | RULE 模型列表。 |
| 策略集合 | policies | PolicyModel[] | 是 | POLICY 模型列表。 |

### 3.2 OBJ 对象模型

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 标识 | id | string | 是 | 集合内唯一；需满足命名规则。 |
| 名称 | name | string | 是 | 对象展示名。 |
| 描述 | description | string | 否 | 业务语义补充。 |
| 唯一标识字段 | identity | string | 是 | 聚合根主键字段名（例如 contractNo）。 |
| 属性集合 | attributes | Attribute[] | 是 | 聚合根自身属性列表。 |
| 子实体集合 | entities | ChildEntity[] | 是 | 聚合内子实体定义。 |
| 值对象集合 | valueObjects | ValueObject[] | 是 | 无标识值对象定义。 |
| 不变量集合 | invariants | Invariant[] | 是 | 聚合内恒成立约束。 |
| 对外引用集合 | references | AggregateRef[] | 是 | 仅 ID 引用其他 OBJ；不内嵌对方对象。 |

#### OBJ 子结构字段

`Attribute`

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 属性名 | name | string | 是 | 字段名。 |
| 属性类型 | type | AttributeType | 是 | 取值见 3.4/附注。 |
| 必填 | required | boolean | 是 | 是否必填。 |
| 描述 | description | string | 否 | 字段业务说明。 |

`ChildEntity`

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 子实体标识 | id | string | 是 | 子实体 id。 |
| 子实体名称 | name | string | 是 | 子实体展示名。 |
| 子实体唯一标识字段 | identity | string | 是 | 子实体主键字段名。 |
| 子实体属性集合 | attributes | Attribute[] | 是 | 子实体字段列表。 |

`ValueObject`

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 值对象标识 | id | string | 是 | 值对象 id。 |
| 值对象名称 | name | string | 是 | 值对象展示名。 |
| 值对象属性集合 | attributes | Attribute[] | 是 | 值对象字段列表。 |

`Invariant`

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 约束标识 | id | string | 是 | 约束 id。 |
| 约束表达式 | expression | string | 是 | 约束逻辑表达式。 |
| 约束描述 | description | string | 否 | 约束说明。 |

`AggregateRef`

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 目标对象编码 | targetObjectId | string | 是 | 引用的 OBJ.id。 |
| 引用字段 | refField | string | 是 | 本对象内存放目标 ID 的字段名。 |
| 描述 | description | string | 否 | 引用说明。 |

备注：MVP 的 `references` 仅包含 `targetObjectId/refField/description`，不含基数与关系类型。

### 3.3 BHV 行为模型

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 标识 | id | string | 是 | 行为唯一编码。 |
| 名称 | name | string | 是 | 行为展示名。 |
| 描述 | description | string | 否 | 行为业务说明。 |
| 所属对象引用 | objectRef | string | 是 | 指向 OBJ.id。 |
| 前置条件 | preconditions | string[] | 是 | 行为执行前需满足条件。 |
| 后置条件 | postconditions | string[] | 是 | 行为执行后承诺结果。 |
| 应用规则引用 | appliedRuleRefs | string[] | 是 | 指向 RULE.id。 |
| 产生事件引用 | producedEventRefs | string[] | 是 | 指向 EVT.id。 |
| 订阅事件引用 | subscribedEventRefs | string[] | 是 | 指向 EVT.id。 |

备注：当前无 `trigger`、`authorize`、`qos`、`compensatedBy` 字段。

### 3.4 EVT 事件模型

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 标识 | id | string | 是 | 事件唯一编码。 |
| 名称 | name | string | 是 | 事件展示名。 |
| 描述 | description | string | 否 | 事件语义说明。 |
| 载荷字段集合 | payload | Attribute[] | 是 | 事件携带数据定义。 |
| 投递语义 | deliverySemantics | DeliverySemantics | 是 | 事件投递保证策略。 |

`deliverySemantics` 枚举说明：

| 名称 | 编码 | 说明 |
|---|---|---|
| 至少一次 | AT_LEAST_ONCE | 允许重复，消费侧需幂等。 |
| 恰好一次 | EXACTLY_ONCE | 语义最强，实现成本高。 |
| 尽力而为 | BEST_EFFORT | 允许丢失，用于弱关键链路。 |

### 3.5 RULE 规则模型

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 标识 | id | string | 是 | 规则唯一编码。 |
| 名称 | name | string | 是 | 规则展示名。 |
| 描述 | description | string | 否 | 规则说明。 |
| 规则类型 | type | RuleType | 是 | 规则分类。 |
| 条件表达式 | condition | string | 是 | 规则判断逻辑。 |

`type` 枚举说明：

| 名称 | 编码 | 说明 |
|---|---|---|
| 验证规则 | validation | 数据/状态合法性校验。 |
| 计算规则 | calculation | 派生计算（金额、税额等）。 |
| 推导规则 | derivation | 基于条件推导结论。 |
| 风控规则 | risk | 风险判定。 |

说明：RULE 在 MVP 中已回归“纯规则”定位，不承载事件编排语义。

### 3.6 POLICY 策略模型

| 名称 | 编码 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| 标识 | id | string | 是 | 策略唯一编码。 |
| 名称 | name | string | 是 | 策略展示名。 |
| 描述 | description | string | 否 | 策略说明。 |
| 订阅事件引用 | subscribedEventRefs | string[] | 是 | 指向 EVT.id。 |
| 条件表达式 | condition | string | 是 | 触发判定逻辑。 |
| 触发事件引用 | triggeredEventRefs | string[] | 是 | 指向 EVT.id。 |

说明：POLICY 是事件驱动的一等模型，表达“订阅事件 → 判断条件 → 触发事件”。

---

## 4. 结构与导入校验（Schema层）

结构校验基于 Zod，入口见 [designer/src/metamodel/schema.ts](designer/src/metamodel/schema.ts)。

### 4.1 校验策略

1. 先做 YAML 解析
2. 再做 Zod 结构校验
3. 通过后替换当前项目
4. 不通过则返回错误列表，不覆盖当前项目

### 4.2 关键约束

1. id 正则：字母开头，仅字母/数字/下划线
2. 名称、关键引用字段非空
3. 枚举字段必须落在约定值集合中

导入导出实现见 [designer/src/services/yaml.ts](designer/src/services/yaml.ts)。

---

## 5. 一致性校验（业务语义层）

一致性校验入口： [designer/src/services/validation.ts](designer/src/services/validation.ts)

### 5.1 当前实现的校验码

错误（error）：

1. DUPLICATE_ID
2. DANGLING_OBJ_REF
3. DANGLING_OBJECT
4. DANGLING_RULE
5. DANGLING_EVENT
6. EVENT_CYCLE

警告（warning）：

1. POLICY_NO_SUB
2. POLICY_NO_TRIGGER
3. ORPHAN_EVENT

### 5.2 校验覆盖面

1. 同类模型 id 重复检测
2. 跨模型引用完整性检测（对象/行为/规则/策略/事件）
3. 事件图环路检测（BHV/EVT/POLICY 三类节点）
4. 孤立事件识别
5. 策略空订阅/空触发告警

### 5.3 环路检测图定义

节点：

1. BHV:<id>
2. EVT:<id>
3. POLICY:<id>

边：

1. BHV -> EVT（产生）
2. EVT -> BHV（订阅）
3. EVT -> POLICY（订阅）
4. POLICY -> EVT（触发）

算法：DFS 三色标记（WHITE/GRAY/BLACK）。

---

## 6. 前端交互与页面架构

页面主入口： [designer/src/App.vue](designer/src/App.vue)

### 6.1 布局

1. 顶栏：项目名、校验状态、加载示例、加载供应商示例、新建空白
2. 左栏：模型类型切换 + 模型列表 + 新建/删除
3. 中栏：对应模型编辑器
4. 右栏：事件链、聚合图、校验、YAML

### 6.2 编辑器组件

1. OBJ 编辑器：[designer/src/components/editors/ObjectEditor.vue](designer/src/components/editors/ObjectEditor.vue)
2. BHV 编辑器：[designer/src/components/editors/BehaviorEditor.vue](designer/src/components/editors/BehaviorEditor.vue)
3. EVT 编辑器：[designer/src/components/editors/EventEditor.vue](designer/src/components/editors/EventEditor.vue)
4. RULE 编辑器：[designer/src/components/editors/RuleEditor.vue](designer/src/components/editors/RuleEditor.vue)
5. POLICY 编辑器：[designer/src/components/editors/PolicyEditor.vue](designer/src/components/editors/PolicyEditor.vue)

### 6.3 可视化与工具面板

1. 事件链图：[designer/src/components/graph/EventChainGraph.vue](designer/src/components/graph/EventChainGraph.vue)
2. 聚合图：[designer/src/components/graph/AggregateGraph.vue](designer/src/components/graph/AggregateGraph.vue)
3. 校验面板：[designer/src/components/ValidationPanel.vue](designer/src/components/ValidationPanel.vue)
4. YAML 面板：[designer/src/components/YamlView.vue](designer/src/components/YamlView.vue)

图构建逻辑在 [designer/src/services/graph.ts](designer/src/services/graph.ts)。

---

## 7. 状态管理与持久化

### 7.1 Store 能力

状态管理位于 [designer/src/stores/project.ts](designer/src/stores/project.ts)。

已实现能力：

1. 当前项目状态
2. 当前选中模型状态
3. 计数与选中模型计算属性
4. 校验结果与错误/警告计数
5. 模型新增、删除、选择
6. 加载示例（合同管理）、加载供应商示例、创建空白、整体替换项目

### 7.2 持久化策略

1. 使用 localforage（IndexedDB）
2. key 为 current-project
3. 深度监听 project，400ms 防抖自动保存
4. 初始化时优先加载本地已保存项目

实现见 [designer/src/services/persistence.ts](designer/src/services/persistence.ts)。

---

## 8. 内置示例与闭环演示

设计器内置两套示例本体，均达成 0 错误 / 0 警告：

### 8.1 合同管理系统

定义见 [designer/src/metamodel/sample.ts](designer/src/metamodel/sample.ts)，顶栏「加载示例」载入。覆盖：

1. 合同管理场景
2. 五模型端到端引用关系
3. 事件驱动策略链路
4. 校验通过状态

场景需求说明见 [合同管理系统-场景与需求.md](合同管理系统-场景与需求.md)。

### 8.2 供应商管理系统

定义见 [designer/src/metamodel/sample.supplier.ts](designer/src/metamodel/sample.supplier.ts)，顶栏「加载供应商示例」载入。来源《MOM R2.0 供应商管理功能设计书》，覆盖：

1. 供应商集团 / 供应商（主子表）/ 供应商物料 / 状态更新单 的全生命周期
2. 规模：OBJ 5 / BHV 15 / EVT 23 / RULE 9 / POLICY 9
3. 四态治理（临时/合格/冻结/失效）+ 定时冻结调度 + 失效跨聚合级联
4. 校验通过状态（无环 DAG、无悬空引用、无孤立事件、策略订阅/触发完整）

场景需求说明见 [供应商管理系统-场景与需求.md](供应商管理系统-场景与需求.md)。

---

## 9. 技术栈与工程实现

### 9.1 技术栈

1. Vue 3 + TypeScript
2. Vite 8
3. Pinia
4. Vue Flow
5. Zod
6. js-yaml
7. localforage

### 9.2 关键工程约束

1. js-yaml 使用命名导入（dump/load）
2. YAML 导入必须先通过 Zod 再落库
3. 校验逻辑独立于 UI，确保可复用

---

## 10. 验收口径（MVP）

满足以下条件视为 MVP 功能完整：

1. 可创建/编辑/删除 OBJ/BHV/EVT/RULE/POLICY
2. 事件链图与聚合图可正常渲染
3. 校验面板可实时展示错误与警告
4. YAML 可导出、可导入、可报错
5. 本地持久化可恢复
6. 内置示例可加载并达到校验通过

对应测试结果见 [MVP测试结果.md](MVP测试结果.md)。

---

## 11. 与完整版规格的关系

### 11.1 当前采用策略

1. 保留核心五模型运行闭环
2. 已拆分 POLICY 为独立模型，RULE 回归纯规则
3. 暂不引入多层治理与投影模型，先保证编辑、校验、可视化、导入导出闭环

### 11.2 后续扩展建议顺序

1. 引入 SCN（流程编排与补偿）
2. 引入 ACTOR/QOS 注解
3. 补齐 REQUIREMENT/GLOSSARY 治理
4. 最后接入 MAP/API/VIEW/VER 投影

---

## 12. 结论

本设计书完整覆盖了当前 MVP 的真实实现范围：

1. 模型范围明确（OBJ/BHV/EVT/RULE/POLICY）
2. 功能闭环完整（编辑、校验、可视化、YAML、持久化）
3. 边界清晰（已实现与未实现可判定）
4. 可作为 V1 交付基线与后续迭代起点

如果后续代码实现边界发生变化，应以本文为模板发布下一版“实现范围对齐设计书”，确保文档与代码持续同构。

变更同步原则：后续凡涉及 MVP 模型结构、校验规则、交互入口或示例数据调整，必须同步更新本设计书对应章节。
