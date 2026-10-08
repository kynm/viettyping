-- AlterTable
ALTER TABLE `student_attempts` ADD COLUMN `label` VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN `mode` VARCHAR(20) NOT NULL DEFAULT 'exercise';

-- CreateTable
CREATE TABLE `student_exercise_badges` (
    `student_id` INTEGER UNSIGNED NOT NULL,
    `badge` VARCHAR(50) NOT NULL,
    `awarded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`student_id`, `badge`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_daily_bonuses` (
    `student_id` INTEGER UNSIGNED NOT NULL,
    `day` VARCHAR(10) NOT NULL,
    `xp` INTEGER NOT NULL DEFAULT 10,

    PRIMARY KEY (`student_id`, `day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_exercise_badges` ADD CONSTRAINT `student_exercise_badges_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_daily_bonuses` ADD CONSTRAINT `student_daily_bonuses_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

