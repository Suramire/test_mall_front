<template>
  <div class="merchant-edit">
    <el-page-header @back="router.back()" :content="isEdit ? '编辑商家' : '新增商家'" />
    <el-card shadow="never" class="mt">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" style="max-width: 720px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="商家名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="联系人" prop="contactName"><el-input v-model="form.contactName" /></el-form-item>
        <el-form-item label="联系电话" prop="contactPhone"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item label="资质"><el-input v-model="form.qualification" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" style="width: 200px"><el-option v-for="(label, val) in STATUS_LABEL" :key="val" :label="label" :value="val" /></el-select>
        </el-form-item>
        <el-form-item label="到期时间" prop="expireAt"><el-date-picker v-model="form.expireAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>

        <el-divider content-position="left">配额</el-divider>
        <el-form-item label="商品上限"><el-input-number v-model="form.goodsLimit" :min="0" /></el-form-item>
        <el-form-item label="会员上限"><el-input-number v-model="form.memberLimit" :min="0" /></el-form-item>
        <el-form-item label="门店上限"><el-input-number v-model="form.storeLimit" :min="0" /></el-form-item>
        <el-form-item label="员工上限"><el-input-number v-model="form.staffLimit" :min="0" /></el-form-item>

        <el-divider content-position="left">小程序配置</el-divider>
        <el-form-item label="小程序AppID"><el-input v-model="form.wxAppid" placeholder="wx 开头，选填" /></el-form-item>
        <el-form-item label="小程序Secret"><el-input v-model="form.wxSecret" type="password" show-password placeholder="选填" /></el-form-item>

        <template v-if="!isEdit">
          <el-divider content-position="left">管理员账号</el-divider>
          <el-form-item label="管理员账号" prop="adminAccount"><el-input v-model="form.adminAccount" /></el-form-item>
          <el-form-item label="管理员姓名" prop="adminName"><el-input v-model="form.adminName" /></el-form-item>
          <el-form-item label="管理员手机" prop="adminPhone"><el-input v-model="form.adminPhone" /></el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSubmit">{{ isEdit ? '保存' : '创建' }}</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { merchantApi } from '@/api';
import type { TenantStatus } from '@/types';

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const saving = ref(false);
const isEdit = computed(() => !!route.params.id);

const STATUS_LABEL: Record<TenantStatus, string> = { NORMAL: '正常', TRIAL: '试用中', EXPIRED: '已到期', DISABLED: '已禁用' };

const form = reactive({
  name: '', contactName: '', contactPhone: '', qualification: '',
  status: 'TRIAL' as TenantStatus, expireAt: '', remark: '',
  goodsLimit: 500, memberLimit: 10000, storeLimit: 10, staffLimit: 50,
  wxAppid: '', wxSecret: '',
  adminAccount: '', adminName: '', adminPhone: '', features: [] as string[],
});

/** 管理员账号/姓名/手机仅开户时提交（PUT 不含这三个字段），编辑态不作必填校验 */
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  contactName: [{ required: true, message: '必填', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '必填', trigger: 'blur' }],
  adminAccount: [{ required: !isEdit.value, message: '必填', trigger: 'blur' }],
  adminName: [{ required: !isEdit.value, message: '必填', trigger: 'blur' }],
  adminPhone: [{ required: !isEdit.value, message: '必填', trigger: 'blur' }],
  expireAt: [{ required: true, message: '请选择到期时间', trigger: 'change' }],
}));

async function onSubmit() {
  // 校验不通过时直接返回，避免继续发请求
  const ok = await formRef.value?.validate().then(() => true).catch(() => false);
  if (ok === false) return;
  saving.value = true;
  try {
    if (isEdit.value) {
      await merchantApi.update(Number(route.params.id), form);
      ElMessage.success('已保存');
    } else {
      const r = await merchantApi.create(form);
      ElMessage.success(`创建成功，租户号 ${r.tenantNo}，初始密码 ${r.adminInitPassword}`);
    }
    router.replace('/merchant/list');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const d = await merchantApi.detail(Number(route.params.id));
    Object.assign(form, {
      name: d.name, contactName: d.contactName, contactPhone: d.contactPhone,
      qualification: d.qualification ?? '', remark: d.remark ?? '',
      status: d.status, expireAt: d.expireAt ? d.expireAt.slice(0, 10) : '',
      goodsLimit: d.goodsLimit, memberLimit: d.memberLimit,
      storeLimit: d.storeLimit, staffLimit: d.staffLimit,
      wxAppid: d.wxAppid ?? '',
    });
  }
});
</script>

<style scoped>
.mt { margin-top: 16px; }
</style>
