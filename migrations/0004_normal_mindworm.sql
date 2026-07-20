PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_fill_ups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`date` text NOT NULL,
	`odometer_km` integer NOT NULL,
	`liters` real NOT NULL,
	`total_price` real NOT NULL,
	`fuel_type` text NOT NULL,
	`is_full_tank` integer DEFAULT true NOT NULL,
	`trip_type` text DEFAULT 'city' NOT NULL,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "fill_ups_fuel_type_check" CHECK("__new_fill_ups"."fuel_type" in ('gasoline','ethanol')),
	CONSTRAINT "fill_ups_trip_type_check" CHECK("__new_fill_ups"."trip_type" in ('road','city'))
);
--> statement-breakpoint
INSERT INTO `__new_fill_ups`("id", "vehicle_id", "created_at", "date", "odometer_km", "liters", "total_price", "fuel_type", "is_full_tank", "trip_type", "notes") SELECT "id", "vehicle_id", "created_at", "date", "odometer_km", "liters", "total_price", "fuel_type", "is_full_tank", COALESCE("trip_type", 'city'), "notes" FROM `fill_ups`;--> statement-breakpoint
DROP TABLE `fill_ups`;--> statement-breakpoint
ALTER TABLE `__new_fill_ups` RENAME TO `fill_ups`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `fill_ups_vehicle_id_idx` ON `fill_ups` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `fill_ups_date_idx` ON `fill_ups` (`date`);--> statement-breakpoint
CREATE INDEX `fill_ups_odometer_km_idx` ON `fill_ups` (`odometer_km`);--> statement-breakpoint
CREATE INDEX `fill_ups_vehicle_odometer_idx` ON `fill_ups` (`vehicle_id`,`odometer_km`);