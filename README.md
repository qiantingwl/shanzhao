# 闪照小程序 Docker 部署

这是一个用于微信小程序的闪照/阅后即焚图片系统，提供小程序接口、后台管理端、图片上传、内容审核配置、用户管理、闪照记录管理等功能。

本仓库只提供部署说明。程序源码不在此公开，实际运行程序已经打包到 Docker 镜像中。

## 镜像地址

```bash
ghcr.io/qiantingwl/shanzhao:latest
```

镜像内置：

```text
后端 API
后台管理端
MariaDB 数据库
首次启动自动初始化
本地数据挂载目录 /app/data
```

## 默认后台账号

```text
账号：admin
密码：admin123
```

首次登录后请及时修改密码。

## 宝塔面板部署

在宝塔 Docker 的“命令拉取”中执行：

```bash
docker pull ghcr.io/qiantingwl/shanzhao:latest
```

然后创建容器：

```text
镜像：ghcr.io/qiantingwl/shanzhao:latest
容器端口：3000
服务器端口：3000
目录挂载：/opt/shanzhao -> /app/data
重启策略：always
```

启动后访问：

```text
http://服务器IP:3000/
```

## 命令行部署

```bash
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```

查看运行日志：

```bash
docker logs shanzhao
```

停止并删除容器：

```bash
docker rm -f shanzhao
```

## 反向代理

在宝塔中新建站点，开启 HTTPS，然后反向代理到：

```text
http://127.0.0.1:3000
```

小程序后台需要把 request、uploadFile、downloadFile 合法域名配置为你的 HTTPS 域名。

## 数据目录和备份

所有运行数据都在服务器目录：

```text
/opt/shanzhao
```

目录内容：

```text
mysql/      内置 MariaDB 数据
uploads/    本地上传文件
runtime/    运行配置和安装锁
```

迁移服务器或升级前，请先备份整个目录：

```bash
tar -czf shanzhao-backup.tar.gz /opt/shanzhao
```

## 更新镜像

```bash
docker pull ghcr.io/qiantingwl/shanzhao:latest
docker rm -f shanzhao
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```

## 常见问题

### 宝塔提示 unauthorized

说明镜像还不是公开状态。请确认 GitHub Packages 中的 `shanzhao` 已经设置为 Public。

### 端口打不开

请检查服务器安全组、防火墙和宝塔端口放行，确保 3000 端口可以访问。

### 数据会不会丢失

只要 `/opt/shanzhao` 没删除，重建容器不会丢失数据。
