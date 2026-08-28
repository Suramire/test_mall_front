import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { getToken } from '@mall/web-kit';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/sso/callback',
    name: 'SsoCallback',
    component: () => import('@/views/sso/callback.vue'),
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
        meta: { title: '工作台', perm: 'DASHBOARD' },
      },
      {
        path: 'change-password',
        name: 'ChangePassword',
        component: () => import('@/views/change-password/index.vue'),
        meta: { title: '修改密码' },
      },
      {
        path: 'goods/list',
        name: 'GoodsList',
        component: () => import('@/views/goods/list.vue'),
        meta: { title: '商品管理', perm: 'GOODS_LIST' },
      },
      {
        path: 'goods/new',
        name: 'GoodsCreate',
        component: () => import('@/views/goods/edit.vue'),
        meta: { title: '新增商品', perm: 'GOODS_CREATE' },
      },
      {
        path: 'goods/:id/edit',
        name: 'GoodsEdit',
        component: () => import('@/views/goods/edit.vue'),
        meta: { title: '编辑商品', perm: 'GOODS_EDIT' },
      },
      {
        path: 'goods/:id/detail',
        name: 'GoodsDetail',
        component: () => import('@/views/goods/detail.vue'),
        meta: { title: '商品详情', perm: 'GOODS_LIST' },
      },
      {
        path: 'goods/category',
        name: 'Category',
        component: () => import('@/views/goods/category.vue'),
        meta: { title: '商品分类', perm: 'CATEGORY_MANAGE' },
      },
      {
        path: 'goods/freight',
        name: 'Freight',
        component: () => import('@/views/goods/freight.vue'),
        meta: { title: '运费模板', perm: 'FREIGHT_MANAGE' },
      },
      { path: 'orders', name: 'Orders', component: () => import('@/views/orders/index.vue'), meta: { title: '订单管理', perm: 'ORDER_LIST' } },
      { path: 'verify', name: 'Verify', component: () => import('@/views/verify/index.vue'), meta: { title: '核销管理', perm: 'VERIFY_LOG' } },
      { path: 'members', name: 'Members', component: () => import('@/views/members/index.vue'), meta: { title: '会员积分', perm: 'MEMBER_LIST' } },
      { path: 'shop', name: 'Shop', component: () => import('@/views/shop/index.vue'), meta: { title: '店铺设置', perm: 'SHOP_MANAGE' } },
      { path: 'store', name: 'Store', component: () => import('@/views/store/index.vue'), meta: { title: '门店管理', perm: 'STORE_MANAGE' } },
      { path: 'points-rule', name: 'PointsRule', component: () => import('@/views/points-rule/index.vue'), meta: { title: '积分规则', perm: 'POINTS_MANAGE' } },
      { path: 'points-log', name: 'PointsLog', component: () => import('@/views/points-log/index.vue'), meta: { title: '积分日志', perm: 'POINTS_MANAGE' } },
      { path: 'levels', component: () => import('@/views/levels/index.vue'), meta: { title: '等级设置', perm: 'POINTS_MANAGE' } },
      { path: 'staff', component: () => import('@/views/staff/index.vue'), meta: { title: '员工管理', perm: 'STAFF_MANAGE' } },
      { path: 'roles', component: () => import('@/views/roles/index.vue'), meta: { title: '角色权限', perm: 'ROLE_MANAGE' } },
      { path: 'messages', component: () => import('@/views/messages/index.vue'), meta: { title: '消息配置', perm: 'MESSAGE_MANAGE' } },
      { path: 'orders/:id', component: () => import('@/views/orders/detail.vue'), meta: { title: '订单详情', perm: 'ORDER_LIST' } },
      { path: 'verify/manual', component: () => import('@/views/verify/manual.vue'), meta: { title: '手动核销', perm: 'VERIFY_LOG' } },
      { path: 'members/:id', component: () => import('@/views/members/detail.vue'), meta: { title: '会员详情', perm: 'MEMBER_LIST' } },
      { path: 'refunds', component: () => import('@/views/refunds/index.vue'), meta: { title: '退款审核', perm: 'ORDER_LIST' } },
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
  if (!to.meta.public) {
    const userStore = useUserStore();
    if (!userStore.user) {
      return userStore.fetchMe().then(() => {
        return userStore.hasPerm(to.meta.perm as string | undefined) ? true : { path: '/dashboard' };
      }).catch(() => {
        userStore.logout();
        return { path: '/login' };
      });
    }
    if (!userStore.hasPerm(to.meta.perm as string | undefined)) {
      return { path: '/dashboard' };
    }
  }
  return true;
});

export default router;
