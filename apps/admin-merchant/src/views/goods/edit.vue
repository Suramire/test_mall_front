<template>
  <el-card shadow="never"><el-alert v-if="error" :title="error" type="error" show-icon />
    <template #header>{{ isEdit ? '编辑商品' : '新增商品' }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" v-loading="loading">
      <el-divider content-position="left">基础信息</el-divider>
      <el-form-item label="商品名称" prop="name">
        <el-input v-model="form.name" placeholder="商品名称" />
      </el-form-item>
      <el-form-item label="副标题"><el-input v-model="form.subtitle" placeholder="副标题" /></el-form-item>
      <el-form-item label="虚拟销量"><el-input-number v-model="form.virtualSold" :min="0" /></el-form-item>
      <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
      <el-form-item label="商品详情"><el-input v-model="form.detail" type="textarea" :rows="4" placeholder="图文详情（支持文本/HTML）" /></el-form-item>
      <template v-if="form.type === 'VIRTUAL'"><el-form-item label="发放说明"><el-input v-model="form.virtualDeliveryDesc" type="textarea" /></el-form-item></template>
      <el-form-item label="限兑数量"><el-input-number v-model="form.purchaseLimit" :min="0" /><span class="hint">0 表示不限</span></el-form-item>
      <el-form-item label="商品类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio value="PHYSICAL">实体</el-radio>
          <el-radio value="VIRTUAL">虚拟</el-radio>
          <el-radio value="TICKET">核销券</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="销售渠道" prop="channel">
        <el-radio-group v-model="form.channel">
          <el-radio value="NORMAL">普通商城</el-radio>
          <el-radio value="POINTS">积分商城</el-radio>
          <el-radio value="BOTH">双渠道</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="普通分类" v-if="form.channel !== 'POINTS'">
        <el-select v-model="form.normalCategoryId" placeholder="选择" clearable style="width: 240px">
          <el-option v-for="c in normalCates" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="积分分类" v-if="form.channel !== 'NORMAL'">
        <el-select v-model="form.pointsCategoryId" placeholder="选择" clearable style="width: 240px">
          <el-option v-for="c in pointsCates" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="主图">
        <el-input v-model="form.mainImage" placeholder="https://..." />
        <input type="file" accept="image/*" @change="onImage" />
        <el-image v-if="form.mainImage" :src="form.mainImage" style="width:60px;height:60px" fit="cover" />
      </el-form-item>
      <el-form-item label="图册"><input type="file" accept="image/*" multiple @change="onGallery" /><el-space wrap><template v-for="(url,i) in form.images" :key="url"><el-image :src="url" style="width:60px;height:60px" fit="cover" /><el-button link type="danger" @click="form.images.splice(i,1)">删除</el-button></template></el-space></el-form-item>
      <el-form-item label="运费模板">
        <el-select v-model="form.freightTemplateId" placeholder="选择" clearable style="width: 240px">
          <el-option v-for="f in freights" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品详情">
        <el-input v-model="form.detail" type="textarea" :rows="3" placeholder="详情 HTML" />
      </el-form-item>

      <template v-if="form.type === 'TICKET'">
        <el-divider content-position="left">核销券配置</el-divider>
        <el-form-item label="有效期类型">
          <el-select v-model="form.ticketConfig.validType" style="width: 240px">
            <el-option label="付款后 N 天" value="DAYS_AFTER_PAY" />
            <el-option label="固定日期" value="FIXED_DATE" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效天数" v-if="form.ticketConfig.validType === 'DAYS_AFTER_PAY'">
          <el-input-number v-model="form.ticketConfig.validDays" :min="1" />
        </el-form-item>
        <el-form-item label="固定截止日期" v-if="form.ticketConfig.validType === 'FIXED_DATE'"><el-date-picker v-model="form.ticketConfig.validEndDate" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="适用门店">
          <el-input v-model="ticketStores" placeholder="逗号分隔门店ID，如 1,2" />
        </el-form-item>
        <el-form-item label="核销说明">
          <el-input v-model="form.ticketConfig.verifyDesc" placeholder="到店出示核销码" />
        </el-form-item>
        <el-form-item label="过期退款策略"><el-select v-model="form.ticketConfig.expireRefundPolicy"><el-option label="全额现金" value="FULL_CASH"/><el-option label="全额积分" value="FULL_POINTS"/><el-option label="按比例退款" value="PRORATE"/><el-option label="不退款" value="NONE"/></el-select></el-form-item>
      </template>

      <el-divider content-position="left">SKU 与双渠道库存</el-divider>
      <el-form-item label="启用多规格">
        <el-switch v-model="form.hasSku" />
      </el-form-item>
      <el-form-item label="规格项" v-if="form.hasSku">
        <div v-for="(sp, i) in form.specConfig" :key="i" class="spec-row">
          <el-input v-model="sp.name" placeholder="规格名，如 颜色" style="width: 160px" />
          <el-input v-model="sp.valuesText" placeholder="值用逗号分隔，如 红,蓝" style="width: 220px" @input="syncSpecValues(sp)" />
          <el-button type="danger" link @click="form.specConfig.splice(i, 1)">删除</el-button>
        </div>
        <el-button @click="form.specConfig.push({ name: '', values: [], valuesText: '' })">+ 添加规格</el-button>
      </el-form-item>

      <el-table :data="form.skus" border class="sku-table">
        <el-table-column label="规格" min-width="160">
          <template #default="{ row }">{{ specLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="SKU 编码" width="160">
          <template #default="{ row }"><el-input v-model="row.skuCode" size="small" /></template>
        </el-table-column>
        <el-table-column label="售价" width="120">
          <template #default="{ row }"><el-input v-model="row.price" size="small" /></template>
        </el-table-column>
        <el-table-column label="原价" width="120">
          <template #default="{ row }"><el-input v-model="row.originalPrice" size="small" /></template>
        </el-table-column>
        <template v-if="form.channel !== 'NORMAL'">
          <el-table-column label="积分" width="100">
            <template #default="{ row }"><el-input v-model="row.points" size="small" /></template>
          </el-table-column>
          <el-table-column label="现金" width="100">
            <template #default="{ row }"><el-input v-model="row.cash" size="small" /></template>
          </el-table-column>
        </template>
        <el-table-column label="普通库存" width="160">
          <template #default="{ row }" v-if="form.channel !== 'POINTS'">
            <el-input-number v-model="stockFor(row, 'NORMAL').totalStock" :min="0" size="small" />
            <div class="warn"><span>预警</span><el-input-number v-model="stockFor(row, 'NORMAL').warnStock" :min="0" size="small" /></div>
          </template>
        </el-table-column>
        <el-table-column label="积分库存" width="160" v-if="form.channel !== 'NORMAL'">
          <template #default="{ row }">
            <el-input-number v-model="stockFor(row, 'POINTS').totalStock" :min="0" size="small" />
            <div class="warn"><span>预警</span><el-input-number v-model="stockFor(row, 'POINTS').warnStock" :min="0" size="small" /></div>
          </template>
        </el-table-column>
      </el-table>

      <el-form-item style="margin-top: 20px">
        <el-button type="primary" :loading="submitting" @click="onSubmit">{{ isEdit ? '保存' : '创建' }}</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import {
 type GoodsSpecOption, type GoodsSku, type CategoryNode, type FreightTemplate, type SalesChannel,
} from '@mall/shared-types';
import { goodsDetail, goodsCreate, goodsUpdate, categoryList, freightList, uploadImage } from '@/api';

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);
const error = ref('');
const submitting = ref(false);
const id = route.params.id ? Number(route.params.id) : null;
const isEdit = computed(() => id !== null);

