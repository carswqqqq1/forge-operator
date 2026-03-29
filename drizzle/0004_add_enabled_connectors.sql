-- Add enabledConnectors to conversations so connector state can be tracked per chat
ALTER TABLE conversations ADD COLUMN enabledConnectors TEXT NOT NULL DEFAULT '[]';
