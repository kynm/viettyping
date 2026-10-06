-- AlterTable
ALTER TABLE `exercises` ADD COLUMN `leaderboard_enabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `classrooms` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `teacher_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(120) NOT NULL,

    INDEX `classrooms_teacher_id_idx`(`teacher_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classroom_members` (
    `classroom_id` INTEGER UNSIGNED NOT NULL,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `group_name` VARCHAR(80) NOT NULL DEFAULT '',

    INDEX `classroom_members_student_id_idx`(`student_id`),
    PRIMARY KEY (`classroom_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `classrooms` ADD CONSTRAINT `classrooms_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_members` ADD CONSTRAINT `classroom_members_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_members` ADD CONSTRAINT `classroom_members_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