const normalCates = ref<CategoryNode[]>([]);
const pointsCates = ref<CategoryNode[]>([]);
const freights = ref<FreightTemplate[]>([]);
const ticketStores = ref('');
const uploadLoading = ref(false);
async function uploadFiles(files: FileList | null, gallery = false) { if (!files?.length || uploadLoading.value) return; const allowed = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024); if (allowed.length !== files.length) { ElMessage.warning('仅支持5MB以内图片'); } uploadLoading.value=true; try { const urls = await Promise.all(allowed.map(uploadImage)); if (gallery) form.images.push(...urls.filter(Boolean)); else form.mainImage = urls[0] || form.mainImage; } catch(e:any) { ElMessage.error(e?.response?.data?.message || e?.message || '图片上传失败'); } finally { uploadLoading.value=false; } }
function onImage(e: Event) { void uploadFiles((e.target as HTMLInputElement).files); }
function onGallery(e: Event) { void uploadFiles((e.target as HTMLInputElement).files, true); }
function specLabel(row:any){const s=row?.specJson||{};if(Object.keys(s).length)return Object.values(s).join(' / ');return row?.specText||'默认'}
function stockFor(row:any, channel:SalesChannel){row.stocks ||= [];let s=row.stocks.find((x:any)=>x.channel===channel);if(!s){s={channel,totalStock:0,warnStock:0};row.stocks.push(s)}return s}

