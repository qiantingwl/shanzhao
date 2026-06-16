<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NInput, NSelect, NTag, useMessage } from 'naive-ui';
import { request } from '@/service/request';

interface ConfigRow {
  key: string;
  value: string;
  remark: string;
}

interface ConfigItem {
  key: string;
  label: string;
  remark: string;
  type?: 'textarea' | 'password' | 'select';
  options?: { label: string; value: string }[];
}

interface Section {
  title: string;
  items: ConfigItem[];
}

const AUDIT_LINKS = [
  {
    label: '阿里云图片内容安全文档',
    url: 'https://help.aliyun.com/zh/viapi/use-cases/image-content-security-1'
  },
  { label: 'vxlink/nsfw_detector 项目地址', url: 'https://github.com/tmplink/nsfw_detector' },
  { label: 'helloz/nsfw 项目地址', url: 'https://github.com/helloxz/nsfw' },
  { label: 'nsfwpy 项目地址', url: 'https://github.com/HG-ha/nsfwpy' }
];

const DRIVER_OPTIONS = [
  { label: '本地存储 local', value: 'local' },
  { label: '腾讯云 COS', value: 'cos' },
  { label: '阿里云 OSS', value: 'oss' }
];

const AUDIT_DRIVER_OPTIONS = [
  { label: '阿里云', value: 'aliyun' },
  { label: 'vxlink/nsfw_detector', value: 'vxlink' },
  { label: 'helloz/nsfw', value: 'helloz' },
  { label: 'nsfwpy', value: 'nsfwpy' },
  { label: '虚假接口', value: 'fake' }
];

