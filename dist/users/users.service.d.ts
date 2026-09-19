import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    findById(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    getProfile(userId: string): Promise<UserDocument>;
    updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<UserDocument>;
    updateInternal(userId: string, update: Partial<User>): Promise<UserDocument>;
    findByResetToken(token: string): Promise<UserDocument | null>;
    countUsers(filter?: Record<string, any>): Promise<number>;
    deleteAccount(userId: string, password: string): Promise<void>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
    updateNotificationPreferences(userId: string, updateDto: UpdateNotificationPreferencesDto): Promise<UserDocument>;
    addPushToken(userId: string, token: string, platform: string): Promise<UserDocument>;
    removePushToken(userId: string, token: string): Promise<UserDocument>;
}
