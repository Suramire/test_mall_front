<template>
  <el-container class="basic-layout">
    <el-aside width="236px" class="aside">
      <div class="logo"><span class="logo-mark">M</span><span class="logo-copy"><strong>商城 SaaS</strong><small>商家经营中心</small></span></div>
      <el-menu :default-active="activeMenu" router class="menu" background-color="transparent" text-color="#aebbd7" active-text-color="#fff">
        <el-menu-item v-if="userStore.hasPerm('DASHBOARD')" index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('GOODS_LIST')" index="/goods/list">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('CATEGORY_MANAGE')" index="/goods/category"><span>商品分类</span></el-menu-item><el-menu-item v-if="userStore.hasPerm('FREIGHT_MANAGE')" index="/goods/freight"><span>运费模板</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('ORDER_LIST')" index="/orders"><span>订单管理</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('ORDER_LIST')" index="/refunds"><span>退款审核</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('VERIFY_LOG')" index="/verify"><span>核销管理</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('VERIFY_LOG')" index="/verify/manual"><span>手动核销</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('MEMBER_LIST')" index="/members"><span>会员积分</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('SHOP_MANAGE')" index="/shop"><span>店铺设置</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('STORE_MANAGE')" index="/store"><span>门店管理</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('POINTS_MANAGE')" index="/points-rule"><span>积分规则</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('POINTS_MANAGE')" index="/points-log"><span>积分日志</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('POINTS_MANAGE')" index="/levels"><span>等级设置</span></el-menu-item>
        <el-menu-item v-if="userStore.hasPerm('STAFF_MANAGE')" index="/staff"><span>员工管理</span></el-menu-item><el-menu-item v-if="userStore.hasPerm('ROLE_MANAGE')" index="/roles"><span>角色权限</span></el-menu-item><el-menu-item v-if="userStore.hasPerm('MESSAGE_MANAGE')" index="/messages"><span>消息配置</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-heading"><span class="header-kicker">商家管理</span><div class="title">{{ currentTitle }}</div></div>
        <div class="tenant-context" :class="{ 'tenant-error': !userStore.tenant }">
          <template v-if="userStore.tenant">
            <span>{{ userStore.impersonating ? '代客访问：' : '' }}{{ userStore.tenant.name || '未命名租户' }}</span>
            <span class="tenant-meta">租户号 {{ userStore.tenant.tenantNo || '-' }} · ID {{ userStore.tenant.id ?? '-' }}</span>
          </template>
          <span v-else>租户信息加载中…</span>
        </div>
        <div class="user">
          <el-tag v-if="userStore.impersonating" type="warning" size="small" effect="dark">代客态</el-tag>
          <el-dropdown @command="onCommand">
            <span class="user-name"><span class="user-avatar">{{ (userStore.user?.name || '商').slice(0, 1) }}</span>
              {{ userStore.user?.name }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePwd">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DataLine, ArrowDown, Goods } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { mcLogout } from '@/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);
const currentTitle = computed(() => (route.meta.title as string) || '工作台');

async function onCommand(cmd: string) {
  if (cmd === 'logout') {
    await mcLogout().catch(() => {});
    userStore.logout();
    router.push('/login');
  } else if (cmd === 'changePwd') {
    router.push('/change-password');
  }
}

if (!userStore.user) {
  userStore.fetchMe().catch(() => {
    userStore.logout();
    ElMessage.error('会话失效，请重新登录');
    router.push('/login');
  });
}
</script>

<style scoped>
.basic-layout { min-height: 100vh; background: var(--color-canvas); }
.aside { position: relative; z-index: 2; overflow: hidden; background: linear-gradient(180deg, #111b35 0%, #0b1430 100%); box-shadow: 8px 0 30px rgba(15, 23, 42, .08); }
.logo { min-height: 76px; display: flex; align-items: center; gap: 11px; padding: 0 22px; color: #fff; border-bottom: 1px solid rgba(255, 255, 255, .08); }.logo-mark { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: linear-gradient(135deg, #60a5fa, #2563eb); font-size: 15px; font-weight: 800; box-shadow: 0 8px 18px rgba(37, 99, 235, .34); }.logo-copy { display: grid; gap: 1px; line-height: 1.25; }.logo-copy strong { font-size: 15px; letter-spacing: .2px; }.logo-copy small { color: #aebbd7; font-size: 11px; }
.menu { padding: 14px 10px; border-right: none; }.menu :deep(.el-menu-item) { height: 44px; min-width: 0; margin: 3px 0; border-radius: 9px; font-weight: 500; }.menu :deep(.el-menu-item:hover) { background: rgba(255, 255, 255, .08) !important; }.menu :deep(.el-menu-item.is-active) { background: linear-gradient(90deg, rgba(37, 99, 235, .95), rgba(59, 130, 246, .72)) !important; box-shadow: 0 6px 14px rgba(0, 0, 0, .16); }
.header { height: 76px; display: flex; align-items: center; padding: 0 30px; background: rgba(255, 255, 255, .92); border-bottom: 1px solid var(--color-border); backdrop-filter: blur(14px); }.header-heading { display: grid; gap: 1px; margin-right: 24px; }.header-kicker { color: var(--color-text-tertiary); font-size: 11px; letter-spacing: .08em; }.title { color: var(--color-text); font-size: 18px; font-weight: 700; }
.tenant-context { flex: 1; display: flex; align-items: baseline; gap: 10px; min-width: 0; color: var(--color-text-secondary); font-size: 13px; }.tenant-meta { overflow: hidden; color: var(--color-text-tertiary); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }.tenant-error { color: var(--color-warning); }.user { display: flex; align-items: center; gap: 12px; }.user-name { cursor: pointer; display: inline-flex; align-items: center; gap: 8px; padding: 6px 9px 6px 6px; border-radius: var(--radius-pill); color: var(--color-text-secondary); outline: none; transition: background var(--transition-base); }.user-name:hover { background: #f1f5f9; }.user-avatar { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; color: #1d4ed8; background: #dbeafe; font-size: 12px; font-weight: 700; }
:deep(.el-main) { padding: 28px 30px; background: var(--color-canvas); }
@media (max-width: 960px) { .aside { width: 72px !important; } .logo { justify-content: center; padding: 0; } .logo-copy { display: none; } .menu { padding: 14px 8px; } .menu :deep(.el-menu-item span) { display: none; } .menu :deep(.el-menu-item) { justify-content: center; padding: 0 !important; } :deep(.el-main) { padding: 20px; } }
@media (max-width: 640px) { .header { height: 64px; padding: 0 16px; } .header-kicker, .tenant-meta { display: none; } .title { font-size: 16px; } .tenant-context { margin-left: 0; } :deep(.el-main) { padding: 16px; } }
</style>
