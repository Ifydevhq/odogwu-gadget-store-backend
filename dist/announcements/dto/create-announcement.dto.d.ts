import { UserRole } from '@config/contants';
export type AnnouncementChannel = 'in_app' | 'push' | 'email';
export type AnnouncementAudience = 'all' | 'role' | 'users';
export declare class CreateAnnouncementDto {
    title: string;
    message: string;
    channels: AnnouncementChannel[];
    audienceType: AnnouncementAudience;
    audienceRole?: UserRole;
    audienceUserIds?: string[];
    imageUrl?: string;
    data?: Record<string, any>;
    scheduleAt?: string;
}
