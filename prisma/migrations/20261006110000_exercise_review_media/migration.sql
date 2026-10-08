-- AlterTable
ALTER TABLE `student_attempts` ADD COLUMN `manual_grades` JSON NULL,
    ADD COLUMN `needs_review` BOOLEAN NOT NULL DEFAULT false;

UPDATE `student_attempts` SET `manual_grades` = '{}' WHERE `manual_grades` IS NULL;
ALTER TABLE `student_attempts` MODIFY `manual_grades` JSON NOT NULL;

-- CreateTable
CREATE TABLE `exercise_media` (
    `id` VARCHAR(80) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `attempt_id` INTEGER UNSIGNED NULL,
    `mime` VARCHAR(80) NOT NULL,
    `size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exercise_media_user_id_idx`(`user_id`),
    INDEX `exercise_media_attempt_id_idx`(`attempt_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exercise_media` ADD CONSTRAINT `exercise_media_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_media` ADD CONSTRAINT `exercise_media_attempt_id_fkey` FOREIGN KEY (`attempt_id`) REFERENCES `student_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
