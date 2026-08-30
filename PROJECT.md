# 闪照相机 - 项目技术文档

> 最后更新：2026-08-30

## 一、项目概述

闪照相机是一款微信小程序，核心功能是创建**限时查看图片**（闪照），支持查看次数、查看时长、截屏检测、广告解锁、撤回等能力。

**技术栈**：
- **小程序前端**：uni-app (Vue 3 Options API)，编译为微信小程序
- **管理后台前端**：Vue 3 + Vite + TypeScript (SoybeanAdmin 框架)
- **后端**：NestJS + TypeORM + MariaDB
- **部署**：Docker 一体化容器（内置 MariaDB + Node.js）
- **存储**：本地存储 / 腾讯云 COS / 阿里云 OSS（可配置，支持驱动切换检测）
- **图片审核**：阿里云内容安全 / vxlink / helloz / nsfwpy（可选，4 种驱动）

---

## 二、目录结构

```
闪照小程序/
├── shan/                    # 微信小程序前端（uni-app）
│   ├── pages/               # 13 个页面
│   ├── utils/               # 工具库（5 个文件）
│   ├── static/              # 静态资源（SVG 图标 + logo）
│   └── App.vue / main.js / pages.json / manifest.json
├── backend/                 # NestJS 后端
│   └── src/                 # 源码（8 个模块）
├── admin/                   # 管理后台前端（Vue 3 + SoybeanAdmin）
├── docker/                  # Docker 构建与部署
│   ├── Dockerfile           # 多阶段构建
│   ├── entrypoint.sh        # 容器启动脚本
│   └── container-init.sql   # 数据库初始化
├── compose.yaml             # Docker Compose 一键部署
├── README.md                # 部署说明
└── PROJECT.md               # 本文档
```

---

## 三、小程序前端 (`shan/`)

### 3.1 核心文件

| 文件 | 功能 |
|------|------|
| `App.vue` | 应用入口，全局样式 |
| `main.js` | uni-app 初始化 |
| `pages.json` | 页面路由、导航栏配置 |
| `manifest.json` | 小程序 AppID、编译配置 |
| `project.config.json` | 微信开发者工具项目配置 |

### 3.2 页面 (`pages/`)

| 页面 | 功能 |
|------|------|
| `create/create.vue` | **首页** — 选图、设模式/参数、上传审核、创建闪照、分享弹窗 |
| `viewer/viewer.vue` | **查看页** — 模糊预览→登录→按住查看→倒计时→截屏检测→广告解锁 |
| `records/records.vue` | **记录页** — 分页列表展示用户所有闪照 |
| `record-detail/record-detail.vue` | **详情页** — 查看记录表格、撤回/删除/分享操作 |
| `profile/profile.vue` | **我的** — 微信登录、修改昵称头像、菜单入口 |
| `share-moments/share-moments.vue` | 生成分享卡片供保存到相册发朋友圈 |
| `help/help.vue` | FAQ 折叠面板（数据来自后台配置） |
| `rules/rules.vue` | 使用规范（支持后台自定义 `rules_text`） |
| `blacklist/blacklist.vue` | 小黑屋（封禁用户公示） |
| `about/about.vue` | 关于我们（版本号/品牌信息） |
| `follow/follow.vue` | 关注公众号（二维码） |
| `agreement/agreement.vue` | 用户协议 |
| `privacy/privacy.vue` | 隐私政策（支持后台自定义 `privacy_text`） |

### 3.3 工具库 (`utils/`)

| 文件 | 功能 |
|------|------|
| `config.js` | `getBaseUrl()` 动态获取 API 域名（支持 Storage 运行时覆盖）；`getUploadUrl()` 上传地址 |
| `request.js` | 封装 `uni.request` / `uni.uploadFile`，自动注入 Bearer Token，统一错误处理 |
| `api.js` | 所有后端接口调用函数（20+ 个导出函数） |
| `auth.js` | 登录态管理：`ensureLogin()`、`wxCodeLogin()`、`getStoredUser()` |
| `format.js` | `formatTime()`、`formatShort()`、`resolveFileUrl()` |

### 3.4 小程序调用的后端接口

