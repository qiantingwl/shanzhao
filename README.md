# 闪照小程序

微信小程序闪照/阅后即焚图片系统。Docker 一键部署，内置后端、管理后台和数据库。

## 上线只需 4 步

### 1. 拉取镜像并启动

```bash
docker run -d --name shanzhao --restart always \
  -p 3000:3000 -v /opt/shanzhao:/app/data \
  ghcr.io/qiantingwl/shanzhao:latest
```

启动后访问 `http://服务器IP:3000/`，默认账号 `admin` / `admin123`，首次登录请改密码。数据库、管理后台、上传服务全部内置，无需额外配置。

### 2. 反向代理 HTTPS 域名

微信小程序要求 HTTPS，需用 Nginx（或宝塔）把域名反代到后端。关键：上传图片最大 9MB，必须把 `client_max_body_size` 调大，否则大图上传会 413 失败。

```nginx
server {
  listen 443 ssl;
  server_name your-domain.com;

  # ssl_certificate / ssl_certificate_key 由证书工具或宝塔自动填写

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

后台、API、上传文件都走同一个域名，`location /` 全部转发即可，无需单独配置 `/api` 或 `/uploads`。

### 3. 后台填写微信和可选配置

登录后台 → 系统配置：

```text
微信小程序：填入 AppID、AppSecret（小程序登录必填）
图片审核：可选，支持阿里云/vxlink/helloz/nsfwpy，默认关闭
存储配置：可选，默认本地存储，可切换腾讯云 COS / 阿里云 OSS
```

微信配置保存后立即生效，无需重启容器。

### 4. 修改小程序域名并发布

```text
1. 修改 shan/utils/config.js 的 DEFAULT_BASE_URL 为第 2 步的 HTTPS 域名
2. 微信公众平台把 request、uploadFile、downloadFile 合法域名都配置为该域名
3. 用 HBuilderX 或微信开发者工具发布 shan/ 小程序
```

## 宝塔 Docker

```text
镜像：ghcr.io/qiantingwl/shanzhao:latest
端口：3000:3000
挂载：/opt/shanzhao -> /app/data
重启策略：always
```

反代用宝塔「网站 → 反向代理」指向 `http://127.0.0.1:3000`，并在配置里加 `client_max_body_size 12m;`。

## 更新

```bash
docker pull ghcr.io/qiantingwl/shanzhao:latest
docker rm -f shanzhao
docker run -d --name shanzhao --restart always \
  -p 3000:3000 -v /opt/shanzhao:/app/data \
  ghcr.io/qiantingwl/shanzhao:latest
```

数据在 `/opt/shanzhao`，不删目录就不丢数据。迁移前备份：

```bash
tar -czf shanzhao-backup.tar.gz /opt/shanzhao
```

## 源码结构

```text
backend/   后端 NestJS (API、上传、审核、存储、清理)
admin/     管理后台 Vue
shan/      uni-app 小程序
docker/    Dockerfile + 初始化脚本
```

## 构建镜像

```bash
docker build -f docker/Dockerfile -t ghcr.io/qiantingwl/shanzhao:latest .
docker push ghcr.io/qiantingwl/shanzhao:latest
```
