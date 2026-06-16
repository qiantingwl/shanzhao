# 闪照小程序

闪照小程序是一套微信小程序闪照/阅后即焚图片系统，包含小程序前端、后台管理端、后端 API、图片上传、内容审核、存储配置、用户管理、闪照记录管理和数据清理能力。

## 功能

```text
微信小程序端：创建闪照、查看闪照、查看记录、个人中心、帮助说明。
后台管理端：数据概览、闪照管理、用户管理、系统配置。
后端服务：登录鉴权、上传、内容审核、存储、记录、数据清理。
Docker 部署：单容器内置后端、后台管理端和 MariaDB。
```

## Docker 一键部署

镜像地址：

```bash
ghcr.io/qiantingwl/shanzhao:latest
```

命令行部署：

```bash
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```

宝塔 Docker 部署：

```text
镜像：ghcr.io/qiantingwl/shanzhao:latest
容器端口：3000
服务器端口：3000
目录挂载：/opt/shanzhao -> /app/data
重启策略：always
```

访问后台：

```text
http://服务器IP:3000/
```

默认后台账号：

```text
账号：admin
密码：admin123
```

首次登录后请及时修改密码。

## 反向代理

线上使用时建议在宝塔或 Nginx 中开启 HTTPS，并反向代理到：

```text
http://127.0.0.1:3000
```

微信小程序后台需要把 `request`、`uploadFile`、`downloadFile` 合法域名配置为你的 HTTPS 域名。

## 数据和备份

Docker 运行数据都在服务器目录：

```text
/opt/shanzhao
```

目录内容：

```text
mysql/      内置 MariaDB 数据
uploads/    本地上传文件
runtime/    运行配置和安装锁
```

迁移服务器或升级前，先备份整个目录：

```bash
tar -czf shanzhao-backup.tar.gz /opt/shanzhao
```

更新镜像：

```bash
docker pull ghcr.io/qiantingwl/shanzhao:latest
docker rm -f shanzhao
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```

## 内容审核

后台系统配置中可以自由切换 5 种审核方式：

```text
阿里云：使用阿里云图片内容安全 SDK，直接审核上传文件。
vxlink/nsfw_detector：对接 vxlink/nsfw_detector 容器服务。
helloz/nsfw：对接 helloz/nsfw 容器服务。
nsfwpy：对接 nsfwpy 容器服务。
虚假接口：直接放行，仅用于测试。
```

内容审核开关含义：

```text
1=使用当前选择的审核接口
0=关闭审核，上传图片直接通过
```

## 本地源码目录

```text
backend/      后端 NestJS 源码，负责 API、上传、审核、存储、清理任务。
admin/        后台管理端 Vue 源码，负责后台页面和配置管理。
shan/         uni-app 小程序源码，发布前修改接口域名。
docker/       Docker 镜像构建文件和容器初始化脚本。
```

关键文件：

```text
backend/src/common/services/image-audit.service.ts   图片审核服务。
backend/src/common/services/storage.service.ts       本地/COS/OSS 存储服务。
backend/src/upload/upload.controller.ts              图片上传、审核、缩略图生成。
backend/src/config/cleanup.task.ts                   删除数据定时清理任务。
admin/src/views/sys-config/index.vue                 后台系统配置页面。
shan/utils/config.js                                 小程序后端域名配置。
docker/Dockerfile                                    Docker 镜像构建文件。
docker/entrypoint.sh                                 容器启动和 MariaDB 初始化脚本。
docker/container-init.sql                            内置数据库表结构。
```

## 本地开发

后端：

```bash
cd backend
npm install
npm run build
npm run start:dev
```

后台：

```bash
cd admin
pnpm install
pnpm build
pnpm dev
```

小程序：

```text
使用 HBuilderX 或微信开发者工具打开 shan/。
发布前修改 shan/utils/config.js 中的 DEFAULT_BASE_URL。
```

## 构建 Docker 镜像

```bash
docker build -f docker/Dockerfile -t ghcr.io/qiantingwl/shanzhao:latest .
docker push ghcr.io/qiantingwl/shanzhao:latest
```

## 不应提交的内容

```text
node_modules/
dist/
uploads/
runtime/
unpackage/
.env
deploy.zip
```

这些内容是依赖、构建产物、运行数据或本地密钥，已经通过 `.gitignore` 忽略。
