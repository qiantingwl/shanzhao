# 仓库说明

本仓库用于展示闪照小程序 Docker 镜像的部署说明。

公开仓库只保留：

```text
README.md              中文部署教程
PROJECT_STRUCTURE.md   仓库说明
docker/README.md       Docker 部署说明
```

以下内容不在公开仓库中发布：

```text
admin/                 后台管理端源码
backend/               后端源码
shan/                  小程序前端源码
docker/Dockerfile      镜像构建文件
docker/entrypoint.sh   容器启动脚本
```

客户部署只需要拉取镜像：

```bash
docker pull ghcr.io/qiantingwl/shanzhao:latest
```

或直接运行：

```bash
docker run -d --name shanzhao --restart always -p 3000:3000 -v /opt/shanzhao:/app/data ghcr.io/qiantingwl/shanzhao:latest
```
