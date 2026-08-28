<template>
  <el-card v-loading="loading"
    ><template #header><div class="head">核销记录<el-button @click="load">刷新</el-button></div></template
    ><el-form inline><el-form-item label="券码"><el-input v-model="query.code" clearable /></el-form-item><el-form-item label="门店"><el-input v-model="query.storeId" clearable /></el-form-item><el-button type="primary" @click="page=1;load()">查询</el-button><el-button @click="exportLogs">导出</el-button></el-form
    ><el-alert v-if="error" :title="error" type="error" show-icon /><el-empty
      v-else-if="!loading && !rows.length"
      description="暂无核销记录"
    /><el-table v-else :data="rows"
      ><el-table-column label="订单号"
        ><template #default="s">{{
          s.row.orderNo || "-"
        }}</template></el-table-column
      ><el-table-column label="商品"
        ><template #default="s">{{
          s.row.goodsName || "-"
        }}</template></el-table-column
      ><el-table-column label="会员"
        ><template #default="s">{{
          s.row.memberName || "-"
        }}</template></el-table-column
      ><el-table-column label="券码"
        ><template #default="s">{{
          s.row.code || "-"
        }}</template></el-table-column
      ><el-table-column label="状态"
        ><template #default="s">{{
          ({ UNUSED: "未核销", VERIFIED: "已核销" } as any)[s.row.status] ||
          s.row.status ||
          "-"
        }}</template></el-table-column
      ><el-table-column label="核销时间"
        ><template #default="s">{{
          s.row.verifiedAt || "-"
        }}</template></el-table-column
      ></el-table><el-pagination v-model:current-page="page" v-model:page-size="size" :total="total" :page-sizes="[20,50,100]" layout="total,sizes,prev,pager,next" @current-change="load" @size-change="page=1;load()" />
    ></el-card
  >
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ElMessage } from "element-plus";
import { verifyApi } from "@/api";
const rows = ref<any[]>([]),
  loading = ref(false),
  error = ref(""), page = ref(1), size = ref(20), total = ref(0);
const query = reactive({ code: "", storeId: "" });
async function load() {
  loading.value = true;
  try {
    const r: any = await verifyApi.logs({ ...query, page: page.value, size: size.value });
    const d = r?.data ?? r;
    const list = d?.list ?? d?.items ?? d?.data ?? d;
    rows.value = Array.isArray(list) ? list : [];
    total.value = Number(d?.total ?? rows.value.length);
  } catch (e: any) {
    error.value =
      e?.response?.data?.message || e?.message || "核销记录加载失败";
  } finally {
    loading.value = false;
  }
}
onMounted(load);
async function exportLogs() { try { const r:any = await verifyApi.logs({...query, export:true}); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([r.data||r],{type:'text/csv'})); a.download='verify-logs.csv'; a.click(); URL.revokeObjectURL(a.href); } catch(e:any) { ElMessage.error(e?.message||'导出失败'); } }
</script>
