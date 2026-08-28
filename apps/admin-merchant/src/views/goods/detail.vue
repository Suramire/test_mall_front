<template>
  <div v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" show-icon />
    <el-card shadow="never" v-if="goods">
      <template #header>
        <div class="hd">
          <span>商品详情 #{{ goods.id }}</span>
          <div>
            <el-button @click="goEdit">编辑</el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="名称">{{
          goods.name
        }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{
          labelType(goods.type)
        }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{
          labelChannel(goods.channel)
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          labelStatus(goods.status)
        }}</el-descriptions-item>
        <el-descriptions-item label="售价"
          >¥{{ goods.price }}</el-descriptions-item
        >
        <el-descriptions-item label="总库存">{{
          goods.totalStock
        }}</el-descriptions-item>
        <el-descriptions-item label="主图" :span="2">
          <img :src="goods.mainImage" class="big-img" />
        </el-descriptions-item>
        <el-descriptions-item
          label="核销券配置"
          :span="2"
          v-if="goods.ticketConfig"
        >
          有效期：{{
            goods.ticketConfig.validType === "DAYS_AFTER_PAY"
              ? "付款后" + goods.ticketConfig.validDays + "天"
              : "固定日期"
          }}； 适用门店：{{
            goods.ticketConfig.verifyStoreIds.join(",")
          }}；说明：{{ goods.ticketConfig.verifyDesc }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">SKU 与双渠道库存</el-divider>
      <el-table :data="goods.skus || []" border>
        <el-table-column label="规格" min-width="160">
          <template #default="{ row }">{{ specLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="SKU 编码" prop="skuCode" width="160" />
        <el-table-column label="售价" width="100"
          ><template #default="{ row }"
            >¥{{ row.price }}</template
          ></el-table-column
        >
        <el-table-column label="普通库存" width="120"
          ><template #default="{ row }">{{
            stockOf(row, "NORMAL")
          }}</template></el-table-column
        >
        <el-table-column label="积分库存" width="120"
          ><template #default="{ row }">{{
            stockOf(row, "POINTS")
          }}</template></el-table-column
        >
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }"
            ><el-button link type="primary" @click="openStock(row)"
              >调整库存</el-button
            ></template
          >
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="stockVisible" title="库存调整" width="460px">
      <el-form v-if="activeSku" label-width="100px">
        <el-form-item label="SKU">{{ activeSku.skuCode }}</el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="stockForm.channel" style="width: 200px">
            <el-option
              v-if="goods && goods.channel !== 'POINTS'"
              label="普通商城"
              value="NORMAL"
            />
            <el-option
              v-if="goods && goods.channel !== 'NORMAL'"
              label="积分商城"
              value="POINTS"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调整方式">
          <el-select v-model="stockForm.changeType" style="width: 200px">
            <el-option label="入库(+)" value="ADD" />
            <el-option label="出库(-)" value="SUB" />
            <el-option label="设为" value="SET" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="stockForm.value" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockVisible = false">取消</el-button>
        <el-button type="primary" :loading="stockLoading" @click="submitStock"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>库存变更日志</template>
      <el-empty
        v-if="!logLoading && !stockLogs.length"
        description="暂无库存变更日志"
      />
      <el-table v-else :data="stockLogs" v-loading="logLoading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="skuId" label="SKU" width="120" />
        <el-table-column label="渠道" width="100"
          ><template #default="{ row }">{{
            labelChannel(row.channel)
          }}</template></el-table-column
        >
        <el-table-column label="类型" width="100"
          ><template #default="{ row }">{{
            stockChangeTypeLabel(row.changeType)
          }}</template></el-table-column
        >
        <el-table-column label="数量" width="80"
          ><template #default="s">{{
            s.row.value ?? s.row.change ?? "-"
          }}</template></el-table-column
        >
        <el-table-column label="变更后库存" width="120"
          ><template #default="s">{{
            s.row.afterStock ?? s.row.after ?? "-"
          }}</template></el-table-column
        >
        <el-table-column label="操作员" width="120"
          ><template #default="s">{{
            s.row.operator || s.row.operatorName || "-"
          }}</template></el-table-column
        >
        <el-table-column prop="createdAt" label="时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const stockChangeTypeLabel = (s?: string) => ({ ADD: '增加库存', SUB: '扣减库存', SET: '设置库存' } as Record<string, string>)[s || ''] || (s ? `未配置（${s}）` : '-');
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  type GoodsType,
  type GoodsStatus,
  type SalesChannel,
  type GoodsItem,
  type GoodsSku,
  type StockLogItem,
  type StockChangeType,
} from "@mall/shared-types";
import { goodsDetail, goodsStock, goodsStockLog } from "@/api";
function specLabel(row: any) {
  const s = row?.specJson || {};
  return Object.keys(s).length
    ? Object.values(s).join(" / ")
    : row?.specText || "默认";
}

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);
const loading = ref(false);
const error = ref("");
const goods = ref<GoodsItem | null>(null);

