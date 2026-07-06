CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`thumbnail_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fill_ups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`date` text NOT NULL,
	`odometer_km` integer NOT NULL,
	`liters` real NOT NULL,
	`total_price` real NOT NULL,
	`fuel_type` text NOT NULL,
	`is_full_tank` integer DEFAULT true NOT NULL,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "fill_ups_fuel_type_check" CHECK("fill_ups"."fuel_type" in ('gasoline','ethanol','diesel','flex','cng'))
);
--> statement-breakpoint
CREATE INDEX `fill_ups_vehicle_id_idx` ON `fill_ups` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `fill_ups_date_idx` ON `fill_ups` (`date`);--> statement-breakpoint
CREATE INDEX `fill_ups_odometer_km_idx` ON `fill_ups` (`odometer_km`);--> statement-breakpoint
CREATE INDEX `fill_ups_vehicle_odometer_idx` ON `fill_ups` (`vehicle_id`,`odometer_km`);