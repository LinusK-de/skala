CREATE TABLE `grade_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'written' NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `grade_categories_subject_idx` ON `grade_categories` (`subject_id`);--> statement-breakpoint
CREATE TABLE `grades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`category_id` integer,
	`term_id` integer NOT NULL,
	`value` real NOT NULL,
	`tendency` integer,
	`weight` real DEFAULT 1 NOT NULL,
	`date` integer NOT NULL,
	`note` text,
	`counts_toward_average` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `grade_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `grades_subject_idx` ON `grades` (`subject_id`);--> statement-breakpoint
CREATE INDEX `grades_term_idx` ON `grades` (`term_id`);--> statement-breakpoint
CREATE INDEX `grades_category_idx` ON `grades` (`category_id`);--> statement-breakpoint
CREATE TABLE `stages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`school_type` text NOT NULL,
	`scale` text NOT NULL,
	`grade_from` integer NOT NULL,
	`grade_to` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage_id` integer NOT NULL,
	`name` text NOT NULL,
	`color_key` text DEFAULT 'accent1' NOT NULL,
	`is_core` integer DEFAULT false NOT NULL,
	`written_weight` real DEFAULT 1 NOT NULL,
	`oral_weight` real DEFAULT 1 NOT NULL,
	`target_grade` real,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subjects_stage_idx` ON `subjects` (`stage_id`);--> statement-breakpoint
CREATE TABLE `terms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage_id` integer NOT NULL,
	`school_year` text NOT NULL,
	`grade_level` integer NOT NULL,
	`half` integer NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_current` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `terms_stage_idx` ON `terms` (`stage_id`);