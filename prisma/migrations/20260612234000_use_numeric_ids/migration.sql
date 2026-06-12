SET FOREIGN_KEY_CHECKS = 0;

RENAME TABLE `users` TO `users_legacy_ids`;
RENAME TABLE `student_profiles` TO `student_profiles_legacy_ids`;
RENAME TABLE `student_data` TO `student_data_legacy_ids`;
RENAME TABLE `sessions` TO `sessions_legacy_ids`;

ALTER TABLE `student_profiles_legacy_ids` DROP FOREIGN KEY `student_profiles_user_id_fkey`;
ALTER TABLE `student_data_legacy_ids` DROP FOREIGN KEY `student_data_user_id_fkey`;
ALTER TABLE `sessions_legacy_ids` DROP FOREIGN KEY `sessions_user_id_fkey`;

CREATE TEMPORARY TABLE `user_id_map` (
    `new_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `old_id` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`new_id`),
    UNIQUE INDEX `user_id_map_old_id_key` (`old_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `user_id_map` (`old_id`)
SELECT `id`
FROM `users_legacy_ids`
ORDER BY `created_at`, `id`;

CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(30) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `users_username_key` (`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_profiles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(120) NOT NULL DEFAULT '',
    `nickname` VARCHAR(80) NOT NULL DEFAULT '',
    `grade` VARCHAR(30) NOT NULL DEFAULT 'Lớp 1',
    `avatar` VARCHAR(20) NOT NULL DEFAULT '🦖',
    `theme` VARCHAR(30) NOT NULL DEFAULT 'dino',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `student_profiles_user_id_key` (`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `student_data_user_id_key` (`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `sessions_token_hash_key` (`token_hash`),
    INDEX `sessions_user_id_idx` (`user_id`),
    INDEX `sessions_expires_at_idx` (`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `username`, `password_hash`, `created_at`, `updated_at`)
SELECT map.`new_id`, legacy.`username`, legacy.`password_hash`, legacy.`created_at`, legacy.`updated_at`
FROM `users_legacy_ids` legacy
JOIN `user_id_map` map ON map.`old_id` = legacy.`id`;

INSERT INTO `student_profiles` (`user_id`, `name`, `nickname`, `grade`, `avatar`, `theme`, `created_at`, `updated_at`)
SELECT map.`new_id`, legacy.`name`, legacy.`nickname`, legacy.`grade`, legacy.`avatar`, legacy.`theme`, legacy.`created_at`, legacy.`updated_at`
FROM `student_profiles_legacy_ids` legacy
JOIN `user_id_map` map ON map.`old_id` = legacy.`user_id`
ORDER BY legacy.`created_at`, legacy.`id`;

INSERT INTO `student_data` (`user_id`, `data`, `created_at`, `updated_at`)
SELECT map.`new_id`, legacy.`data`, legacy.`created_at`, legacy.`updated_at`
FROM `student_data_legacy_ids` legacy
JOIN `user_id_map` map ON map.`old_id` = legacy.`user_id`
ORDER BY legacy.`created_at`, legacy.`id`;

INSERT INTO `sessions` (`user_id`, `token_hash`, `expires_at`, `created_at`)
SELECT map.`new_id`, legacy.`token_hash`, legacy.`expires_at`, legacy.`created_at`
FROM `sessions_legacy_ids` legacy
JOIN `user_id_map` map ON map.`old_id` = legacy.`user_id`
ORDER BY legacy.`created_at`, legacy.`id`;

ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_data` ADD CONSTRAINT `student_data_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE `sessions_legacy_ids`;
DROP TABLE `student_data_legacy_ids`;
DROP TABLE `student_profiles_legacy_ids`;
DROP TABLE `users_legacy_ids`;

SET FOREIGN_KEY_CHECKS = 1;
