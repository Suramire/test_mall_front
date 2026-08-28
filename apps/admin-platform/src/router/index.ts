import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { getToken } from '@mall/web-kit';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', perm: 'PF_DASHBOARD' },
      },
      {
        path: 'merchant/list',
        name: 'MerchantList',
        component: () => import('@/views/merchant/list.vue'),
        meta: { title: '商家列表', perm: 'PF_MERCHANT_LIST' },
      },
      { path: 'tenant/list', name: 'TenantList', component: () => import('@/views/tenant/list.vue'), meta: { title: '租户管理', perm: 'PF_MERCHANT_LIST' } },
      {
        path: 'merchant/new',
        name: 'MerchantCreate',
        component: () => import('@/views/merchant/edit.vue'),
        meta: { title: '新增商家', perm: 'PF_MERCHANT_EDIT' },
      },
      {
        path: 'merchant/:id/edit',
        name: 'MerchantEdit',
        component: () => import('@/views/merchant/edit.vue'),
        meta: { title: '编辑商家', perm: 'PF_MERCHANT_EDIT' },
      },
      {
        path: 'merchant/:id/detail',
        name: 'MerchantDetail',
        component: () => import('@/views/merchant/detail.vue'),
        meta: { title: '商家详情', perm: 'PF_MERCHANT_LIST' },
      },
      {
        path: 'system/role',
        name: 'Role',
        component: () => import('@/views/system/role.vue'),
        meta: { title: '角色权限', perm: 'PF_ROLE' },
      },
      {
        path: 'system/staff',
        name: 'Staff',
        component: () => import('@/views/system/staff.vue'),
        meta: { title: '员工管理', perm: 'PF_STAFF' },
      },
      {
        path: 'system/message',
        name: 'Message',
        component: () => import('@/views/system/message.vue'),
        meta: { title: '消息模板', perm: 'PF_MSG_TEMPLATE' },
      },
      {
        path: 'system/audit',
        name: 'Audit',
        component: () => import('@/views/system/audit.vue'),
        meta: { title: '审计日志', perm: 'PF_AUDIT_LOG' },
      },
      {
        path: 'change-password',
        name: 'ChangePassword',
        component: () => import('@/views/change-password/index.vue'),
        meta: { title: '修改密码' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = getToken();
  if (!to.meta.public && !token) {
    return { path: '/login' };
  }
  if (to.path === '/login' && token) {
    return { path: '/dashboard' };
  }
  const requiredPerm = to.meta.perm as string | undefined;
  if (requiredPerm) {
    const user = useUserStore();
    if (!user.hasPerm(requiredPerm)) {
      ElMessage.warning('当前账号无权访问该页面');
      return { path: '/dashboard' };
    }
  }
  return true;
});

export default router;