const SECTIONS: Section[] = [
  {
    title: '微信小程序',
    items: [
      { key: 'wx_appid', label: '小程序 AppID', remark: '微信公众平台获取，留空则使用环境变量 WX_APPID' },
      {
        key: 'wx_secret',
        label: '小程序 AppSecret',
        remark: '微信公众平台获取，留空则使用环境变量 WX_SECRET',
        type: 'password'
      }
    ]
  },
  {
    title: '基础设置',
    items: [
      { key: 'default_max_num', label: '默认最大查看次数', remark: '用户创建闪照时的默认次数上限' },
      { key: 'default_max_sec', label: '默认查看时长（秒）', remark: '用户创建闪照时的默认查看秒数' },
      { key: 'audit_enabled', label: '开启内容审核', remark: '1=使用所选审核接口，0=关闭审核直接通过' }
    ]
  },
  {
    title: '图片审核',
    items: [
      {
        key: 'image_audit_driver',
        label: '审核接口',
        remark: '上传图片时使用的审核方式；虚假接口会直接放行，仅用于测试',
        type: 'select',
        options: AUDIT_DRIVER_OPTIONS
      },
      { key: 'image_audit_aliyun_access_key_id', label: '阿里云 AccessKeyId', remark: '阿里云内容安全 AccessKeyId' },
      {
        key: 'image_audit_aliyun_access_key_secret',
        label: '阿里云 AccessKeySecret',
        remark: '阿里云内容安全 AccessKeySecret',
        type: 'password'
      },
      { key: 'image_audit_aliyun_region_id', label: '阿里云 RegionId', remark: '例如 cn-shanghai' },
      {
        key: 'image_audit_aliyun_scenes',
        label: '阿里云审核场景',
        remark: '逗号分隔，例如 porn,terrorism,ad,live,logo'
      },
      {
        key: 'image_audit_vxlink_base_url',
        label: 'vxlink 服务地址',
        remark: '例如 http://127.0.0.1:3333，系统会上传文件到 /check 审核'
      },
      { key: 'image_audit_vxlink_threshold', label: 'vxlink 拦截阈值', remark: '0-1，默认 0.8' },
      {
        key: 'image_audit_helloz_base_url',
        label: 'helloz 服务地址',
        remark: '例如 http://127.0.0.1:6086，系统会上传文件到 /api/upload_check 审核'
      },
      { key: 'image_audit_helloz_token', label: 'helloz Token', remark: '可选 Bearer Token', type: 'password' },
      { key: 'image_audit_helloz_threshold', label: 'helloz 拦截阈值', remark: '0-1，默认 0.8' },
      {
        key: 'image_audit_nsfwpy_base_url',
        label: 'nsfwpy 服务地址',
        remark: '例如 http://127.0.0.1:8000，系统会上传文件到 /classify 审核'
      },
      { key: 'image_audit_nsfwpy_threshold', label: 'nsfwpy 拦截阈值', remark: '0-1，默认 0.8' }
    ]
  },
  {
    title: '广告配置',
    items: [
      { key: 'ad_unlock_enabled', label: '广告解锁功能', remark: '1=开启，0=关闭' },
      { key: 'ad_rewarded_video_id', label: '激励视频广告位 ID', remark: '微信小程序后台申请的激励视频广告位 ID' },
      { key: 'ad_interstitial_id', label: '插屏广告位 ID', remark: '微信小程序后台申请的插屏广告位 ID' },
      { key: 'ad_banner_id', label: 'Banner 广告位 ID', remark: '微信小程序后台申请的 Banner 广告位 ID' }
    ]
  },
  {
    title: '运营内容',
    items: [
      { key: 'share_title', label: '默认分享文案', remark: '用户分享闪照时的默认标题' },
      { key: 'app_name', label: '小程序名称', remark: '关于/关注等页面显示的小程序名称' },
      { key: 'app_slogan', label: '小程序副标题', remark: '关于我们页面展示的宣传语' },
      { key: 'app_version', label: '版本号', remark: '关于我们页面展示的版本号' },
      { key: 'about_intro', label: '产品介绍', remark: '关于我们页面产品介绍', type: 'textarea' },
      { key: 'copyright_text', label: '底部免责声明', remark: '关于我们页面底部文案', type: 'textarea' },
      { key: 'follow_desc', label: '关注说明', remark: '关注我们页面说明文案', type: 'textarea' },
      { key: 'follow_qrcode', label: '公众号二维码 URL', remark: '关注我们页面二维码图片地址' },
      { key: 'follow_account', label: '公众号名称', remark: '关注我们页面公众号名称' },
      { key: 'service_time', label: '服务时间', remark: '关注我们页面服务时间' }
    ]
  },
  {
    title: '数据清理',
    items: [
      { key: 'retain_deleted_days', label: '删除内容保留天数', remark: '软删除内容保留多少天后从磁盘彻底清除' },
      { key: 'retain_user_deleted', label: '用户删除后保留文件', remark: '1=保留文件，0=到期清理文件' }
    ]
  },
  {
    title: '存储配置',
    items: [
      {
        key: 'storage_driver',
        label: '存储驱动',
        remark: '立即生效，切换后无需重启服务',
        type: 'select',
        options: DRIVER_OPTIONS
      },
      { key: 'storage_cos_secret_id', label: 'COS SecretId', remark: '腾讯云 COS SecretId' },
      { key: 'storage_cos_secret_key', label: 'COS SecretKey', remark: '腾讯云 COS SecretKey', type: 'password' },
      { key: 'storage_cos_bucket', label: 'COS Bucket', remark: '格式：your-bucket-1234567890' },
      { key: 'storage_cos_region', label: 'COS Region', remark: '例如 ap-guangzhou' },
      { key: 'storage_cos_cdn', label: 'COS CDN 域名', remark: '可选，例如 https://cdn.example.com' },
      { key: 'storage_oss_access_key_id', label: 'OSS AccessKeyId', remark: '阿里云 OSS AccessKeyId' },
      {
        key: 'storage_oss_access_key_secret',
        label: 'OSS AccessKeySecret',
        remark: '阿里云 OSS AccessKeySecret',
        type: 'password'
      },
      { key: 'storage_oss_bucket', label: 'OSS Bucket', remark: '阿里云 OSS Bucket 名称' },
      { key: 'storage_oss_region', label: 'OSS Region', remark: '例如 oss-cn-hangzhou' },
      { key: 'storage_oss_cdn', label: 'OSS CDN 域名', remark: '可选，例如 https://cdn.example.com' }
    ]
  }
];

const ALL_KEYS = SECTIONS.flatMap(section => section.items.map(item => item.key));

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const values = ref<Record<string, string>>({});

const driver = computed(() => values.value.storage_driver || 'local');
const isCos = computed(() => driver.value === 'cos');
const isOss = computed(() => driver.value === 'oss');
const auditDriver = computed(() => values.value.image_audit_driver || 'fake');
const isAliyunAudit = computed(() => auditDriver.value === 'aliyun');
const isVxlinkAudit = computed(() => auditDriver.value === 'vxlink');
const isHellozAudit = computed(() => auditDriver.value === 'helloz');
const isNsfwpyAudit = computed(() => auditDriver.value === 'nsfwpy');

