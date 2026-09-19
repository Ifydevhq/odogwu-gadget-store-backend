export interface AnnouncementTemplate {
    id: string;
    name: string;
    category: string;
    title: string;
    message: string;
    suggestedChannels: Array<'in_app' | 'push' | 'email'>;
}
export declare const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[];