| 接口 | 方法 | 鉴权 | 说明 |
|------|------|:----:|------|
| `/api/mp/auth/login` | POST | ❌ | 微信 code 换取 token |
| `/api/mp/config` | GET | ❌ | 获取公开配置项（30+ 项） |
| `/api/mp/help` | GET | ❌ | 获取帮助列表 |
| `/api/mp/user-ban` | GET | ❌ | 获取封禁用户列表 |
| `/api/mp/upload/image` | POST | ✅ | 上传图片（审核+缩略图+分享图+存储） |
| `/api/mp/flash` | POST | ✅ | 创建闪照 |
| `/api/mp/flash` | GET | ✅ | 获取我的闪照列表（分页） |
| `/api/mp/flash/:id` | GET | ✅ | 获取闪照详情（含查看次数） |
| `/api/mp/flash/:id` | DELETE | ✅ | 删除闪照（软删除，定时清理） |
| `/api/mp/flash/:id/revoke` | PATCH | ✅ | 撤回闪照（状态变更，文件保留） |
| `/api/mp/flash/:id/records` | GET | ✅ | 获取闪照查看记录（分页） |
| `/api/mp/flash/:id/viewer` | GET | ❌ | 查看者获取闪照信息（公开） |
| `/api/mp/flash/:id/view` | POST | ✅ | 记录一次查看（含次数检查） |
| `/api/mp/flash/record/:recordId` | PATCH | ✅ | 更新查看记录（时长/截屏标记） |
| `/api/mp/flash/:id/remain` | GET | ✅ | 获取剩余查看次数 |
| `/api/mp/flash/:id/ad-unlock` | POST | ✅ | 广告解锁一次查看机会 |
| `/api/mp/flash/:id/share` | POST | ✅ | 记录分享行为 |
| `/api/mp/flash/private-upload-ad/status` | GET | ✅ | 保密模式上传广告状态 |
| `/api/mp/flash/private-upload-ad/record` | POST | ✅ | 记录保密模式上传广告 |
| `/api/mp/user/profile` | PATCH | ✅ | 更新昵称/头像 |

---

## 四、后端 (`backend/src/`)

### 4.1 模块结构

```
src/
├── main.ts                          # 启动入口（CORS/全局管道/静态文件/初始化管理员）
├── app.module.ts                    # 根模块（TypeORM/Schedule/功能模块注册）
├── entities/                        # 7 个数据库实体
│   ├── user.entity.ts
│   ├── admin-user.entity.ts
│   ├── flash.entity.ts
│   ├── flash-record.entity.ts
│   ├── config.entity.ts
│   ├── help.entity.ts
│   └── user-ban.entity.ts
├── auth/                            # 认证模块
│   ├── auth.controller.ts           # 登录/注册/信息/改密路由
│   ├── auth.service.ts              # 微信 code2session → JWT 签发 → 封禁检测
│   ├── auth.module.ts
│   └── strategies/                  # JWT 策略（用户 + 管理员两套）
├── flash/                           # 闪照核心业务
│   ├── flash.controller.ts          # 需登录路由（CRUD/查看/解锁）
│   ├── flash-public.controller.ts   # 公开路由（:id/viewer）
│   ├── flash.service.ts             # 核心逻辑（创建/查看计数/广告解锁/截屏封禁）
│   └── flash.module.ts
├── upload/                          # 图片上传
│   ├── upload.controller.ts         # 上传 → 审核 → 缩略图 → 存储
│   └── upload.module.ts
├── config/                          # 系统配置
│   ├── config.service.ts            # 配置读写（60s 缓存 + In() 批量查询）
│   ├── config.controller.ts         # 公开配置 API
│   ├── config.module.ts
│   └── cleanup.task.ts              # 每日 3AM 定时清理已删除闪照文件
├── content/                         # 内容管理
│   ├── content.controller.ts        # 帮助/封禁列表（公开 + 管理端 CRUD）
│   ├── content.service.ts
│   └── content.module.ts
├── admin/                           # 管理后台
│   ├── admin.controller.ts          # 仪表盘/闪照/用户/配置管理路由
│   ├── admin.service.ts             # 列表查询/封禁/统计
│   └── admin.module.ts
└── common/                          # 公共组件
    ├── guards/auth.guard.ts         # 小程序 JWT 守卫
    ├── guards/admin.guard.ts        # 管理后台 JWT 守卫
    ├── interceptors/response.interceptor.ts  # 统一响应格式
    ├── filters/exception.filter.ts  # 全局异常过滤器
    ├── services/audit.service.ts    # 图片审核（4 种驱动）
    └── services/storage.service.ts  # 文件存储（3 种驱动 + 驱动切换安全检测）
```

