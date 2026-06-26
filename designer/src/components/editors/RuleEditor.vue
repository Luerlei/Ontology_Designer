<script setup lang="ts">
import type { RuleModel } from '../../metamodel/types'
import { RULE_TYPES } from '../../metamodel/naming'

defineProps<{ model: RuleModel }>()
</script>

<template>
  <div class="editor">
    <div class="grid2">
      <label class="field"><span>id</span><input v-model="model.id" /></label>
      <label class="field"><span>名称</span><input v-model="model.name" /></label>
      <label class="field">
        <span>规则类型</span>
        <select v-model="model.type">
          <option v-for="t in RULE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </label>
      <label class="field"><span>描述</span><input v-model="model.description" /></label>
    </div>

    <section>
      <h4>条件判断</h4>
      <textarea v-model="model.condition" rows="2" placeholder="例如：产品类型为实物 且 存在空闲配送员" />
    </section>
    <p class="hint">规则模型为纯规则；事件订阅/触发逻辑已拆分到「策略模型 POLICY」。</p>
  </div>
</template>

<style scoped>
@import './editor.css';
textarea {
  width: 100%;
  resize: vertical;
  font-family: inherit;
}
.hint {
  color: #94a3b8;
  font-size: 13px;
}
</style>
