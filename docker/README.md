# Docker 部署说明

镜像地址：

```bash
ghcr.io/qiantingwl/shanzhao:latest
```

这是单容器镜像，内置后端 API、后台管理端和 MariaDB 数据库。

## 宝塔部署

先在宝塔 Docker 的“命令拉取”中执行：

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

访问：

```text
http://服务器IP:3000/
```

默认后台账号：

```text
admin
admin123
```

## 命令行部署

```bash
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```

## 数据目录

服务器上的数据目录为：

```text
/opt/shanzhao
```

其中包含：

```text
mysql/      数据库文件
uploads/    上传文件
runtime/    运行配置
```
