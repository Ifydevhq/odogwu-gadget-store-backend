import { UsersService } from './users.service';
import { JwtPayload } from '@common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { RegisterPushTokenDto, RemovePushTokenDto } from './dto/push-token.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: JwtPayload): Promise<import("./schemas/user.schema").UserDocument>;
    updateProfile(user: JwtPayload, updateProfileDto: UpdateProfileDto): Promise<import("./schemas/user.schema").UserDocument>;
    deleteAccount(user: JwtPayload, deleteAccountDto: DeleteAccountDto): Promise<{
        message: string;
    }>;
    changePassword(user: JwtPayload, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    updateNotificationPreferences(user: JwtPayload, updateDto: UpdateNotificationPreferencesDto): Promise<import("./schemas/user.schema").UserDocument>;
    addPushToken(user: JwtPayload, dto: RegisterPushTokenDto): Promise<import("./schemas/user.schema").UserDocument>;
    removePushToken(user: JwtPayload, dto: RemovePushTokenDto): Promise<import("./schemas/user.schema").UserDocument>;
}
