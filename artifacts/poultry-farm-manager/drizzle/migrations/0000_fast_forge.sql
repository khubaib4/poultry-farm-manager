CREATE TABLE `daily_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flock_id` integer,
	`entry_date` text NOT NULL,
	`deaths` integer DEFAULT 0,
	`death_cause` text,
	`eggs_grade_a` integer DEFAULT 0,
	`eggs_grade_b` integer DEFAULT 0,
	`eggs_cracked` integer DEFAULT 0,
	`feed_consumed_kg` real DEFAULT 0,
	`water_consumed_liters` real,
	`notes` text,
	`recorded_by` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`flock_id`) REFERENCES `flocks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_entries_flock_date_unique` ON `daily_entries` (`flock_id`,`entry_date`);--> statement-breakpoint
CREATE TABLE `egg_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer,
	`grade` text NOT NULL,
	`price_per_egg` real NOT NULL,
	`price_per_tray` real NOT NULL,
	`effective_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer,
	`category` text NOT NULL,
	`description` text,
	`amount` real NOT NULL,
	`expense_date` text NOT NULL,
	`supplier` text,
	`receipt_ref` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer,
	`name` text NOT NULL,
	`location` text,
	`capacity` integer,
	`login_username` text NOT NULL,
	`login_password_hash` text NOT NULL,
	`is_active` integer DEFAULT 1,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `farms_login_username_unique` ON `farms` (`login_username`);--> statement-breakpoint
CREATE TABLE `flocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer,
	`batch_name` text NOT NULL,
	`breed` text,
	`initial_count` integer NOT NULL,
	`current_count` integer NOT NULL,
	`arrival_date` text NOT NULL,
	`age_at_arrival_days` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer,
	`item_type` text NOT NULL,
	`item_name` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`min_threshold` real,
	`expiry_date` text,
	`last_updated` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `owners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `owners_email_unique` ON `owners` (`email`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_active` integer DEFAULT 1,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vaccination_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vaccine_name` text NOT NULL,
	`age_days` integer NOT NULL,
	`is_mandatory` integer DEFAULT 1,
	`route` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `vaccinations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flock_id` integer,
	`vaccine_name` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`administered_date` text,
	`administered_by` text,
	`batch_number` text,
	`notes` text,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`flock_id`) REFERENCES `flocks`(`id`) ON UPDATE no action ON DELETE no action
);
