export class CreateNotificationDto {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}
