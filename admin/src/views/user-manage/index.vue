<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NButton, NDataTable, NInput, NPagination, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchBanUser, fetchUserList } from '@/service/api';
import type { UserItem } from '@/service/api';

const loading = ref(false);
const list = ref<UserItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');

async function loadData() {
  loading.value = true;
  try {
    const { data } = await fetchUserList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    });
    if (data) {
      list.value = data.list;
      total.value = data.total;
    }
  } finally {
    loading.value = false;
  }
}

async function toggleBan(user: UserItem) {
  await fetchBanUser(user.id, !user.isBanned);
  await loadData();
}

const columns: DataTableColumns<UserItem> = [
  { title: 'ID', key: 'id', ellipsis: true, width: 200 },
  { title: 'OpenID', key: 'openid', ellipsis: true, width: 220 },
  { title: '昵称', key: 'nickname', render: row => h('span', row.nickname || '-') },
  {
    title: '状态',
    key: 'isBanned',
    render: row => h(NTag, { type: row.isBanned ? 'error' : 'success' }, { default: () => (row.isBanned ? '已封禁' : '正常') })
  },
  { title: '注册时间', key: 'createdAt', render: row => h('span', new Date(row.createdAt).toLocaleString()) },
  {
    title: '操作',
    key: 'actions',
    render: row =>
      h(NSpace, {}, {
        default: () => [
          h(
            NPopconfirm,
            { onPositiveClick: () => toggleBan(row) },
            {
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', type: row.isBanned ? 'success' : 'error' },
                  { default: () => (row.isBanned ? '解封' : '封禁') }
                ),
              default: () => (row.isBanned ? '确认解封该用户？' : '确认封禁该用户？')
            }
          )
        ]
      })
  }
];

onMounted(loadData);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex gap-2 items-center">
      <NInput v-model:value="keyword" placeholder="搜索昵称或 OpenID" style="width: 220px" clearable @keyup.enter="loadData" />
      <NButton type="primary" @click="loadData">搜索</NButton>
    </div>

    <NDataTable :loading="loading" :columns="columns" :data="list" :pagination="false" bordered />

    <div class="mt-4 flex justify-end">
      <NPagination v-model:page="page" :item-count="total" :page-size="pageSize" @update:page="loadData" />
    </div>
  </div>
</template>
