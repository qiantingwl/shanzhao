<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import {
  NButton,
  NDataTable,
  NImage,
  NInput,
  NModal,
  NPagination,
  NPopconfirm,
  NSelect,
  NSpace,
  NTag,
  useMessage
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchDeleteFlash, fetchFlashList, fetchFlashRecords, fetchUpdateFlashStatus } from '@/service/api';
import type { FlashItem, FlashRecord } from '@/service/api';

const loading = ref(false);
const list = ref<FlashItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const statusFilter = ref('');

const recordModal = ref(false);
const recordLoading = ref(false);
const records = ref<FlashRecord[]>([]);

const message = useMessage();
const apiOrigin = new URL(import.meta.env.VITE_SERVICE_BASE_URL, window.location.origin).origin;

function resolveFileUrl(path?: string) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${apiOrigin}${path}`;
}

const statusOptions = [
  { label: '全部', value: '' },
  { label: '已发布', value: '1' },
  { label: '已撤回', value: '2' },
  { label: '审核中', value: '0' },
  { label: '已拒绝', value: '3' }
];

const statusTypeMap: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
  '1': 'success',
  '2': 'warning',
  '0': 'default',
  '3': 'error'
};

const statusLabelMap: Record<string, string> = {
  '1': '已发布',
  '2': '已撤回',
  '0': '审核中',
  '3': '已拒绝'
};

function renderPreview(path?: string) {
  return path
    ? h('div', { class: 'flash-preview-box' }, [
        h(NImage, {
          src: resolveFileUrl(path),
          width: 72,
          height: 72,
          objectFit: 'cover'
        })
      ])
    : h('span', '-');
}

async function loadData() {
  loading.value = true;
  try {
    const { data } = await fetchFlashList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value || undefined
    });
    if (data) {
      list.value = data.list;
      total.value = data.total;
    }
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    await fetchDeleteFlash(id);
    message.success('删除成功');
    await loadData();
  } catch {
    message.error('删除失败');
  }
}

async function handleRevoke(id: string) {
  try {
    await fetchUpdateFlashStatus(id, '2');
    message.success('撤回成功');
    await loadData();
  } catch {
    message.error('撤回失败');
  }
}

async function openRecords(flashId: string) {
  recordModal.value = true;
  recordLoading.value = true;
  try {
    const { data } = await fetchFlashRecords(flashId, { page: 1, pageSize: 50 });
    if (data) {
      records.value = data.list;
    }
  } finally {
    recordLoading.value = false;
  }
}

const columns: DataTableColumns<FlashItem> = [
  {
    title: '缩略图',
    key: 'fileThumb',
    width: 100,
    render: row => renderPreview(row.fileThumb)
  },
  {
    title: '原图',
    key: 'filePath',
    width: 100,
    render: row => renderPreview(row.filePath)
  },
  { title: '发布者', key: 'authorId', render: row => h('span', row.author?.nickname || row.authorId) },
  {
    title: '状态',
    key: 'status',
    render: row =>
      h(NTag, { type: statusTypeMap[row.status] ?? 'default' }, { default: () => statusLabelMap[row.status] ?? row.status })
  },
  {
    title: '安全',
    key: 'security',
    width: 190,
    render: row =>
      h(NSpace, { size: 4 }, {
        default: () => [
          row.screenFlag === '1' ? h(NTag, { size: 'small', type: 'warning' }, { default: () => '防截屏' }) : null,
          row.shareBlockFlag === '1' ? h(NTag, { size: 'small', type: 'error' }, { default: () => '禁转发' }) : null,
          row.iosFlag === '1' || row.pcFlag === '1'
            ? h(NTag, { size: 'small', type: 'info' }, { default: () => '禁 iOS/PC' })
            : null
        ].filter(Boolean)
      })
  },
  { title: '最大次数', key: 'maxNum', width: 90 },
  { title: '时长(秒)', key: 'maxSec', width: 90 },
  { title: '创建时间', key: 'createdAt', render: row => h('span', new Date(row.createdAt).toLocaleString()) },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render: row =>
      h(NSpace, {}, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => openRecords(row.id) }, { default: () => '查看记录' }),
          h(
            NButton,
            { size: 'small', type: 'warning', disabled: row.status === '2', onClick: () => handleRevoke(row.id) },
            { default: () => '撤回' }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row.id) },
            {
              trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
              default: () => '确认删除该闪照？'
            }
          )
        ]
      })
  }
];

const recordColumns: DataTableColumns<FlashRecord> = [
  { title: '查看者', key: 'userId', render: row => h('span', row.user?.nickname || row.userId) },
  { title: '查看时长(秒)', key: 'viewSec' },
  {
    title: '截屏',
    key: 'screenFlag',
    render: row =>
      h(NTag, { type: row.screenFlag === '1' ? 'error' : 'success' }, { default: () => (row.screenFlag === '1' ? '是' : '否') })
  },
  { title: '时间', key: 'createdAt', render: row => h('span', new Date(row.createdAt).toLocaleString()) }
];

onMounted(loadData);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex gap-2 items-center">
      <NInput v-model:value="keyword" placeholder="搜索发布者 ID" style="width: 200px" clearable @keyup.enter="loadData" />
      <NSelect
        v-model:value="statusFilter"
        :options="statusOptions"
        style="width: 140px"
        placeholder="状态筛选"
        @update:value="loadData"
      />
      <NButton type="primary" @click="loadData">搜索</NButton>
    </div>

    <NDataTable :loading="loading" :columns="columns" :data="list" :pagination="false" bordered />

    <div class="mt-4 flex justify-end">
      <NPagination v-model:page="page" :item-count="total" :page-size="pageSize" @update:page="loadData" />
    </div>

    <NModal v-model:show="recordModal" title="查看记录" style="width: 700px" preset="card">
      <NDataTable :loading="recordLoading" :columns="recordColumns" :data="records" :pagination="{ pageSize: 20 }" bordered />
    </NModal>
  </div>
</template>

<style scoped>
.flash-preview-box {
  width: 72px;
  height: 72px;
  overflow: hidden;
  background: #f5f6f8;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}
</style>
