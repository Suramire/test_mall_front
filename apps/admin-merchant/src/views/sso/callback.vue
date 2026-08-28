<template>
  <div class="sso-page">
    <el-card class="sso-card">
      <el-result v-if="state === 'done'" icon="success" title="代客登录成功" :sub-title="tenantName + '（代客态）'">
        <template #extra>
          <el-button type="primary" @click="goDashboard">进入工作台</el-button>
        </template>
      </el-result>
      <el-result v-else-if="state === 'error'" icon="error" title="代客登录失败" :sub-title="errorMsg">
        <template #extra>
          <el-button @click="goLogin">返回登录</el-button>
        </template>
      </el-result>
      <div v-else class="loading">
        <el-icon class="is-loading" :size="28"><Loading /></el-icon>
        <p>正在通过平台代客凭证登录…</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const state = ref<'loading' | 'done' | 'error'>('loading');
const tenantName = ref('');
const errorMsg = ref('');

function goDashboard() {
  router.replace('/dashboard');
}
function goLogin() {
  router.replace('/login');
}

onMounted(async () => {
  const ticket = (route.query.ticket as string) || '';
  if (!ticket) {
    state.value = 'error';
    errorMsg.value = '缺少 ticket 参数';
    return;
  }
  try {
    await userStore.exchangeSso(ticket);
    tenantName.value = userStore.tenant?.name || '';
    state.value = 'done';
    ElMessage.success('已以代客身份登录');
  } catch (e: unknown) {
    state.value = 'error';
    errorMsg.value = e instanceof Error ? e.message : '凭证校验失败';
  }
});
</script>

<style scoped>
.sso-page { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5; }
.sso-card { width: 420px; }
.loading { text-align: center; padding: 30px 0; color: #606266; }
</style>
