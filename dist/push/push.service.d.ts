import { Model } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';
export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}
export interface PushResult {
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
}
export declare class PushService {
    private readonly userModel;
    private readonly logger;
    private enabled;
    constructor(userModel: Model<UserDocument>);
    private init;
    isEnabled(): boolean;
    sendToTokens(tokens: string[], payload: PushPayload): Promise<PushResult>;
    sendToUsers(userIds: string[], payload: PushPayload): Promise<PushResult>;
}
