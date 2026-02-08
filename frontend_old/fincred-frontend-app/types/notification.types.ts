// Notification types matching backend app/schemas/notification.py

export type NotificationType =
    | 'weekly_summary'
    | 'pre_transfer_reminder'
    | 'checkin_reminder'
    | 'goal_progress_update';

export type NotificationChannel = 'email' | 'push';

export type NotificationStatus = 'active' | 'paused' | 'cancelled';

export interface NudgeSchedule {
    id: string;
    user_id: string;
    action_plan_id?: string;
    type: NotificationType;
    channel: NotificationChannel;
    next_send_at: string;
    last_sent_at?: string;
    status: NotificationStatus;
    created_at: string;
    updated_at: string;
}

export interface NudgeScheduleCreate {
    action_plan_id?: string;
    type: NotificationType;
    channel: NotificationChannel;
    next_send_at: string;
    status?: NotificationStatus;
}

export interface NudgeScheduleUpdate {
    action_plan_id?: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    next_send_at?: string;
    last_sent_at?: string;
    status?: NotificationStatus;
}
