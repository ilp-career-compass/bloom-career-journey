-- Add new notification type enum values for chat messages and profile card approvals
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'profile_card_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'chat_message';
