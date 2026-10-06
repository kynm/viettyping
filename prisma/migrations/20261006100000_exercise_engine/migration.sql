-- AlterTable
ALTER TABLE `users` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE `exercises` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_by` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `grade` INTEGER NOT NULL,
    `skill` VARCHAR(30) NOT NULL,
    `difficulty` VARCHAR(20) NOT NULL,
    `course` VARCHAR(120) NOT NULL DEFAULT 'English',
    `unit` VARCHAR(120) NOT NULL,
    `lesson` VARCHAR(120) NOT NULL,
    `time_limit` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `questions` JSON NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `exercises_status_grade_skill_idx`(`status`, `grade`, `skill`),
    INDEX `exercises_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_assignments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `exercise_id` INTEGER UNSIGNED NOT NULL,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `attempts_allowed` INTEGER NOT NULL DEFAULT 1,
    `time_limit` INTEGER NOT NULL DEFAULT 0,
    `random_questions` BOOLEAN NOT NULL DEFAULT false,
    `random_answers` BOOLEAN NOT NULL DEFAULT false,
    `show_result` BOOLEAN NOT NULL DEFAULT true,
    `show_answer` BOOLEAN NOT NULL DEFAULT false,

    INDEX `exercise_assignments_student_id_ends_at_idx`(`student_id`, `ends_at`),
    UNIQUE INDEX `exercise_assignments_exercise_id_student_id_key`(`exercise_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_attempts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `exercise_id` INTEGER UNSIGNED NOT NULL,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `assignment_id` INTEGER UNSIGNED NULL,
    `snapshot` JSON NOT NULL,
    `answers` JSON NOT NULL,
    `current_index` INTEGER NOT NULL DEFAULT 0,
    `revision` INTEGER NOT NULL DEFAULT 0,
    `score` DOUBLE NULL,
    `total_score` DOUBLE NOT NULL,
    `correct` INTEGER NOT NULL DEFAULT 0,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deadline` DATETIME(3) NULL,
    `submitted_at` DATETIME(3) NULL,
    `show_result` BOOLEAN NOT NULL DEFAULT true,
    `show_answer` BOOLEAN NOT NULL DEFAULT false,

    INDEX `student_attempts_student_id_exercise_id_submitted_at_idx`(`student_id`, `exercise_id`, `submitted_at`),
    INDEX `student_attempts_assignment_id_idx`(`assignment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_rewards` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `exercise_id` INTEGER UNSIGNED NOT NULL,
    `xp` INTEGER NOT NULL,
    `stars` INTEGER NOT NULL,
    `badge` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `exercise_rewards_student_id_exercise_id_key`(`student_id`, `exercise_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_assignments` ADD CONSTRAINT `exercise_assignments_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_assignments` ADD CONSTRAINT `exercise_assignments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attempts` ADD CONSTRAINT `student_attempts_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attempts` ADD CONSTRAINT `student_attempts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attempts` ADD CONSTRAINT `student_attempts_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `exercise_assignments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_rewards` ADD CONSTRAINT `exercise_rewards_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_rewards` ADD CONSTRAINT `exercise_rewards_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
