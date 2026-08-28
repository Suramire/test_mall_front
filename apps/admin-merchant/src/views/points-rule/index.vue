<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>积分规则</span>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </div>
    </template>
    <el-form v-loading="loading" :model="form" label-width="120px" style="max-width: 520px">
      <el-form-item label="消费金额">
        <el-input-number v-model="form.earnAmount" :min="0" :precision="2" />
      </el-form-item>
      <el-form-item label="获得积分">
        <el-input-number v-model="form.earnPoints" :min="0" :precision="0" />
      </el-form-item>
      <el-form-item label="过期方式">
        <el-select v-model="form.expireMode">
          <el-option label="不过期" value="NEVER" />
          <el-option label="按月过期" value="MONTHS" />
        </el-select>
      </el-form-item>
      <el-form-item label="有效月份" v-if="form.expireMode === 'MONTHS'">
        <el-input-number v-model="form.expireMonths" :min="1" :precision="0" />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { pointsRuleApi } from '@/api';

const loading = ref(false);
const saving = ref(false);
const form = ref({ earnAmount: 1, earnPoints: 1, expireMode: 'NEVER', expireMonths: 12 });

async function load() {
  loading.value = true;
  try {
    const data: any = await pointsRuleApi.get();
    form.value = {
      earnAmount: Number(data.earnAmount ?? 1),
      earnPoints: Number(data.earnPoints ?? 1),
      expireMode: data.expireMode || 'NEVER',
      expireMonths: Number(data.expireMonths ?? 12),
    };
  } catch (e: any) {
    ElMessage.error(e?.message || '积分规则加载失败');
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  saving.value = true;
  try {
    await pointsRuleApi.update({ ...form.value, earnAmount: String(form.value.earnAmount) });
    ElMessage.success('保存成功');
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>
