<template>
  <el-container class="basic-layout">
    <el-aside width="236px" class="layout-aside">
      <div class="logo">
        <span class="logo-mark">M</span>
        <span class="logo-copy"><strong>商城 SaaS</strong><small>平台运营中心</small></span>
      </div>
      <el-menu :default-active="activeMenu" router class="layout-menu" background-color="transparent" text-color="#aebbd7" active-text-color="#fff">
        <el-menu-item v-if="user.hasPerm('PF_DASHBOARD')" index="/dashboard"><el-icon><DataLine /></el-icon><span>数据概览</span></el-menu-item>
        <el-sub-menu index="merchant">
          <template #title><el-icon><Shop /></el-icon><span>商家管理</span></template>
          <el-menu-item v-if="user.hasPerm('PF_MERCHANT_LIST')" index="/merchant/list">商家列表</el-menu-item>
          <el-menu-item v-if="user.hasPerm('PF_MERCHANT_LIST')" index="/tenant/list">租户管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="system">
          <template #title><el-icon><Setting /></el-icon><span>系统</span></template>
          <el-menu-item v-if="user.hasPerm('PF_ROLE')" index="/system/role">角色权限</el-menu-item>
          <el-menu-item v-if="user.hasPerm('PF_STAFF')" index="/system/staff">员工管理</el-menu-item>
          <el-menu-item v-if="user.hasPerm('PF_MSG_TEMPLATE')" index="/system/message">消息模板</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/change-password"><el-icon><Lock /></el-icon><span>修改密码</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-heading"><span class="header-kicker">平台管理</span><div class="header-title">{{ title }}</div></div>
        <div class="header-user">
          <el-dropdown @command="onCommand">
            <span class="user-trigger"><span class="user-avatar">{{ (user.userInfo?.name || '管理员').slice(0, 1) }}</span><span>{{ user.userInfo?.name || '管理员' }}</span><el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="pwd">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { DataLine, Shop, Setting, Lock, ArrowDown } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { clearToken } from '@mall/web-kit';

const route = useRoute();
const router = useRouter();
const user = useUserStore();

const activeMenu = computed(() => route.path);
const title = computed(() => (route.meta.title as string) || '平台管理');

function onCommand(cmd: string) {
  if (cmd === 'logout') {
    clearToken();
    user.logout();
    router.replace('/login');
  } else if (cmd === 'pwd') {
    router.push('/change-password');
  }
}
void ElMessage;
</script>

<style scoped>
.basic-layout { min-height: 100vh; background: var(--color-canvas); }
.layout-aside { position: relative; z-index: 2; overflow: hidden; background: linear-gradient(180deg, #111b35 0%, #0b1430 100%); color: #fff; box-shadow: 8px 0 30px rgba(15, 23, 42, .08); }
.logo { display: flex; align-items: center; gap: 11px; min-height: 76px; padding: 0 22px; border-bottom: 1px solid rgba(255, 255, 255, .08); }
.logo-mark { width: 34px; height: 34px; border-radius: 11px; background: linear-gradient(135deg, #60a5fa, #2563eb); display: grid; place-items: center; font-weight: 800; box-shadow: 0 8px 18px rgba(37, 99, 235, .34); }
.logo-copy { display: grid; gap: 1px; line-height: 1.25; }.logo-copy strong { font-size: 15px; letter-spacing: .2px; }.logo-copy small { color: #aebbd7; font-size: 11px; }
.layout-menu { padding: 14px 10px; border-right: none; }
.layout-menu :deep(.el-menu-item), .layout-menu :deep(.el-sub-menu__title) { height: 44px; margin: 3px 0; border-radius: 9px; font-weight: 500; }
.layout-menu :deep(.el-menu-item:hover), .layout-menu :deep(.el-sub-menu__title:hover) { background: rgba(255, 255, 255, .08) !important; }
.layout-menu :deep(.el-menu-item.is-active) { background: linear-gradient(90deg, rgba(37, 99, 235, .95), rgba(59, 130, 246, .72)) !important; box-shadow: 0 6px 14px rgba(0, 0, 0, .16); }
.layout-menu :deep(.el-sub-menu .el-menu) { background: transparent !important; }.layout-menu :deep(.el-sub-menu .el-menu-item) { min-width: 0; margin-left: 8px; }
.layout-header { height: 76px; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; background: rgba(255, 255, 255, .92); border-bottom: 1px solid var(--color-border); backdrop-filter: blur(14px); }
.header-heading { display: grid; gap: 1px; }.header-kicker { color: var(--color-text-tertiary); font-size: 11px; letter-spacing: .08em; }.header-title { color: var(--color-text); font-size: 18px; font-weight: 700; }
.user-trigger { cursor: pointer; display: inline-flex; align-items: center; gap: 8px; padding: 6px 9px 6px 6px; border-radius: var(--radius-pill); color: var(--color-text-secondary); transition: background var(--transition-base); }.user-trigger:hover { background: #f1f5f9; }
.user-avatar { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; color: #1d4ed8; background: #dbeafe; font-size: 12px; font-weight: 700; }
.layout-main { padding: 28px 30px; background: var(--color-canvas); }
@media (max-width: 960px) { .layout-aside { width: 72px !important; } .logo { justify-content: center; padding: 0; } .logo-copy { display: none; } .layout-menu { padding: 14px 8px; } .layout-menu :deep(.el-menu-item span), .layout-menu :deep(.el-sub-menu__title span), .layout-menu :deep(.el-sub-menu__icon-arrow) { display: none; } .layout-menu :deep(.el-menu-item), .layout-menu :deep(.el-sub-menu__title) { justify-content: center; padding: 0 !important; } .layout-main { padding: 20px; } }
@media (max-width: 640px) { .layout-header { height: 64px; padding: 0 16px; } .layout-main { padding: 16px; } .header-kicker { display: none; } .header-title { font-size: 16px; } }
</style>