### 4.2 数据库实体

| 实体 | 表名 | 关键字段 |
|------|------|---------|
| `User` | `users` | openid, nickname, avatar, isBanned |
| `AdminUser` | `admin_users` | username, password(bcrypt), nickname |
| `Flash` | `flash` | authorId, filePath, fileThumb, fileShare, screenFlag, adFlag, mode, maxNum, maxSec, status, delFlag |
| `FlashRecord` | `flash_records` | flashId, userId, recordMode, viewSec, screenFlag, screenType, deviceInfo |
| `SysConfig` | `sys_config` | key, value, remark |
| `Help` | `help` | title, content, sortOrder |
| `UserBan` | `user_bans` | userId, banDay, banReason, secureTime, delFlag |

### 4.3 管理后台接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/auth/login` | POST | 管理员登录 |
| `/api/admin/auth/getUserInfo` | GET | 获取管理员信息 |
| `/api/admin/auth/password` | PATCH | 修改管理员密码 |
| `/api/admin/dashboard` | GET | 仪表盘统计 |
| `/api/admin/flash` | GET | 闪照列表（分页/搜索/状态筛选） |
| `/api/admin/flash/:id/status` | PATCH | 修改闪照状态 |
| `/api/admin/flash/:id` | DELETE | 删除闪照 |
| `/api/admin/flash/:id/records` | GET | 查看记录 |
| `/api/admin/user` | GET | 用户列表 |
| `/api/admin/user/:id/ban` | PATCH | 封禁/解封用户 |
| `/api/admin/config` | GET | 获取全部配置 |
| `/api/admin/config/:key` | PATCH | 修改单个配置 |
| `/api/admin/config` | PATCH | 批量修改配置 |
| `/api/admin/help` | GET/POST | 帮助 CRUD |
| `/api/admin/help/:id` | PATCH/DELETE | 帮助修改/删除 |

---

## 五、管理后台前端 (`admin/`)

基于 **SoybeanAdmin** 框架（Vue 3 + NaiveUI + UnoCSS）。

| 页面 | 路径 | 功能 |
|------|------|------|
| 仪表盘 | `views/home/` | 统计卡片（总闪照/用户/查看/分享/今日数据） |
| 闪照管理 | `views/flash-manage/` | 闪照列表、状态变更、删除、查看记录 |
| 用户管理 | `views/user-manage/` | 用户列表、封禁/解封 |
| 系统配置 | `views/sys-config/` | 分组配置表单（微信/审核/存储/广告/模式等） |

---

## 六、Docker 部署 (`docker/`)

| 文件 | 功能 |
|------|------|
| `Dockerfile` | 多阶段构建：admin 前端 → 后端 → 运行镜像（Alpine + MariaDB + Node） |
| `entrypoint.sh` | 初始化 DB → 创建管理员 → 生成 JWT Secret → 启动 MariaDB + Node |
| `container-init.sql` | 完整建表 SQL（7 张表 + 索引） |

```bash
# 部署命令
docker run -d --name shanzhao \
  -p 3000:3000 \
  -v /opt/shanzhao:/app/data \
  ghcr.io/qiantingwl/shanzhao:latest

# 数据目录
/app/data/
├── .env              # 自动生成的环境变量（JWT Secret 等）
├── mysql/            # MariaDB 数据文件
└── uploads/          # 本地存储图片（使用 COS/OSS 时为空）
```

---

## 七、系统配置项

### 基础设置
| Key | 说明 | 默认值 |
|-----|------|--------|
| `wx_appid` | 微信小程序 AppID | (空，读环境变量) |
| `wx_secret` | 微信小程序 AppSecret | (空，读环境变量) |
| `default_max_num` | 默认查看次数 | 1 |
| `default_max_sec` | 默认查看秒数 | 3 |
| `default_flash_mode` | 默认模式 | entertainment |
| `capture_ban_threshold` | 截图封禁阈值（0=关闭） | 2 |
| `capture_ban_days` | 截图封禁天数 | 7 |
| `retain_deleted_days` | 删除内容保留天数 | 30 |
| `retain_user_deleted` | 用户删除后保留文件 | 1 |

