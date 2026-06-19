CREATE TABLE `homework` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`title` text NOT NULL,
	`due_at` integer,
	`done` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `homework_subject_idx` ON `homework` (`subject_id`);--> statement-breakpoint
CREATE INDEX `homework_due_idx` ON `homework` (`due_at`);--> statement-breakpoint
CREATE TABLE `timetable_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`period` integer NOT NULL,
	`start_min` integer,
	`end_min` integer,
	`room` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `timetable_slots_subject_idx` ON `timetable_slots` (`subject_id`);