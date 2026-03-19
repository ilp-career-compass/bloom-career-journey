import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'summary_approved' | 'teacher_message' | 'assessment_submitted' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  created_at: string;
  read_at?: string | null;
}

class NotificationService {
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) logger.error('Notification getUnreadCount error:', error);
    return count || 0;
  }

  async list(userId: string, limit = 15): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) logger.error('Notification list error:', error);
    return (data as AppNotification[]) || [];
  }

  async markRead(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);
    if (error) logger.error('Notification markRead error:', error);
  }

  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!params.userId) {
      return { success: false, error: 'Missing user id for notification' };
    }

    try {
      const { data, error } = await supabase.rpc('create_notification_secure', {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_link: params.link || null
      });

      if (error) {
        logger.error('Error creating notification via RPC:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        logger.warn('Notification RPC returned no id; assuming success');
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception creating notification via RPC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const notificationService = new NotificationService();