### 模式配置
| Key | 说明 |
|-----|------|
| `entertainment_origin_enabled` | 娱乐模式显示来源 |
| `entertainment_screen_enabled` | 娱乐模式防截屏 |
| `entertainment_device_block_enabled` | 娱乐模式禁止 PC/iOS |
| `entertainment_share_block_enabled` | 娱乐模式禁止转发 |
| `entertainment_ad_enabled` | 娱乐模式广告解锁 |
| `private_*` | 保密模式对应配置（默认更严格） |
| `private_upload_ad_required` | 保密模式上传前看广告 |
| `private_daily_upload_ad_count` | 每日上传广告次数 |
| `pc_view_block_when_screen_enabled` | 防截屏时 PC 端禁止查看 |

### 广告配置
| Key | 说明 |
|-----|------|
| `ad_unlock_enabled` | 广告功能总开关 |
| `max_ad_unlock_count` | 每张图广告解锁上限 |
| `ad_rewarded_video_id` | 激励视频广告位 ID |
| `ad_interstitial_id` | 插屏广告位 ID |
| `ad_banner_id` | Banner 广告位 ID |

### 图片审核
| Key | 说明 |
|-----|------|
| `audit_enabled` | 审核开关（1=启用，0=关闭直接通过） |
| `image_audit_driver` | 驱动（aliyun / vxlink / helloz / nsfwpy） |
| `image_audit_aliyun_access_key_id` | 阿里云 AccessKeyId |
| `image_audit_aliyun_access_key_secret` | 阿里云 AccessKeySecret |
| `image_audit_aliyun_region_id` | 阿里云 RegionId |
| `image_audit_aliyun_scenes` | 审核场景（逗号分隔） |
| `image_audit_vxlink_*` | vxlink 服务配置 |
| `image_audit_helloz_*` | helloz 服务配置 |
| `image_audit_nsfwpy_*` | nsfwpy 服务配置 |

### 存储
| Key | 说明 |
|-----|------|
| `storage_driver` | 驱动（local / cos / oss，留空读环境变量） |
| `storage_cos_secret_id` | COS SecretId |
| `storage_cos_secret_key` | COS SecretKey |
| `storage_cos_bucket` | COS Bucket |
| `storage_cos_region` | COS Region |
| `storage_cos_cdn` | COS CDN 域名（可选） |
| `storage_oss_access_key_id` | OSS AccessKeyId |
| `storage_oss_access_key_secret` | OSS AccessKeySecret |
| `storage_oss_bucket` | OSS Bucket |
| `storage_oss_region` | OSS Region |
| `storage_oss_cdn` | OSS CDN 域名（可选） |

### 展示配置
| Key | 说明 |
|-----|------|
| `share_title` | 分享文案 |
| `app_name` / `app_slogan` / `app_version` | 小程序品牌信息 |
| `about_intro` / `copyright_text` | 关于页内容 |
| `follow_desc` / `follow_qrcode` / `follow_account` | 关注页内容 |
| `service_time` | 客服时间 |
| `rules_text` | 自定义使用规范（留空显示默认） |
| `privacy_text` | 自定义隐私政策（留空显示默认） |

---

## 八、业务流程

### 8.1 创建闪照
```
选择图片 → 选择模式(娱乐/保密) → 设置参数 → 点击创建
  → [保密模式] 检查是否需要看广告 → 看广告
  → 上传图片 → 后端审核(如开启) → 生成模糊缩略图 + 分享图 → 存储
  → 创建 flash 记录（含 ActivityID 用于私密分享）→ 返回分享弹窗
```

### 8.2 查看闪照
```
分享链接进入 → getFlashForViewer（公开，无需登录）
  → 检查设备限制(PC/iOS) → 显示模糊预览
  → 未登录提示登录 → 登录后 getRemain 检查剩余次数
  → 按住查看 → recordView（创建记录）→ 启动倒计时 + 截屏监听
  → 倒计时结束 / 手指松开 → finishView → syncViewRecord（更新时长/截屏标记）
  → 次数用完 → 广告解锁(如允许) → adUnlock 后重新 init
```

