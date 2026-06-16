<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { VNode } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';
import { request } from '@/service/request';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'changePassword' | 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: '修改密码',
      key: 'changePassword',
      icon: SvgIconVNode({ icon: 'mdi:lock-reset', fontSize: 18 })
    },
    {
      type: 'divider',
      key: 'divider'
    },
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});

const passwordVisible = ref(false);
const passwordLoading = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

function openChangePassword() {
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  passwordVisible.value = true;
}

async function submitChangePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    window.$message?.warning('请填写原密码和新密码');
    return;
  }
  if (passwordForm.newPassword.length < 6) {
    window.$message?.warning('新密码至少需要6位');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    window.$message?.warning('两次输入的新密码不一致');
    return;
  }
  passwordLoading.value = true;
  try {
    await request({
      url: '/auth/password',
      method: 'patch',
      data: {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }
    });
    window.$message?.success('密码修改成功，请重新登录');
    passwordVisible.value = false;
    authStore.resetStore();
  } finally {
    passwordLoading.value = false;
  }
}

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      authStore.resetStore();
    }
  });
}

function handleDropdown(key: DropdownKey) {
  if (key === 'changePassword') {
    openChangePassword();
  } else if (key === 'logout') {
    logout();
  } else {
    // If your other options are jumps from other routes, they will be directly supported here
    routerPushByKey(key);
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon>
        <SvgIcon icon="ph:user-circle" class="text-icon-large" />
        <span class="text-16px font-medium">{{ authStore.userInfo.userName }}</span>
      </ButtonIcon>
    </div>
  </NDropdown>
  <NModal v-model:show="passwordVisible" preset="card" title="修改密码" class="w-420px">
    <NForm label-placement="left" label-width="90px">
      <NFormItem label="原密码">
        <NInput
          v-model:value="passwordForm.oldPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入原密码"
        />
      </NFormItem>
      <NFormItem label="新密码">
        <NInput
          v-model:value="passwordForm.newPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入新密码"
        />
      </NFormItem>
      <NFormItem label="确认密码">
        <NInput
          v-model:value="passwordForm.confirmPassword"
          type="password"
          show-password-on="click"
          placeholder="请再次输入新密码"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="passwordVisible = false">取消</NButton>
        <NButton type="primary" :loading="passwordLoading" @click="submitChangePassword">保存</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
