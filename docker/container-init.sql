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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `flash_records` (
  `id` char(36) NOT NULL,
  `flashId` varchar(64) NOT NULL,
  `userId` varchar(64) DEFAULT NULL,
  `recordMode` varchar(1) NOT NULL DEFAULT '0',
  `viewSec` int DEFAULT NULL,
  `screenFlag` varchar(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(64) NOT NULL,
  `value` text NOT NULL,
  `remark` varchar(256) DEFAULT NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_sys_config_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `help` (
  `id` char(36) NOT NULL,
  `feedName` varchar(128) NOT NULL,
  `feedCont` text NOT NULL,
  `sort` int NOT NULL DEFAULT 0,
  `delFlag` varchar(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
