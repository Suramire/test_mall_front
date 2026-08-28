<template>
  <el-card v-loading="loading"
    ><template #header
      ><el-button type="primary" @click="openCreate"
        >新增模板</el-button
      ></template
    ><el-table :data="rows" border
      ><el-table-column prop="templateNo" label="模板编号" /><el-table-column
        prop="name"
        label="模板名"
      /><el-table-column prop="channel" label="渠道" /><el-table-column
        prop="scene"
        label="场景"
      /><el-table-column prop="content" label="内容" /><el-table-column
        label="状态"
        ><template #default="{ row }">{{
          row.status === "ENABLED" ? "启用" : "停用"
        }}</template></el-table-column
      ><el-table-column label="操作" width="230"
        ><template #default="{ row }"
          ><el-button link @click="openEdit(row)">编辑</el-button
          ><el-button link :loading="acting === row.id" @click="toggle(row)">{{
            row.status === "ENABLED" ? "停用" : "启用"
          }}</el-button
          ><el-button
            v-if="!['ORDER_PAID', 'ORDER_SHIPPED'].includes(row.templateNo)"
            link
            type="danger"
            :loading="acting === row.id"
            @click="remove(row)"
            >删除</el-button
          ></template
        ></el-table-column
      ></el-table
    ><el-empty
      v-if="!loading && !rows.length"
      description="暂无消息模板" /></el-card
  ><el-dialog v-model="dialog" :title="editing ? '编辑模板' : '新增模板'"
    ><el-form :model="form"
      ><el-form-item label="模板编号" required
        ><el-input
          v-model.trim="form.templateNo"
          :disabled="!!editing" /></el-form-item
      ><el-form-item label="模板名" required
        ><el-input v-model.trim="form.name" /></el-form-item
      ><el-form-item label="渠道" required
        ><el-input v-model.trim="form.channel" /></el-form-item
      ><el-form-item label="场景"
        ><el-input v-model.trim="form.scene" /></el-form-item
      ><el-form-item label="内容" required
        ><el-input
          v-model="form.content"
          type="textarea" /></el-form-item></el-form
    ><template #footer
      ><el-button @click="dialog = false">取消</el-button
      ><el-button type="primary" :loading="saving" @click="save"
        >保存</el-button
      ></template
    ></el-dialog
  >
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { msgTemplateApi } from "@/api";
const rows = ref<any[]>([]),
  loading = ref(false),
  dialog = ref(false),
  saving = ref(false),
  acting = ref<number>(),
  editing = ref<any>();
const form = ref<any>({});
const unwrap = (r: any) => r?.data ?? r;
async function load() {
  loading.value = true;
  try {
    const d: any = unwrap(await msgTemplateApi.list());
    const x = d?.list ?? d?.items ?? d;
    rows.value = Array.isArray(x) ? x : [];
  } catch (e: any) {
    ElMessage.error(
      e?.response?.data?.message || e?.message || "消息模板加载失败",
    );
  } finally {
    loading.value = false;
  }
}
function openCreate() {
  editing.value = null;
  form.value = {
    templateNo: "",
    name: "",
    channel: "WX",
    scene: "",
    content: "",
    status: "ENABLED",
  };
  dialog.value = true;
}
function openEdit(r: any) {
  editing.value = r;
  form.value = { ...r };
  dialog.value = true;
}
async function save() {
  if (
    !form.value.templateNo ||
    !form.value.name ||
    !form.value.channel ||
    !form.value.content
  )
    return ElMessage.warning("请填写模板编号、名称、渠道和内容");
  if (saving.value) return;
  saving.value = true;
  try {
    if (editing.value)
      await msgTemplateApi.update(editing.value.id, form.value);
    else await msgTemplateApi.create(form.value);
    ElMessage.success("保存成功");
    dialog.value = false;
    await load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}
async function toggle(r: any) {
  if (acting.value) return;
  acting.value = r.id;
  try {
    await msgTemplateApi.toggle(r.id);
    ElMessage.success("状态已更新");
    await load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || "操作失败");
  } finally {
    acting.value = undefined;
  }
}
async function remove(r: any) {
  try {
    await ElMessageBox.confirm("确定删除该模板吗？", "提示", {
      type: "warning",
    });
    acting.value = r.id;
    await msgTemplateApi.remove(r.id);
    ElMessage.success("删除成功");
    await load();
  } catch (e: any) {
    if (e !== "cancel" && e !== "close")
      ElMessage.error(e?.response?.data?.message || e?.message || "删除失败");
  } finally {
    acting.value = undefined;
  }
}
onMounted(load);
</script>
