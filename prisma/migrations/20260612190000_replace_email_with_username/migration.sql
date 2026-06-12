ALTER TABLE `users` DROP INDEX `users_email_key`;
ALTER TABLE `users` CHANGE COLUMN `email` `username` VARCHAR(30) NOT NULL;
ALTER TABLE `users` ADD UNIQUE INDEX `users_username_key`(`username`);
