<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>积分日志</span>
        <div class="filters">
          <input ref="importInput" type="file" accept=".csv" hidden @change="importCsv" /><el-button @click="importInput?.click()">导入CSV</el-button><el-button @click="exportCsv">导出CSV</el-button>
          <el-input v-model="batchId" placeholder="批次ID" style="width:100px" /><el-button @click="queryBatch">查询批次</el-button>
          <el-input
            v-model.number="memberId"
            clearable
            placeholder="会员ID"
            style="width: 160px"
            @keyup.enter="load"
          />
          <el-button :loading="loading" @click="load">查询</el-button>
        </div>
      </div>
    </template>
    <el-alert v-if="error" :title="error" type="error" show-icon />
    <el-empty v-else-if="!loading && !rows.length" description="暂无积分流水" />
    <el-table v-else :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="memberId" label="会员ID" width="100" />
      <el-table-column label="变更积分" width="110"
        ><template #default="{ row }"
          ><span :class="Number(row.amount) >= 0 ? 'plus' : 'minus'">{{
            row.amount
          }}</span></template
        ></el-table-column
      >
      <el-table-column prop="balanceAfter" label="变更后余额" width="120" />
      <el-table-column label="类型" width="140"><template #default="{ row }">{{ pointsChangeTypeLabel(row.changeType || row.type) }}</template></el-table-column>
      <el-table-column prop="remark" label="备注" min-width="180" />
      <el-table-column prop="createdAt" label="时间" min-width="180" />
    </el-table>
    <el-card v-if="batch" class="batch"><div>批次 {{batch.batchId}}：{{batch.status}}，总数 {{batch.total}}，成功 {{batch.success}}，失败 {{batch.fail}}</div><el-table v-if="batch.failDetail?.length" :data="batch.failDetail"><el-table-column prop="row" label="行号"/><el-table-column prop="message" label="失败原因"/></el-table></el-card>
  </el-card>
</template>

<script setup lang="ts">
const pointsChangeTypeLabel = (s?: string) => ({ EARN: '获得', CONSUME: '消费', ADJUST: '调整', ADD: '增加', SUB: '扣减', SET: '设置' } as Record<string, string>)[s || ''] || (s ? `未配置（${s}）` : '-');
import { onMounted, ref } from "vue";
import { pointsLogApi } from "@/api";
import axios from 'axios';

const loading = ref(false);
const rows = ref<any[]>([]);
const memberId = ref<number | undefined>();
const error = ref("");
const importInput = ref<HTMLInputElement>(); const importLoading = ref(false); const batch = ref<any>(); const batchId=ref(''); let lastFile=''; let lastKey='';
async function queryBatch(){if(!batchId.value)return;try{const r:any=await axios.get(`/api/mc/points/import/${batchId.value}`,{headers:{Authorization:`Bearer ${localStorage.getItem('mc_access_token')||''}`}});batch.value=r.data?.data||r.data}catch(e:any){error.value=e?.response?.data?.message||e?.message||'批次查询失败'}}
async function exportCsv(){try{const r:any=await axios.get('/api/mc/points/export',{responseType:'blob'});const a=document.createElement('a');a.href=URL.createObjectURL(r.data);a.download='points.csv';a.click()}catch(e:any){error.value=e?.message||'导出失败'}}
async function importCsv(e:Event){const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;const sig=f.name+':'+f.size+':'+f.lastModified;if(sig!==lastFile){lastFile=sig;lastKey=crypto.randomUUID()}const body=new FormData();body.append('file',f);importLoading.value=true;try{const r:any=await axios.post('/api/mc/points/import',body,{headers:{'Idempotency-Key':lastKey,Authorization:`Bearer ${localStorage.getItem('mc_access_token')||''}`}});batch.value=r.data?.data||r.data;batchId.value=String(batch.value?.batchId||'');await load();}catch(x:any){error.value=x?.response?.data?.message||x?.message||'导入失败'}finally{importLoading.value=false;(e.target as HTMLInputElement).value=''}}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const params = memberId.value ? { memberId: memberId.value } : undefined;
    const response: any = await pointsLogApi.list(params);
    const d = response?.data ?? response;
    const list = d?.list ?? d?.items ?? d?.data ?? d;
    rows.value = Array.isArray(list) ? list : [];
  } catch (e: any) {
    rows.value = [];
    error.value =
      e?.response?.data?.message || e?.message || "积分日志加载失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filters {
  display: flex;
  align-items: center;
  gap: 8px;
}
.plus {
  color: #67c23a;
}
.minus {
  color: #f56c6c;
}
</style>
