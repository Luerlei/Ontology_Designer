<script setup lang="ts">
import { useProjectStore } from '../stores/project'
import type { ValidationIssue } from '../services/validation'

const store = useProjectStore()

function goTo(issue: ValidationIssue) {
  if (issue.kind && issue.ref) store.select(issue.kind, issue.ref)
}
</script>

<template>
  <div class="val-panel">
    <div class="summary">
      <span class="badge err">{{ store.errorCount }} 错误</span>
      <span class="badge warn">{{ store.warningCount }} 警告</span>
    </div>
    <ul v-if="store.issues.length" class="list">
      <li
        v-for="(issue, i) in store.issues"
        :key="i"
        :class="['issue', issue.level]"
        @click="goTo(issue)"
      >
        <span class="lvl">{{ issue.level === 'error' ? '✖' : '!' }}</span>
        <span class="msg">{{ issue.message }}</span>
        <span v-if="issue.kind" class="tag">{{ issue.kind }}</span>
      </li>
    </ul>
    <p v-else class="ok">✓ 校验通过，没有发现问题。</p>
  </div>
</template>

<style scoped>
.val-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.summary {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}
.badge.err {
  background: #fee2e2;
  color: #b91c1c;
}
.badge.warn {
  background: #fef3c7;
  color: #b45309;
}
.list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow: auto;
  flex: 1;
}
.issue {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.issue:hover {
  background: #f1f5f9;
}
.issue .lvl {
  width: 16px;
  text-align: center;
  font-weight: 700;
}
.issue.error .lvl {
  color: #dc2626;
}
.issue.warning .lvl {
  color: #d97706;
}
.issue .msg {
  flex: 1;
}
.issue .tag {
  font-size: 11px;
  color: #64748b;
  background: #e2e8f0;
  border-radius: 4px;
  padding: 1px 6px;
}
.ok {
  padding: 16px;
  color: #16a34a;
  font-size: 13px;
}
</style>
