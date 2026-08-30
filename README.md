# 闪照相机

一套可自托管的微信小程序闪照系统，用于创建限时、限次查看的图片。仓库包含微信小程序、NestJS API、Vue 管理后台和单容器部署配置，首次启动为空数据，不附带演示账号或演示业务数据。

## 功能

- 娱乐模式与保密模式，可独立控制来源提示、防截屏、设备限制、转发限制和广告策略
- 查看次数、查看时长、撤回、软删除、浏览记录与广告解锁
- 截图和录屏记录、设备信息记录、累计违规自动封禁
- 本地存储、腾讯云 COS、阿里云 OSS
- 可选图片审核：阿里云内容安全、vxlink、helloz、nsfwpy
- 管理后台：运营数据、闪照管理、用户封禁、系统配置
- Docker 单容器运行 Node.js、管理后台和 MariaDB，数据统一持久化

## 项目结构

```text
admin/      Vue 3 + Vite + TypeScript 管理后台
backend/    NestJS + TypeORM API
docker/     单容器构建、数据库初始化和启动脚本
shan/       uni-app 微信小程序
compose.yaml
```

更完整的模块和接口说明见 [PROJECT.md](PROJECT.md)。

## 一键部署

要求：已安装 Docker Engine 24+ 和 Docker Compose v2。

```bash
git clone https://github.com/qiantingwl/shanzhao.git
cd shanzhao
docker compose up -d
docker compose logs shanzhao
```

首次启动会自动创建数据库、生成 JWT 密钥和随机后台密码。日志中的 `Admin username` 与 `Admin password` 只在初始化时生成；请登录 `http://服务器IP:3000/` 后立即修改密码。

数据保存在 Docker 卷 `shanzhao-data`。生产环境也可以显式挂载宿主机目录：

```bash
docker run -d --name shanzhao --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/shanzhao:/app/data \
  ghcr.io/qiantingwl/shanzhao:latest

docker logs shanzhao
```

如需指定初始管理员，首次启动时传入环境变量：

```bash
docker run -d --name shanzhao --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/shanzhao:/app/data \
  -e ADMIN_USER=admin \
  -e ADMIN_PASSWORD='请替换为强密码' \
  ghcr.io/qiantingwl/shanzhao:latest
```

`ADMIN_PASSWORD` 仅在全新数据目录初始化时生效。

## 配置 HTTPS

微信小程序只允许 HTTPS 请求。将域名反向代理到 `127.0.0.1:3000`，并允许略大于小程序上传上限的请求体：

```nginx
server {
  listen 443 ssl;
  server_name flash.example.com;

  # ssl_certificate 与 ssl_certificate_key 按证书服务商配置
  client_max_body_size 12m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

后台、API 和上传文件共用一个域名，不需要分别配置 `/api` 与 `/uploads`。

## 配置并发布小程序

1. 登录管理后台，在“系统配置 -> 微信小程序”填写 AppID 和 AppSecret。
2. 修改 `shan/utils/config.js` 中的 `DEFAULT_BASE_URL`，使用上一步配置的 HTTPS 域名，不要带末尾 `/`。
3. 在微信公众平台将该域名加入 `request`、`uploadFile` 和 `downloadFile` 合法域名。
4. 在 `shan/manifest.json` 和 `shan/project.config.json` 中填写自己的小程序 AppID。
5. 使用 HBuilderX 导入 `shan/`，发行到微信小程序；也可先编译，再用微信开发者工具打开产物。

广告位、图片审核和对象存储均为可选配置。未配置时使用本地存储，图片审核默认关闭。

## 源码开发

### 后端

要求：Node.js 22+、MariaDB 10.6+。

```bash
cd backend
cp .env.example .env
npm ci
npm run start:dev
```

开发模式会由 TypeORM 同步表结构。不要在生产环境开启自动同步；Docker 镜像通过 `docker/container-init.sql` 管理兼容迁移。

### 管理后台

要求：pnpm 10+。

```bash
cd admin
pnpm install --frozen-lockfile
pnpm dev
```

开发环境默认请求 `http://127.0.0.1:3000/api/admin`。生产构建：

```bash
pnpm build
```

### 微信小程序

`shan/` 是 uni-app 项目。配置 API 域名与 AppID 后，通过 HBuilderX 编译为微信小程序。真机调试前请确认 HTTPS 证书链完整，且三个合法域名均已生效。

## 更新与备份

使用 Compose：

```bash
docker compose pull
docker compose up -d
```

使用宿主机目录挂载：

```bash
tar -czf shanzhao-backup.tar.gz /opt/shanzhao
docker pull ghcr.io/qiantingwl/shanzhao:latest
docker rm -f shanzhao
# 使用原来的 -v /opt/shanzhao:/app/data 参数重新启动
```

不要删除或替换 `/app/data`，其中包含数据库、上传文件和运行时密钥。

## 常见问题

- 后台打不开：确认容器状态和 `3000` 端口放行，执行 `docker logs shanzhao` 查看启动日志。
- 忘记初始密码：初始化日志保存在数据目录的 `runtime/auto-install-info.txt`；也可在容器内执行 `cat /app/data/runtime/auto-install-info.txt`。
- 上传返回 413：提高反向代理的 `client_max_body_size`。
- 小程序请求失败：检查 HTTPS 证书、`DEFAULT_BASE_URL` 和微信公众平台合法域名。
- 微信登录提示未配置：在后台填写 AppID/AppSecret；保存后立即生效。

## 安全与开源

- 不要提交 `.env`、数据库目录、上传文件、云存储密钥或微信 AppSecret。
- 首次登录后修改管理员密码，并限制管理后台的公网访问范围。
- 图片审核默认关闭，公开运营前应按业务和合规要求启用审核服务。
- 本项目基于 [MIT License](LICENSE) 开源。
