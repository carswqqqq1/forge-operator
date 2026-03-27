CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT 'New Conversation',
	`model` varchar(128) NOT NULL DEFAULT 'llama3',
	`systemPrompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isArchived` boolean NOT NULL DEFAULT false,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('system','user','assistant','tool') NOT NULL,
	`content` text NOT NULL,
	`model` varchar(128),
	`tokenCount` int,
	`durationMs` int,
	`tokensPerSecond` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tool_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int,
	`messageId` int,
	`toolName` varchar(64) NOT NULL,
	`toolInput` text NOT NULL,
	`toolOutput` text,
	`status` enum('running','success','error') NOT NULL DEFAULT 'running',
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tool_executions_id` PRIMARY KEY(`id`)
);
