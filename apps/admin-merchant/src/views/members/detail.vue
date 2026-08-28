<template>
  <div v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" show-icon />
    <el-card shadow="never">
      <template #header>会员详情</template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="会员编号">{{
          detail?.memberNo || id
        }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{
          detail?.nickname || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail?.phone || detail?.phoneMask || "-" }} <el-button v-if="!detail?.phone" link type="primary" :loading="phoneLoading" @click="showPhone">查看</el-button></el-descriptions-item>
        <el-descriptions-item label="等级">{{
          detail?.levelName || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="积分余额">{{
          detail?.pointsBalance ?? "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="入会时间">{{
          detail?.joinedAt || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="累计消费"
          >¥{{ detail?.totalAmount || "0.00" }}</el-descriptions-item
        >
        <el-descriptions-item label="累计订单">{{
          detail?.totalOrderCount ?? 0
        }}</el-descriptions-item>
      </el-descriptions>
      <div class="tags"><el-tag v-for="tag in tags" :key="tag" closable @close="tags=tags.filter(x=>x!==tag)">{{tag}}</el-tag><el-input v-model="tagInput" size="small" placeholder="输入标签后回车" @keyup.enter="addTag"/><el-button size="small" type="primary" :loading="tagSaving" @click="saveTags">保存标签</el-button></div>
    </el-card>

    <el-card shadow="never" class="mt">
      <template #header>消费记录</template>
      <el-table :data="orders" border>
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column label="金额" width="120"
          ><template #default="{ row }">{{
            row.amount || row.payAmount || "-"
          }}</template></el-table-column
        >
        <el-table-column label="状态" width="120"><template #default="{ row }">{{ orderStatusLabel(row.status) }}</template></el-table-column>
        <el-table-column prop="createdAt" label="下单时间" min-width="170" />
      </el-table>
    </el-card>

    <el-card shadow="never" class="mt">
      <template #header>积分明细</template>
      <el-table :data="pointsLog" border>
        <el-table-column prop="createdAt" label="时间" min-width="170" />
        <el-table-column label="变动类型" min-width="130"
          ><template #default="{ row }">{{
            changeTypeLabel(row.changeType || row.type)
          }}</template></el-table-column
        >
        <el-table-column label="积分数" width="120"
          ><template #default="{ row }">{{
            row.points ?? row.amount ?? row.change ?? "-"
          }}</template></el-table-column
        >
        <el-table-column label="余额" width="120"
          ><template #default="{ row }">{{
            row.balance ?? row.balanceAfter ?? row.afterBalance ?? "-"
          }}</template></el-table-column
        >
        <el-table-column prop="remark" label="备注" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const orderStatusLabel = (s?: string) => ({ PENDING_PAY: '待支付', PAID: '已支付', PENDING_SHIP: '待发货', SHIPPED: '已发货', COMPLETED: '已完成', CLOSED: '已关闭', REFUNDING: '退款中', REFUNDED: '已退款' } as Record<string, string>)[s || ''] || (s ? `未配置（${s}）` : '-');
const changeTypeLabel = (s?: string) => ({ EARN: '获得', CONSUME: '消费', ADJUST: '调整', ADD: '增加', SUB: '扣减', SET: '设置' } as Record<string, string>)[s || ''] || (s ? `未配置（${s}）` : '-');
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute } from "vue-router";
import { memberApi } from "@/api";

const id = Number(useRoute().params.id);
const detail = ref<any>();
const orders = ref<any[]>([]);
const pointsLog = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const tags=ref<string[]>([]),tagInput=ref(''),tagSaving=ref(false);
function addTag(){const v=tagInput.value.trim();if(!v)return;if(v.length>30)return ElMessage.warning('单个标签最多30字符');if(tags.value.includes(v))return ElMessage.warning('标签不可重复');if(tags.value.length>=20)return ElMessage.warning('最多20个标签');tags.value.push(v);tagInput.value='';}
async function saveTags(){if(tagSaving.value)return;tagSaving.value=true;try{await memberApi.updateTags(id,tags.value);ElMessage.success('标签已保存');const r:any=await memberApi.detail(id);detail.value=r?.data||r;tags.value=detail.value?.tags||tags.value}catch(e:any){ElMessage.error(e?.message||'标签保存失败')}finally{tagSaving.value=false}}
const phoneLoading = ref(false);
async function showPhone(){if(phoneLoading.value)return;try{await ElMessageBox.confirm('查看明文手机号将记录审计日志，是否继续？','隐私授权',{type:'warning'});phoneLoading.value=true;const r:any=await memberApi.phone(id);detail.value={...detail.value,phone:r?.data?.phone||r?.phone};}catch(e:any){if(e!=='cancel'&&e!=='close')ElMessage.error(e?.message||'手机号获取失败')}finally{phoneLoading.value=false}}
const normalize = (res: any) =>
  res?.data?.list ||
  res?.data?.items ||
  res?.list ||
  res?.items ||
  res?.data ||
  res ||
  [];

onMounted(async () => {
  loading.value = true;
  try {
    const [detailRes, orderRes, logRes] = await Promise.all([
      memberApi.detail(id),
      memberApi.orders(id).catch(() => []),
      memberApi.pointsLog(id).catch(() => []),
    ]);
    detail.value = (detailRes as any)?.data || detailRes;
    tags.value = Array.isArray(detail.value?.tags) ? detail.value.tags : [];
    orders.value = normalize(orderRes);
    pointsLog.value = normalize(logRes);
  } catch (e: any) {
    error.value = e?.message || "会员详情加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.mt {
  margin-top: 12px;
}
</style>
