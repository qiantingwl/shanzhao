-- ============================================================
-- 闪照小程序 - 数据库初始化脚本
-- 适用环境：MySQL 5.7+ / 8.x
-- 用法：mysql -u root -p < init.sql
-- ============================================================

-- 1. 创建数据库（如已存在会跳过）
CREATE DATABASE IF NOT EXISTS `shanzhao` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE `shanzhao`;

-- 2. 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `openid` varchar(64) NOT NULL,
  `nickname` varchar(128) DEFAULT NULL,
  `avatar` varchar(512) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `isBanned` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_users_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 管理员表
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` char(36) NOT NULL,
  `username` varchar(64) NOT NULL,
  `password` varchar(256) NOT NULL,
  `nickname` varchar(64) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_admin_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 闪图表
CREATE TABLE IF NOT EXISTS `flash` (
  `id` char(36) NOT NULL,
  `authorId` varchar(64) NOT NULL,
  `filePath` varchar(512) NOT NULL,
  `fileThumb` varchar(512) DEFAULT NULL,
  `fileMasai` varchar(512) DEFAULT NULL,
  `fileShare` varchar(512) DEFAULT NULL,
  `fileOrigin` varchar(1) NOT NULL DEFAULT '0',
  `originFlag` varchar(1) NOT NULL DEFAULT '1',
  `screenFlag` varchar(1) NOT NULL DEFAULT '1',
  `shareFlag` varchar(1) NOT NULL DEFAULT '1',
  `adFlag` varchar(1) NOT NULL DEFAULT '0',
  `maxNum` int NOT NULL DEFAULT 1,
  `maxSec` int NOT NULL DEFAULT 3,
  `status` enum('0','1','2','3') NOT NULL DEFAULT '1',
  `delFlag` varchar(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_flash_authorId` (`authorId`),
  KEY `IDX_flash_status` (`status`),
  KEY `IDX_flash_delFlag` (`delFlag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 查看记录表
CREATE TABLE IF NOT EXISTS `flash_records` (
  `id` char(36) NOT NULL,
  `flashId` varchar(64) NOT NULL,
  `userId` varchar(64) DEFAULT NULL,
  `recordMode` varchar(1) NOT NULL DEFAULT '0',
  `viewSec` int DEFAULT NULL,
  `screenFlag` varchar(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_flash_records_flashId` (`flashId`),
  KEY `IDX_flash_records_userId` (`userId`),
  KEY `IDX_flash_records_recordMode` (`recordMode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 系统配置表
CREATE TABLE IF NOT EXISTS `sys_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(64) NOT NULL,
  `value` text NOT NULL,
  `remark` varchar(256) DEFAULT NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_sys_config_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 帮助/常见问题表
CREATE TABLE IF NOT EXISTS `help` (
  `id` char(36) NOT NULL,
  `feedName` varchar(128) NOT NULL,
  `feedCont` text NOT NULL,
  `sort` int NOT NULL DEFAULT 0,
  `delFlag` varchar(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_help_sort` (`sort`),
  KEY `IDX_help_delFlag` (`delFlag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 用户封禁表
CREATE TABLE IF NOT EXISTS `user_bans` (
  `id` char(36) NOT NULL,
  `userId` varchar(64) NOT NULL,
  `banDay` int NOT NULL DEFAULT 0,
  `banReason` varchar(255) DEFAULT NULL,
  `banAuthority` int NOT NULL DEFAULT 2,
  `createTime` datetime DEFAULT NULL,
  `secureTime` datetime DEFAULT NULL,
  `delFlag` varchar(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_user_bans_userId` (`userId`),
  KEY `IDX_user_bans_delFlag` (`delFlag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 初始数据
-- ============================================================

-- 帮助/常见问题初始内容（重复执行安全）
INSERT INTO `help` (`id`, `feedName`, `feedCont`, `sort`)
SELECT * FROM (SELECT UUID(), '如何创建闪图', '首页上传照片之后点击"创建闪图"按钮即可创建，创建成功之后可以分享给好友查看。', 1) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `help` WHERE `feedName` = '如何创建闪图' AND `delFlag` = '0');

INSERT INTO `help` (`id`, `feedName`, `feedCont`, `sort`)
SELECT * FROM (SELECT UUID(), '为什么不能截图', '开启禁止截屏后，安卓端会尽量阻止截图，苹果端会记录截图提示。最终能力以微信环境支持为准。', 2) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `help` WHERE `feedName` = '为什么不能截图' AND `delFlag` = '0');

INSERT INTO `help` (`id`, `feedName`, `feedCont`, `sort`)
SELECT * FROM (SELECT UUID(), '分享后在哪里查看记录', '创建成功后点击"查看记录"，或在底部"记录"页进入详情查看浏览记录。', 3) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `help` WHERE `feedName` = '分享后在哪里查看记录' AND `delFlag` = '0');
