<template>
  <el-tree
    ref="treeRef"
    :data="treeData"
    :props="treeProps"
    show-checkbox
    node-key="key"
    :default-checked-keys="checkedKeys"
    :default-expanded-keys="expandedKeys"
    :check-strictly="false"
    @check="onCheck"
  >
    <template #default="{ data }">
      <span class="ft-node">
        <span>{{ data.label }}</span>
        <span v-if="data.code" class="ft-node__code">{{ data.code }}</span>
      </span>
    </template>
  </el-tree>
</template>

<script setup lang="ts">
/**
 * 通用权限/功能树组件
 * - 三级树（模块→分组→叶子），父子联动
 * - indeterminate 半选态（el-tree 原生支持）
 * - 对外暴露 getCheckedFeatureCodes() 收集叶子勾选
 */
import { ref, onMounted } from 'vue';
import type { ElTree } from 'element-plus';
import type { FeatureTreeNode } from '@mall/shared-types';

interface TreeItem {
  key: string;
  label: string;
  code?: string;
  children?: TreeItem[];
}

const props = defineProps<{
  data: FeatureTreeNode[]; // 后端返回的模块树
  checkedCodes?: string[]; // 当前已勾选的 feature_code[]
}>();

const emit = defineEmits<{
  (e: 'change', checkedCodes: string[]): void;
}>();

const treeRef = ref<InstanceType<typeof ElTree>>();
const treeData = ref<TreeItem[]>([]);
const checkedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);

// 把后端模块树转换成 el-tree 需要的结构，叶子带唯一 key
function buildTree(nodes: FeatureTreeNode[], parentKey = ''): TreeItem[] {
  return nodes.map((node, index) => {
    const key = parentKey ? `${parentKey}-${index}` : `m-${index}`;
    const item: TreeItem = {
      key,
      label: node.name,
    };
    if (node.code) item.code = node.code;
    if (node.children?.length) {
      item.children = buildTree(node.children, key);
    }
    return item;
  });
}

function collectLeafKeys(nodes: TreeItem[], acc: string[] = []): string[] {
  nodes.forEach((n) => {
    if (n.children?.length) collectLeafKeys(n.children, acc);
    else if (n.key) acc.push(n.key);
  });
  return acc;
}

// 遍历叶子，找到对应 code 的 key
function findKeyByCode(nodes: TreeItem[], code: string): string | null {
  for (const n of nodes) {
    if (n.code === code) return n.key;
    if (n.children?.length) {
      const found = findKeyByCode(n.children, code);
      if (found) return found;
    }
  }
  return null;
}

onMounted(() => {
  treeData.value = buildTree(props.data);
  // 默认展开所有一级模块
  expandedKeys.value = treeData.value.map((n) => n.key);

  // 回显已勾选：根据 checkedCodes 找到叶子 key
  const keys = (props.checkedCodes || [])
    .map((code) => findKeyByCode(treeData.value, code))
    .filter((k): k is string => !!k);
  checkedKeys.value = keys;
});

function onCheck() {
  // 收集所有勾选叶子（含半选父级过滤：只取叶子 code）
  const leafKeys = new Set(collectLeafKeys(treeData.value));
  const checked = treeRef.value?.getCheckedKeys(false) as string[];
  const codes = (props.data.length ? [] : []) as string[];
  // 通过 leaf key → code 映射收集
  const codeMap = new Map<string, string>();
  collectCodes(treeData.value, codeMap);
  checked.forEach((key) => {
    if (leafKeys.has(key)) {
      const code = codeMap.get(key);
      if (code) codes.push(code);
    }
  });
  emit('change', codes);
}

function collectCodes(nodes: TreeItem[], map: Map<string, string>) {
  nodes.forEach((n) => {
    if (n.code) map.set(n.key, n.code);
    if (n.children?.length) collectCodes(n.children, map);
  });
}

const treeProps = {
  children: 'children',
  label: 'label',
};

defineExpose({
  /** 获取当前勾选的 feature_code[] */
  getCheckedFeatureCodes: (): string[] => {
    const codes: string[] = [];
    collectCodes(treeData.value, new Map());
    const codeMap = new Map<string, string>();
    collectCodes(treeData.value, codeMap);
    const checked = treeRef.value?.getCheckedKeys(false) as string[];
    checked.forEach((key) => {
      const code = codeMap.get(key);
      if (code) codes.push(code);
    });
    return codes;
  },
});
</script>

<style scoped>
.ft-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ft-node__code {
  font-size: 12px;
  color: #999;
}
</style>