### 8.3 截屏封禁
```
检测到截屏/录屏 → 前端标记 hasScreenshot/hasScreenRecord
  → syncViewRecord 上报 screenFlag=1 + screenType + deviceInfo
  → 后端 applyCaptureBanIfNeeded：统计用户截屏总次数
  → 超过 capture_ban_threshold → 写入 user_bans + 标记 isBanned
  → 用户下次 wxLogin 时检测 → 封禁中则拒绝登录
  → secureTime 过期后自动解封
```

### 8.4 删除与清理
```
用户删除 → flash.delFlag = '1'（软删除）→ 文件保留
  → 每日 3AM cleanup.task 检查：
    - retain_user_deleted=1 → 跳过清理
    - retain_user_deleted=0 → 删除超过 retain_deleted_days 天的记录
    - 调用 storage.remove() 删除关联文件（含驱动切换安全检测）
    - 最后 flashRepo.remove() 物理删除记录
```

### 8.5 FlashRecord.recordMode 枚举
| 值 | 含义 |
|----|------|
| `0` | 首次查看 |
| `1` | 非首次查看 |
| `2` | 广告解锁（增加全局查看额度） |
| `3` | 分享记录 |
| `4` | 保密模式上传广告 |

### 8.6 Flash.status 枚举
| 值 | 含义 |
|----|------|
| `0` | 待审核 (PENDING) |
| `1` | 已发布 (PUBLISHED) |
| `2` | 已撤回 (REVOKED) |
| `3` | 已拒绝 (REJECTED) |

---

## 九、依赖清单

### 后端核心依赖
- `@nestjs/core` + `@nestjs/platform-express` — Web 框架
- `@nestjs/typeorm` + `typeorm` + `mysql2` — ORM + MariaDB 驱动
- `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` — JWT 认证
- `@nestjs/schedule` — 定时任务（Cron）
- `sharp` — 图片处理（缩略图/模糊/分享图）
- `multer` — 文件上传（9MB 限制）
- `bcrypt` — 密码哈希
- `axios` + `form-data` — HTTP 请求（微信 API / 审核服务）
- `@alicloud/imageaudit20191230` — 阿里云内容安全 SDK
- `cos-nodejs-sdk-v5` — 腾讯云 COS（可选，动态 require）
- `ali-oss` — 阿里云 OSS（可选，动态 require）

### 管理后台前端核心依赖
- `vue` + `vue-router` + `pinia` — SPA 基础
- `naive-ui` — UI 组件库
- `@sa/axios` — HTTP 请求封装
- `unocss` — 原子 CSS

---

## 十、环境变量 (`.env`)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端监听端口 | 3000 |
| `DB_HOST` | 数据库地址 | 127.0.0.1 |
| `DB_PORT` | 数据库端口 | 3306 |
| `DB_USERNAME` | 数据库用户 | shanzhao |
| `DB_PASSWORD` | 数据库密码 | (自动生成) |
| `DB_DATABASE` | 数据库名 | shanzhao |
| `WX_APPID` | 微信小程序 AppID | (可在后台覆盖) |
| `WX_SECRET` | 微信小程序 AppSecret | (可在后台覆盖) |
| `JWT_SECRET` | 用户 JWT 密钥 | (首次启动自动生成) |
| `ADMIN_JWT_SECRET` | 管理员 JWT 密钥 | (首次启动自动生成) |
| `JWT_EXPIRES_IN` | Token 过期时间 | 7d |
| `STORAGE_DRIVER` | 存储驱动 | local |

---

## 十一、注意事项

1. `.env`、运行时数据库、上传文件和第三方密钥不得提交到公开仓库
2. 阿里云审核的 AccessKeySecret **不要带前导/尾部空格**
3. `audit_enabled` 必须设为 `1` 才会调用选定的真实审核服务
4. 容器数据挂载到 `/app/data`，包含数据库文件、环境变量和上传文件
5. 定时清理任务需 `retain_user_deleted=0` 才会实际删除文件
6. 存储驱动切换后，旧驱动上的文件需手动清理（`storage.remove()` 已做安全检测，不会误删）
7. 查看次数是**全局限制**（所有用户共享 maxNum），不是每用户独立限制
8. 撤回操作只改状态不删文件，正在查看的用户会被提示闪照已撤回
9. 微信 ActivityID 用于**私密消息**分享（shareBlockFlag=1 时），需 AppID/Secret 有效
