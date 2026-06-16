<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { createReusableTemplate } from '@vueuse/core';
import { useThemeStore } from '@/store/modules/theme';
import { request } from '@/service/request';

defineOptions({
  name: 'CardData'
});

interface CardData {
  key: string;
  title: string;
  value: number;
  unit: string;
  color: {
    start: string;
    end: string;
  };
  icon: string;
}

interface DashboardData {
  totalFlash: number;
  totalUsers: number;
  totalRecords: number;
  totalShares: number;
  pendingFlash: number;
  todayFlash: number;
  todayUsers: number;
  todayRecords: number;
}

const dashboard = ref<DashboardData>({
  totalFlash: 0,
  totalUsers: 0,
  totalRecords: 0,
  totalShares: 0,
  pendingFlash: 0,
  todayFlash: 0,
  todayUsers: 0,
  todayRecords: 0
});

const cardData = computed<CardData[]>(() => [
  {
    key: 'todayFlash',
    title: '今日上传图片',
    value: dashboard.value.todayFlash,
    unit: '',
    color: {
      start: '#ec4786',
      end: '#b955a4'
    },
    icon: 'material-symbols:image-outline'
  },
  {
    key: 'todayUsers',
    title: '今日新增用户',
    value: dashboard.value.todayUsers,
    unit: '',
    color: {
      start: '#865ec0',
      end: '#5144b4'
    },
    icon: 'mdi:account-plus-outline'
  },
  {
    key: 'todayRecords',
    title: '今日访问次数',
    value: dashboard.value.todayRecords,
    unit: '',
    color: {
      start: '#56cdf3',
      end: '#719de3'
    },
    icon: 'ant-design:eye-outlined'
  },
  {
    key: 'pendingFlash',
    title: '待审核图片',
    value: dashboard.value.pendingFlash,
    unit: '',
    color: {
      start: '#fcbc25',
      end: '#f68057'
    },
    icon: 'ant-design:trademark-circle-outlined'
  },
  {
    key: 'totalFlash',
    title: '总上传图片',
    value: dashboard.value.totalFlash,
    unit: '',
    color: {
      start: '#36cfc9',
      end: '#1890ff'
    },
    icon: 'material-symbols:photo-library-outline'
  },
  {
    key: 'totalUsers',
    title: '总用户数',
    value: dashboard.value.totalUsers,
    unit: '',
    color: {
      start: '#73d13d',
      end: '#389e0d'
    },
    icon: 'mdi:account-group-outline'
  },
  {
    key: 'totalShares',
    title: '总转发数',
    value: dashboard.value.totalShares,
    unit: '',
    color: {
      start: '#a78bfa',
      end: '#7c3aed'
    },
    icon: 'mdi:share-variant-outline'
  },
  {
    key: 'totalRecords',
    title: '总访问次数',
    value: dashboard.value.totalRecords,
    unit: '',
    color: {
      start: '#ff85c0',
      end: '#c41d7f'
    },
    icon: 'mdi:eye-check-outline'
  }
]);

interface GradientBgProps {
  gradientColor: string;
}

const [DefineGradientBg, GradientBg] = createReusableTemplate<GradientBgProps>();

const themeStore = useThemeStore();

function getGradientColor(color: CardData['color']) {
  return `linear-gradient(to bottom right, ${color.start}, ${color.end})`;
}

async function loadDashboard() {
  const { data } = await request<DashboardData>({ url: '/dashboard' });
  if (data) {
    dashboard.value = {
      totalFlash: Number(data.totalFlash || 0),
      totalUsers: Number(data.totalUsers || 0),
      totalRecords: Number(data.totalRecords || 0),
      totalShares: Number(data.totalShares || 0),
      pendingFlash: Number(data.pendingFlash || 0),
      todayFlash: Number(data.todayFlash || 0),
      todayUsers: Number(data.todayUsers || 0),
      todayRecords: Number(data.todayRecords || 0)
    };
  }
}

onMounted(loadDashboard);
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <!-- define component start: GradientBg -->
    <DefineGradientBg v-slot="{ $slots, gradientColor }">
      <div
        class="px-16px pb-4px pt-8px text-white"
        :style="{ backgroundImage: gradientColor, borderRadius: themeStore.themeRadius + 'px' }"
      >
        <component :is="$slots.default" />
      </div>
    </DefineGradientBg>
    <!-- define component end: GradientBg -->

    <NGrid cols="s:1 m:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
      <NGi v-for="item in cardData" :key="item.key">
        <GradientBg :gradient-color="getGradientColor(item.color)" class="flex-1">
          <h3 class="text-16px">{{ item.title }}</h3>
          <div class="flex justify-between pt-12px">
            <SvgIcon :icon="item.icon" class="text-32px" />
            <CountTo
              :prefix="item.unit"
              :start-value="1"
              :end-value="item.value"
              class="text-30px text-white dark:text-dark"
            />
          </div>
        </GradientBg>
      </NGi>
    </NGrid>
  </NCard>
</template>

<style scoped></style>
