<script setup lang="ts">
import CardData from './modules/card-data.vue';
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex-y-center justify-between">
        <div>
          <h2 class="text-20px font-600">运营数据概览</h2>
          <p class="mt-8px text-13px text-gray-500">统计今日上传图片、新增用户、访问记录等核心数据</p>
        </div>
        <NTag type="success" round>今日实时</NTag>
      </div>
    </NCard>
    <CardData />
  </NSpace>
</template>

<style scoped></style>
