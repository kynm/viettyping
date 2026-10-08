-- AlterTable
ALTER TABLE `student_attempts` ADD COLUMN `active_since` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `question_durations` JSON NULL;

UPDATE `student_attempts` SET `question_durations` = '{}' WHERE `question_durations` IS NULL;
ALTER TABLE `student_attempts` MODIFY `question_durations` JSON NOT NULL;
