# 本体模型设计器 · Ontology Designer (MVP)

纯前端的本体模型可视化设计器，用于设计、校验、可视化并导出八大本体模型中的核心四个：

| 短码 | 模型 | 职责 |
|---|---|---|
| **OBJ** | 对象模型 | 聚合根 / 子实体 / 值对象 / 不变性约束 / 对外引用 |
| **BHV** | 行为模型 | 原子操作：前置/后置条件、应用规则、产生/订阅事件 |
| **EVT** | 事件模型 | 业务事件、载荷、顺序语义 |
| **RULE** | 规则模型 | 事件驱动规则：订阅事件 → 条件判断 → 触发事件 |

这四个模型组合即可完整演示架构的核心创新——**事件-规则闭环**：`行为 → 事件 → 规则 → 事件 → 行为`。

## 功能

- **结构化表单编辑**（表单优先）：左侧导航 + 模型列表 + 中间编辑器
- **双视图可视化**（Vue Flow）：
  - 聚合结构图：聚合根、子实体、值对象、对外 ID 引用
  - 事件链图：行为/事件/规则有向图，**自动高亮环路**
- **实时一致性校验**：Schema 校验 + 跨模型引用完整性（悬空引用）+ 环路检测 + 孤立事件提示
- **YAML 导入 / 导出**（带 Schema 解析校验）
- **浏览器本地持久化**（IndexedDB，自动保存）
- 内置「合同管理系统」示例本体

## 技术栈

Vue 3 + TypeScript + Vite · Pinia · Vue Flow · Zod · js-yaml · localforage

## 开发

```bash
cd designer
npm install
npm run dev      # 开发服务器 http://localhost:5173
npm run build    # 类型检查 + 生产构建
```

## 目录结构

```
src/
  metamodel/      元模型：类型定义、Zod Schema、命名、示例数据
  services/       校验(引用完整性/环路)、YAML、持久化、图数据构建
  stores/         Pinia 状态（CRUD + 校验 + 自动持久化）
  components/
    common/       通用表单子组件（属性表、字符串列表、多选引用）
    editors/      OBJ/BHV/EVT/RULE 四个结构化编辑器
    graph/        聚合图、事件链图
    ValidationPanel.vue / YamlView.vue
  App.vue         三栏主布局
```

## 后续路线（P1 / P2）

- **P1**：补全 SCN/ACTOR/SAGA/QOS 四个模型、版本与 diff、后端持久化与协作
- **P2**：接入 AI——模型 → 代码生成、自然语言 → 本体草稿、一致性检查
