import type { OntologyProject } from './types'

/**
 * 示例本体：合同管理系统（增强版，对应《合同管理系统-场景与需求.md》）
 *
 * 覆盖合同全生命周期：录入 → 提交 → 审批（信用风控）→ 激活 →
 *   ├─ 开票分支：创建开票计划 → 开具发票
 *   └─ 配送分支：配送条件检查(策略) → 配送员分配(策略) → 创建配送单 → 确认收货
 *
 * 完整演示三种闭环模式：
 *   1. 行为→事件→行为（简单链）：提交审批 → ContractSubmitted → 审批合同
 *   2. 行为→事件→策略→事件→行为（智能决策链）：激活合同 → ContractActivated → 配送条件检查 → DeliveryReadyToDispatch → …
 *   3. 策略→事件→策略（策略链）：配送条件检查 → DeliveryReadyToDispatch → 配送员分配策略 → CourierAssigned
 *
 * 设计为无环 DAG，且每个事件均有生产者：校验结果应为 0 错误 / 0 警告。
 */
export const sampleProject: OntologyProject = {
  version: '1.0',
  name: '合同管理系统',
  objects: [
    {
      id: 'Contract',
      name: '合同',
      description: '合同聚合根，覆盖合同全生命周期',
      identity: 'contractNo',
      attributes: [
        { name: 'contractNo', type: 'string', required: true, description: '合同号' },
        { name: 'customerId', type: 'reference', required: true, description: '客户ID（引用 Customer）' },
        { name: 'salesRep', type: 'string', required: true, description: '销售负责人' },
        { name: 'amount', type: 'decimal', required: true, description: '合同金额' },
        { name: 'currency', type: 'enum', required: true, description: 'CNY/USD/EUR' },
        { name: 'status', type: 'enum', required: true, description: '草稿/待审批/已审批/生效' },
        { name: 'productType', type: 'enum', required: true, description: '实物/服务' },
        { name: 'signedDate', type: 'date', required: false, description: '签订日期' },
      ],
      entities: [
        {
          id: 'PaymentTerm',
          name: '付款条款',
          identity: 'seq',
          attributes: [
            { name: 'seq', type: 'number', required: true, description: '条款序号' },
            { name: 'ratio', type: 'decimal', required: true, description: '付款比例' },
            { name: 'amount', type: 'decimal', required: true, description: '付款金额' },
            { name: 'dueDate', type: 'date', required: true, description: '付款期限' },
          ],
        },
        {
          id: 'ContractItem',
          name: '产品明细',
          identity: 'itemId',
          attributes: [
            { name: 'itemId', type: 'string', required: true, description: '明细ID' },
            { name: 'productId', type: 'reference', required: true, description: '产品ID（引用）' },
            { name: 'productName', type: 'string', required: false, description: '产品名（冗余展示）' },
            { name: 'quantity', type: 'number', required: true, description: '数量' },
            { name: 'price', type: 'decimal', required: true, description: '单价' },
            { name: 'subtotal', type: 'decimal', required: true, description: '小计' },
          ],
        },
      ],
      valueObjects: [
        {
          id: 'ShippingAddress',
          name: '收货地址',
          attributes: [
            { name: 'province', type: 'string', required: true },
            { name: 'city', type: 'string', required: true },
            { name: 'detail', type: 'string', required: true },
            { name: 'contact', type: 'string', required: true },
            { name: 'phone', type: 'string', required: true },
          ],
        },
      ],
      invariants: [
        { id: 'inv_amount', expression: 'amount == sum(items.subtotal)', description: '合同金额=所有明细小计之和' },
        { id: 'inv_subtotal', expression: 'item.subtotal == item.quantity * item.price', description: '每条明细小计=数量×单价' },
        { id: 'inv_pay', expression: 'sum(paymentTerms.amount) == amount', description: '付款金额之和=合同金额' },
        { id: 'inv_items', expression: 'count(items) >= 1', description: '至少包含一个产品明细' },
      ],
      references: [
        { targetObjectId: 'Customer', refField: 'customerId', description: '引用客户聚合' },
      ],
    },
    {
      id: 'Customer',
      name: '客户',
      description: '客户聚合根（独立演进），承载信用额度',
      identity: 'customerId',
      attributes: [
        { name: 'customerId', type: 'string', required: true, description: '客户ID' },
        { name: 'name', type: 'string', required: true, description: '客户名称' },
        { name: 'creditLimit', type: 'decimal', required: true, description: '信用额度' },
        { name: 'creditUsed', type: 'decimal', required: true, description: '已用信用额度' },
        { name: 'contactInfo', type: 'string', required: false, description: '联系方式' },
      ],
      entities: [],
      valueObjects: [],
      invariants: [
        { id: 'inv_credit', expression: 'creditUsed <= creditLimit', description: '已用信用不得超过信用额度' },
      ],
      references: [],
    },
    {
      id: 'Invoice',
      name: '开票计划',
      description: '开票计划聚合根，按付款条款生成',
      identity: 'invoiceNo',
      attributes: [
        { name: 'invoiceNo', type: 'string', required: true, description: '开票计划号' },
        { name: 'contractNo', type: 'reference', required: true, description: '引用合同' },
        { name: 'amount', type: 'decimal', required: true, description: '开票金额' },
        { name: 'dueDate', type: 'date', required: true, description: '应开票日期' },
        { name: 'status', type: 'enum', required: true, description: '待开票/已开票' },
      ],
      entities: [],
      valueObjects: [],
      invariants: [
        { id: 'inv_invoice_amount', expression: 'amount > 0', description: '开票金额必须为正' },
      ],
      references: [
        { targetObjectId: 'Contract', refField: 'contractNo', description: '引用合同聚合' },
      ],
    },
    {
      id: 'Delivery',
      name: '配送单',
      description: '配送单聚合根',
      identity: 'deliveryNo',
      attributes: [
        { name: 'deliveryNo', type: 'string', required: true, description: '配送单号' },
        { name: 'contractNo', type: 'reference', required: true, description: '引用合同' },
        { name: 'courierId', type: 'string', required: true, description: '配送员' },
        { name: 'status', type: 'enum', required: true, description: '配送中/已完成' },
        { name: 'eta', type: 'datetime', required: false, description: '预计送达时间' },
      ],
      entities: [],
      valueObjects: [],
      invariants: [],
      references: [
        { targetObjectId: 'Contract', refField: 'contractNo', description: '引用合同聚合' },
      ],
    },
  ],
  behaviors: [
    {
      id: 'CreateContract',
      name: '录入合同',
      description: '销售录入合同基本信息、付款条款与产品明细',
      objectRef: 'Contract',
      preconditions: ['客户存在', '至少一条产品明细'],
      postconditions: ['生成草稿状态合同'],
      appliedRuleRefs: ['AmountCalcRule'],
      producedEventRefs: ['ContractCreated'],
      subscribedEventRefs: [],
    },
    {
      id: 'SubmitForApproval',
      name: '提交审批',
      objectRef: 'Contract',
      preconditions: ['合同状态为草稿'],
      postconditions: ['合同状态置为待审批'],
      appliedRuleRefs: [],
      producedEventRefs: ['ContractSubmitted'],
      subscribedEventRefs: ['ContractCreated'],
    },
    {
      id: 'ApproveContract',
      name: '审批合同',
      description: '审批人审批，先做信用风控检查',
      objectRef: 'Contract',
      preconditions: ['合同状态为待审批'],
      postconditions: ['合同状态置为已审批', '记录审批人与时间'],
      appliedRuleRefs: ['CreditCheckRule'],
      producedEventRefs: ['ContractApproved'],
      subscribedEventRefs: ['ContractSubmitted'],
    },
    {
      id: 'ActivateContract',
      name: '激活合同',
      objectRef: 'Contract',
      preconditions: ['合同状态为已审批'],
      postconditions: ['合同状态置为生效', '记录生效时间'],
      appliedRuleRefs: [],
      producedEventRefs: ['ContractActivated'],
      subscribedEventRefs: ['ContractApproved'],
    },
    {
      id: 'CreateInvoicePlan',
      name: '创建开票计划',
      objectRef: 'Invoice',
      preconditions: ['合同已生效'],
      postconditions: ['根据付款条款生成开票计划'],
      appliedRuleRefs: [],
      producedEventRefs: ['InvoicePlanCreated'],
      subscribedEventRefs: ['ContractActivated'],
    },
    {
      id: 'IssueInvoice',
      name: '开具发票',
      objectRef: 'Invoice',
      preconditions: ['开票计划存在', '到达应开票日'],
      postconditions: ['开具发票', '开票计划状态置为已开票'],
      appliedRuleRefs: [],
      producedEventRefs: ['InvoiceIssued'],
      subscribedEventRefs: ['InvoicePlanCreated'],
    },
    {
      id: 'CreateDelivery',
      name: '创建配送单',
      objectRef: 'Delivery',
      preconditions: ['已分配配送员'],
      postconditions: ['创建配送单', '状态置为配送中'],
      appliedRuleRefs: [],
      producedEventRefs: ['DeliveryCreated'],
      subscribedEventRefs: ['CourierAssigned'],
    },
    {
      id: 'ConfirmDelivery',
      name: '确认收货',
      objectRef: 'Delivery',
      preconditions: ['配送单状态为配送中'],
      postconditions: ['状态置为已完成', '记录签收时间'],
      appliedRuleRefs: [],
      producedEventRefs: ['DeliveryCompleted'],
      subscribedEventRefs: [],
    },
  ],
  events: [
    {
      id: 'ContractCreated',
      name: '合同已创建',
      payload: [{ name: 'contractNo', type: 'string', required: true }],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'ContractSubmitted',
      name: '合同提交审批',
      payload: [{ name: 'contractNo', type: 'string', required: true }],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'ContractApproved',
      name: '合同已审批',
      payload: [
        { name: 'contractNo', type: 'string', required: true },
        { name: 'approver', type: 'string', required: true },
      ],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'ContractActivated',
      name: '合同激活',
      payload: [
        { name: 'contractNo', type: 'string', required: true },
        { name: 'productType', type: 'enum', required: true },
      ],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'InvoicePlanCreated',
      name: '开票计划已创建',
      payload: [
        { name: 'invoiceNo', type: 'string', required: true },
        { name: 'dueDate', type: 'date', required: true },
      ],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'InvoiceIssued',
      name: '发票已开具',
      payload: [{ name: 'invoiceNo', type: 'string', required: true }],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'DeliveryReadyToDispatch',
      name: '配送就绪',
      description: '由配送条件检查规则触发',
      payload: [
        { name: 'contractNo', type: 'string', required: true },
        { name: 'productType', type: 'enum', required: true },
      ],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'CourierAssigned',
      name: '配送员已分配',
      description: '由配送员分配规则触发',
      payload: [
        { name: 'contractNo', type: 'string', required: true },
        { name: 'courierId', type: 'string', required: true },
        { name: 'eta', type: 'datetime', required: false },
      ],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'DeliveryCreated',
      name: '配送单已创建',
      payload: [{ name: 'deliveryNo', type: 'string', required: true }],
      deliverySemantics: 'AT_LEAST_ONCE',
    },
    {
      id: 'DeliveryCompleted',
      name: '配送已完成',
      payload: [{ name: 'deliveryNo', type: 'string', required: true }],
      deliverySemantics: 'BEST_EFFORT',
    },
  ],
  rules: [
    {
      id: 'AmountCalcRule',
      name: '金额计算规则',
      description: '计算规则：录入合同时自动核算明细小计与合同金额',
      type: 'calculation',
      condition: 'item.subtotal = item.quantity * item.price; contract.amount = sum(items.subtotal)',
    },
    {
      id: 'CreditCheckRule',
      name: '信用检查规则',
      description: '风控规则：审批前同步校验客户信用',
      type: 'risk',
      condition: 'customer.creditUsed + contract.amount <= customer.creditLimit',
    },
  ],
  policies: [
    {
      id: 'DeliveryConditionCheck',
      name: '配送条件检查策略',
      description: '事件驱动策略：智能决策节点，判断是否需要并可以配送',
      subscribedEventRefs: ['ContractActivated'],
      condition: '产品类型为实物 且 配送区域存在空闲配送员',
      triggeredEventRefs: ['DeliveryReadyToDispatch'],
    },
    {
      id: 'CourierAssignmentPolicy',
      name: '配送员分配策略',
      description: '事件驱动策略：策略链下一环，按负载与就近原则分配配送员',
      subscribedEventRefs: ['DeliveryReadyToDispatch'],
      condition: '按配送员当前负载与区域就近分配，输出 courierId 与预计送达时间',
      triggeredEventRefs: ['CourierAssigned'],
    },
  ],
}

/** 空白项目 */
export function emptyProject(): OntologyProject {
  return {
    version: '1.0',
    name: '未命名本体',
    objects: [],
    behaviors: [],
    events: [],
    rules: [],
    policies: [],
  }
}
