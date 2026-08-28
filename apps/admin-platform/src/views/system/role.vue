<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><el-button type="primary" @click="openCreate">新增角色</el-button></template>
    <el-table :data="rows" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="角色名" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column label="系统内置" width="100"><template #default="{ row }"><el-tag :type="row.isSystem ? 'warning' : 'info'">{{ row.isSystem ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column prop="userCount" label="用户数" width="90" />
      <el-table-column label="操作" width="280"><template #default="{ row }"><el-button link type="primary" @click="viewPerms(row.id)">查看权限</el-button><el-button link @click="openEdit(row)">编辑</el-button><el-button v-if="!row.isSystem" link type="danger" :loading="deleting===row.id" @click="remove(row)">删除</el-button></template></el-table-column>
    </el-table>
  </el-card>
  <el-dialog v-model="permOpen" title="角色权限" width="520px"><el-skeleton v-if="permLoading" :rows="4" animated/><el-alert v-else-if="permError" :title="permError" type="error" show-icon/><el-empty v-else-if="!perms.length" description="暂无权限"/><el-space v-else wrap><el-tag v-for="p in perms" :key="p" :title="p">{{readableLabel(p)}}</el-tag></el-space></el-dialog>
  <el-dialog v-model="editOpen" :title="editId?'编辑角色':'新增角色'"><el-form :model="form"><el-form-item label="名称"><el-input v-model="form.name"/></el-form-item><el-form-item label="备注"><el-input v-model="form.remark"/></el-form-item><el-form-item label="权限"><el-select v-model="form.perms" multiple><el-option v-for="p in permOptions" :key="p" :label="readableLabel(p)" :value="p"/></el-select></el-form-item></el-form><template #footer><el-button @click="editOpen=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template></el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { roleApi } from '@/api';

const loading = ref(false);
const rows = ref<any[]>([]);
const permOpen=ref(false),permLoading=ref(false),perms=ref<string[]>([]),permError=ref('');
const editOpen=ref(false),saving=ref(false),deleting=ref<number|undefined>(),editId=ref<number|undefined>();const form=ref<any>({name:'',remark:'',perms:[]});const permOptions=ref<string[]>([]);
const permNames:Record<string,string>={PF_ROLE:'角色权限',ROLE:'角色权限',PF_STAFF:'员工管理',STAFF:'员工管理',PF_MERCHANT_LIST:'商家列表',MERCHANT_LIST:'商家列表',PF_MERCHANT_EDIT:'商家编辑',MERCHANT_EDIT:'商家编辑',PF_MERCHANT_STATUS:'商家状态管理',MERCHANT_STATUS:'商家状态管理',PF_MERCHANT_IMPERSONATE:'商家代客登录',MERCHANT_IMPERSONATE:'商家代客登录',PF_MERCHANT_RESET_PWD:'商家密码重置',MERCHANT_RESET_PWD:'商家密码重置',PF_FEATURE_EDIT:'功能开通管理',FEATURE_EDIT:'功能开通管理',PF_STAFF_RESET_PWD:'员工密码重置',STAFF_RESET_PWD:'员工密码重置',PF_AUDIT_LOG:'审计日志',AUDIT_LOG:'审计日志',PF_DASHBOARD:'数据概览',DASHBOARD:'数据概览',PF_MSG_TEMPLATE:'消息模板',MSG_TEMPLATE:'消息模板'};
function normalizeCode(code:string){return code.replace(/^PF_/,'');}
function readableLabel(code:string){const n=normalizeCode(code);return permNames[code]||permNames[n]||permNames[`PF_${n}`]||`未配置（${code}）`;}
function openCreate(){editId.value=undefined;form.value={name:'',remark:'',perms:[]};editOpen.value=true} function openEdit(r:any){editId.value=r.id;form.value={name:r.name||'',remark:r.remark||'',perms:r.perms||[]};editOpen.value=true} async function save(){if(!form.value.name)return ElMessage.warning('请输入角色名');saving.value=true;try{if(editId.value)await roleApi.update(editId.value,form.value);else await roleApi.create(form.value);ElMessage.success('保存成功');editOpen.value=false;await load()}catch(e:any){ElMessage.error(e?.message||'保存失败')}finally{saving.value=false}}
async function load() {
  loading.value = true;
  try { const r:any = await roleApi.list(); const d=r?.data||r; rows.value = d?.list || d?.items || (Array.isArray(d)?d:[]); rows.value=rows.value.map((x:any)=>({...x,perms:Array.isArray(x.perms)?x.perms:[]})); } catch(e:any){ ElMessage.error(e?.message || '角色加载失败'); } finally { loading.value = false; }
}
async function viewPerms(id: number) {
  permOpen.value=true; permLoading.value=true; permError.value=''; const row:any=rows.value.find(x=>x.id===id); perms.value=Array.isArray(row?.perms)?row.perms:[]; try { const r:any = await roleApi.perms(id); const p:any=r?.perms||r?.data||r||[]; if(Array.isArray(p)) perms.value=p; } catch(e:any){ ElMessage.warning('权限详情暂不可用，已展示缓存权限'); } finally { permLoading.value=false; }
}
async function remove(row:any) { try { await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '删除角色', { type:'warning' }); deleting.value=row.id; await roleApi.remove(row.id); ElMessage.success('角色已删除'); await load(); } catch(e:any) { if(e !== 'cancel' && e !== 'close') ElMessage.error(e?.message || '删除失败'); } finally { deleting.value=undefined; } }
onMounted(async()=>{await load();try{const r:any=await roleApi.permTree();const d=r?.data??r;const list=d?.list??d?.items??d;permOptions.value=Array.isArray(list)?list:[]}catch(e:any){permOptions.value=[];ElMessage.error(e?.message||'权限树加载失败')}});
</script>