function shouldShow(key: string): boolean {
  if (key.startsWith('storage_cos_') && !isCos.value) return false;
  if (key.startsWith('storage_oss_') && !isOss.value) return false;
  if (key.startsWith('image_audit_aliyun_') && !isAliyunAudit.value) return false;
  if (key.startsWith('image_audit_vxlink_') && !isVxlinkAudit.value) return false;
  if (key.startsWith('image_audit_helloz_') && !isHellozAudit.value) return false;
  if (key.startsWith('image_audit_nsfwpy_') && !isNsfwpyAudit.value) return false;
  return true;
}

async function loadData() {
  loading.value = true;
  try {
    const { data } = await request<ConfigRow[]>({ url: '/config', method: 'get' });
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: ConfigRow) => {
        map[row.key] = row.value;
      });
      ALL_KEYS.forEach(key => {
        if (!(key in map)) map[key] = '';
      });
      values.value = map;
    }
  } finally {
    loading.value = false;
  }
}

async function saveAll() {
  saving.value = true;
  try {
    const payload: Record<string, string> = {};
    ALL_KEYS.forEach(key => {
      payload[key] = values.value[key] ?? '';
    });
    await request({ url: '/config', method: 'patch', data: payload });
    message.success('全部配置已保存');
  } catch {
    message.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="config-page">
    <div v-if="loading" class="loading-tip">加载中...</div>

    <template v-else>
      <div v-for="section in SECTIONS" :key="section.title" class="section-card">
        <div class="section-title">{{ section.title }}</div>
        <div class="config-table">
          <div class="table-head">
            <span class="col-label">配置项</span>
            <span class="col-value">当前值</span>
            <span class="col-remark">说明</span>
          </div>
          <template v-for="item in section.items" :key="item.key">
            <div v-if="shouldShow(item.key)" class="table-row">
              <span class="col-label">{{ item.label }}</span>
              <span class="col-value">
                <NSelect
                  v-if="item.type === 'select'"
                  v-model:value="values[item.key]"
                  :options="item.options"
                  size="small"
                />
                <NInput
                  v-else-if="item.type === 'textarea'"
                  v-model:value="values[item.key]"
                  type="textarea"
                  :rows="3"
                  size="small"
                  :placeholder="item.remark"
                />
                <NInput
                  v-else-if="item.type === 'password'"
                  v-model:value="values[item.key]"
                  type="password"
                  show-password-on="click"
                  size="small"
                  :placeholder="item.remark"
                />
                <NInput v-else v-model:value="values[item.key]" size="small" :placeholder="item.remark" />
              </span>
              <span class="col-remark text-muted">{{ item.remark }}</span>
            </div>
          </template>
        </div>
      </div>

      <div class="audit-links">
        <span>相关链接</span>
        <a v-for="link in AUDIT_LINKS" :key="link.url" :href="link.url" target="_blank" rel="noreferrer">
          {{ link.label }}
        </a>
      </div>

      <div class="save-bar">
        <NTag v-if="driver !== 'local'" type="warning" size="small" style="margin-right: 12px">
          请确认 {{ driver.toUpperCase() }} 密钥、Bucket 和 Region 已正确配置
        </NTag>
        <NButton type="primary" size="large" :loading="saving" @click="saveAll">保存全部配置</NButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.config-page {
  max-width: 960px;
  padding: 16px;
}

.loading-tip {
  padding: 40px;
  color: #999;
  text-align: center;
}

.section-card {
  margin-bottom: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 8px;
}

.section-title {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.config-table {
  width: 100%;
}

.table-head {
  display: grid;
  grid-template-columns: 200px 1fr 260px;
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 500;
  color: #888;
  background: #f7f8fa;
  border-bottom: 1px solid #f0f0f0;
}

.table-row {
  display: grid;
  grid-template-columns: 200px 1fr 260px;
  gap: 12px;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.table-row:last-child {
  border-bottom: none;
}

.col-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.col-value {
  min-width: 0;
}

.col-remark {
  font-size: 12px;
}

.text-muted {
  color: #888;
}

.audit-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  padding: 4px 0 12px;
  font-size: 12px;
}

.audit-links span {
  font-weight: 600;
  color: #666;
}

.audit-links a {
  color: #3861fb;
  text-decoration: none;
}

.audit-links a:hover {
  text-decoration: underline;
}

.save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 16px 0 8px;
}
</style>
