# 闪照小程序 Docker 部署

本仓库只提供 Docker 部署说明。程序源码不在此仓库公开，实际运行程序已打包到 Docker 镜像中。

## 镜像地址

```bash
ghcr.io/qiantingwl/shanzhao:latest
```

## 一键部署

```bash
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```

访问：

```text
http://服务器IP:3000/
```

默认后台账号：

```text
账号：admin
密码：admin123
```

## 宝塔 Docker 部署

在宝塔 Docker 中拉取镜像：

```bash
docker pull ghcr.io/qiantingwl/shanzhao:latest
```

创建容器时填写：

```text
镜像：ghcr.io/qiantingwl/shanzhao:latest
容器端口：3000
服务器端口：3000
目录挂载：/opt/shanzhao -> /app/data
重启策略：always
```

## Docker Compose

```bash
mkdir -p /opt/shanzhao
cd /opt/shanzhao
curl -O https://raw.githubusercontent.com/qiantingwl/shanzhao/main/docker-compose.yml
docker compose up -d
```

## 反向代理

线上建议使用 HTTPS 域名反向代理到：

```text
http://127.0.0.1:3000
```

微信小程序后台需要把 `request`、`uploadFile`、`downloadFile` 合法域名配置为你的 HTTPS 域名。

## 数据和备份

所有运行数据都在：

```text
/opt/shanzhao
```

目录内容：

```text
mysql/      内置 MariaDB 数据
uploads/    本地上传文件
runtime/    运行配置和安装锁
```

备份：

```bash
tar -czf shanzhao-backup.tar.gz /opt/shanzhao
```

## 更新

```bash
docker pull ghcr.io/qiantingwl/shanzhao:latest
docker rm -f shanzhao
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```