const labelType = (v: GoodsType) =>
  (
    ({ PHYSICAL: "实体", VIRTUAL: "虚拟", TICKET: "核销券" }) as Record<
      string,
      string
    >
  )[v] || v;
const labelChannel = (v: SalesChannel) =>
  (
    ({ NORMAL: "普通", POINTS: "积分", BOTH: "双渠道" }) as Record<
      string,
      string
    >
  )[v] || v;
const labelStatus = (v: GoodsStatus) =>
  (
    ({
      ON_SALE: "在售",
      OFF_SALE: "下架",
      SOLD_OUT: "售罄",
      DRAFT: "草稿",
    }) as Record<string, string>
  )[v] || v;
function stockOf(row: GoodsSku, ch: SalesChannel) {
  const s: any = row.stocks?.find((s) => s.channel === ch);
  return s?.totalStock ?? s?.availableStock ?? "-";
}

const stockVisible = ref(false);
const stockLoading = ref(false);
const activeSku = ref<GoodsSku | null>(null);
const stockForm = reactive<{
  channel: SalesChannel;
  changeType: StockChangeType;
  value: number;
}>({ channel: "NORMAL", changeType: "ADD", value: 1 });

const stockLogs = ref<StockLogItem[]>([]);
const logLoading = ref(false);

function openStock(row: GoodsSku) {
  activeSku.value = row;
  stockForm.channel = goods.value?.channel === "POINTS" ? "POINTS" : "NORMAL";
  stockForm.changeType = "ADD";
  stockForm.value = 1;
  stockVisible.value = true;
}
async function submitStock() {
  if (!activeSku.value) return;
  stockLoading.value = true;
  try {
    await goodsStock(id, [
      {
        skuId: activeSku.value.id || 0,
        channel: stockForm.channel,
        changeType: stockForm.changeType,
        value: stockForm.value,
      },
    ]);
    ElMessage.success("库存已调整");
    stockVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || "库存调整失败");
  } finally {
    stockLoading.value = false;
  }
}

function goEdit() {
  router.push("/goods/" + id + "/edit");
}
function goBack() {
  router.push("/goods/list");
}

async function load() {
  loading.value = true;
  logLoading.value = true;
  try {
    const [gResult, logResult] = await Promise.allSettled([
      goodsDetail(id),
      goodsStockLog(id),
    ]);
    if (gResult.status === "fulfilled") {
      const response: any = gResult.value;
      // 兼容 http 客户端返回 Axios 响应、业务 envelope 以及 data.detail/data.goods 多层结构。
      const envelope: any = response?.data ?? response;
      const payload: any = envelope?.data ?? envelope;
      const nested =
        payload && typeof payload === "object"
          ? payload.detail && typeof payload.detail === "object"
            ? payload.detail
            : payload.goods && typeof payload.goods === "object"
              ? payload.goods
              : payload
          : payload;
      goods.value = nested as GoodsItem;
      if (!goods.value?.id) throw new Error("商品详情数据为空");
    } else {
      throw gResult.reason;
    }
    if (logResult.status === "fulfilled") {
      const response: any = logResult.value;
      const envelope: any = response?.data ?? response;
      const payload: any = envelope?.data ?? envelope;
      const list = payload?.list ?? payload?.items ?? payload?.data ?? payload;
      stockLogs.value = Array.isArray(list) ? list : [];
    } else {
      stockLogs.value = [];
      ElMessage.warning(logResult.reason?.message || "库存日志加载失败");
    }
  } catch (e: any) {
    error.value =
      e?.response?.data?.message || e?.message || "商品详情加载失败";
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
    logLoading.value = false;
  }
}
onMounted(load);
</script>

<style scoped>
.hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.big-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
}
</style>
