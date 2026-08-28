<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>店铺设置</span>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </div>
    </template>
    <el-form v-loading="loading" :model="form" label-width="100px" style="max-width: 600px">
      <el-form-item label="店铺名称">
        <el-input v-model="form.name" placeholder="请输入店铺名称" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="店铺Logo">
        <el-input v-model="form.logo" placeholder="Logo URL" />
        <input type="file" accept="image/*" @change="uploadLogo" /><el-image v-if="form.logo" :src="form.logo" style="width:60px;height:60px" />
      </el-form-item>
      <el-form-item label="店铺公告">
        <el-input v-model="form.notice" type="textarea" :rows="3" placeholder="请输入店铺公告" />
      </el-form-item>
      <el-form-item label="店铺简介">
        <el-input v-model="form.intro" type="textarea" :rows="4" placeholder="请输入店铺简介" />
      </el-form-item>
      <el-form-item label="轮播图">
        <el-input v-model="bannersText" type="textarea" :rows="2" placeholder="每行一个 URL，逗号分隔" />
        <input type="file" accept="image/*" multiple @change="uploadBanners" /><el-space wrap><template v-for="(b,i) in form.banners" :key="b"><el-image :src="b" style="width:60px;height:60px" /><el-button link type="danger" @click="form.banners.splice(i,1)">删除</el-button></template></el-space>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { shopApi, uploadImage } from '@/api';

const loading = ref(false);
const saving = ref(false);
const uploadLoading = ref(false);
async function uploadLogo(e:Event){const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;await uploadFiles([f],false)}
async function uploadBanners(e:Event){const fs=(e.target as HTMLInputElement).files;if(fs)await uploadFiles(Array.from(fs),true)}
async function uploadFiles(fs:File[],gallery:boolean){const ok=fs.filter(f=>f.type.startsWith('image/')&&f.size<=5*1024*1024);if(ok.length!==fs.length){ElMessage.warning('仅支持5MB以内图片')}if(uploadLoading.value)return;uploadLoading.value=true;try{const urls=await Promise.all(ok.map(uploadImage));if(gallery)form.value.banners.push(...urls.filter(Boolean));else form.value.logo=urls[0]||form.value.logo}catch(e:any){ElMessage.error(e?.message||'图片上传失败')}finally{uploadLoading.value=false}}
const form = ref({ name: '', phone: '', logo: '', notice: '', intro: '', banners: '' as any });

const bannersText = computed({
  get: () => Array.isArray(form.value.banners) ? form.value.banners.join(',') : (form.value.banners || ''),
  set: (v: string) => { form.value.banners = v ? v.split(',').map(s => s.trim()).filter(Boolean) : []; },
});

async function load() {
  loading.value = true;
  try {
    const response: any = await shopApi.get();
    const envelope = response?.data ?? response;
    const data = envelope?.data && typeof envelope.data === 'object' ? envelope.data : envelope;
    form.value = { name: data.name || '', phone: data.phone || '', logo: data.logo || '', notice: data.notice || '', intro: data.intro || '', banners: data.banners || [] };
  } catch (e: any) {
    ElMessage.error(e?.message || '店铺信息加载失败');
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  saving.value = true;
  try {
    await shopApi.update(form.value);
    ElMessage.success('保存成功');
    await load();
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
