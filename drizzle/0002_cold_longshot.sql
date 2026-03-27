CREATE TABLE `agent_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`stepIndex` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`toolName` varchar(64),
	`toolInput` text,
	`toolOutput` text,
	`status` enum('pending','running','completed','failed','skipped') NOT NULL DEFAULT 'pending',
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int,
	`goal` text NOT NULL,
	`plan` text,
	`status` enum('planning','running','paused','completed','failed') NOT NULL DEFAULT 'planning',
	`currentStep` int NOT NULL DEFAULT 0,
	`totalSteps` int NOT NULL DEFAULT 0,
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` varchar(64) NOT NULL,
	`config` text,
	`status` enum('active','inactive','error') NOT NULL DEFAULT 'inactive',
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`source` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int,
	`query` text NOT NULL,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`sourcesCount` int NOT NULL DEFAULT 0,
	`findings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`cronExpression` varchar(64),
	`prompt` text NOT NULL,
	`model` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`lastResult` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`category` varchar(64),
	`instructions` text NOT NULL,
	`triggerCommand` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