function emptySku(channel = 'NORMAL'): GoodsSku {
  const stocks = [] as GoodsSku['stocks'];
  if (channel !== 'POINTS') stocks.push({ channel: 'NORMAL', totalStock: 0, warnStock: 0 });
  if (channel !== 'NORMAL') stocks.push({ channel: 'POINTS', totalStock: 0, warnStock: 0 });
  return { specJson: {}, skuCode: '', price: '0.00', originalPrice: '0.00', priceMode: 'CASH', points: 0, cash: '0.00', weight: 0, stocks };
}

const form = reactive<any>({
  name: '',
  subtitle: '', detail: '',
  virtualSold: 0, sort: 0,
  purchaseLimit: 0, virtualDeliveryDesc: '',
  type: 'PHYSICAL',
  channel: 'NORMAL',
  normalCategoryId: undefined,
  pointsCategoryId: undefined,
  mainImage: '',
  images: [],

  hasSku: true,
  specConfig: [],
  freightTemplateId: undefined,
  skus: [emptySku('NORMAL')],
  ticketConfig: { validType: 'DAYS_AFTER_PAY', validDays: 30, verifyStoreIds: [], verifyDesc: '', expireRefundPolicy: 'FULL_CASH' },
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  channel: [{ required: true, message: '请选择渠道', trigger: 'change' }],
};

function syncSpecValues(sp: GoodsSpecOption & { valuesText: string }) {
  sp.values = (sp.valuesText || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  rebuildSkus();
}
function rebuildSkus() {
  const specs = form.specConfig.filter((s:any) => s.name && s.values.length);
  if (!specs.length) { form.skus = [emptySku()]; return; }
  const combos: Record<string, string>[] = [{}];
  for (const sp of specs) {
    const next: Record<string, string>[] = [];
    for (const c of combos) for (const v of sp.values) next.push({ ...c, [sp.name]: v });
    combos.length = 0; combos.push(...next);
  }
  form.skus = combos.map((c, i) => {
    const s = emptySku();
    s.specJson = c;
    s.skuCode = 'SKU' + (10086000 + i + 1);
    return s;
  });
}
function goBack() { router.push('/goods/list'); }

async function onSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  if (form.type === 'TICKET') {
    if (form.ticketConfig.validType === 'FIXED_DATE' && !form.ticketConfig.validEndDate) return ElMessage.warning('请选择固定截止日期');
    form.ticketConfig.verifyStoreIds = ticketStores.value.split(/[,，]/).map((s) => Number(s.trim())).filter(Boolean);
  }
  submitting.value = true;
  try {
    if (isEdit.value && id) {
      await goodsUpdate(id, { ...form });
      ElMessage.success('已保存');
    } else {
      await goodsCreate({ ...form });
      ElMessage.success('已创建');
    }
    router.push('/goods/list');
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '提交失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  const [nc, pc, fr] = await Promise.all([categoryList('NORMAL'), categoryList('POINTS'), freightList()]);
  normalCates.value = nc; pointsCates.value = pc; freights.value = fr;
  if (isEdit.value && id) {
    loading.value = true;
    try {
      const d: any = await goodsDetail(id);
      Object.assign(form, {
        name: d.name, subtitle: d.subtitle || '', virtualSold: d.virtualSold ?? 0, sort: d.sort ?? 0, purchaseLimit: d.purchaseLimit ?? 0, virtualDeliveryDesc: d.virtualDeliveryDesc || '', type: d.type, channel: d.channel,
        normalCategoryId: d.categoryId, mainImage: d.mainImage, detail: d.detail || '',
        skus: d.skus || [emptySku()], ticketConfig: d.ticketConfig || form.ticketConfig,
      });
      if (d.ticketConfig) ticketStores.value = d.ticketConfig.verifyStoreIds.join(',');
    } finally { loading.value = false; }
  }
});
</script>

<style scoped>
.spec-row { display: flex; gap: 10px; margin-bottom: 8px; align-items: center; }
.sku-table { margin-top: 8px; }
.warn { font-size: 12px; color: #909399; display: flex; align-items: center; gap: 4px; margin-top: 4px; }
</style>
