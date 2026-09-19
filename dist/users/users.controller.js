"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("./users.service");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const delete_account_dto_1 = require("./dto/delete-account.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const update_notification_preferences_dto_1 = require("./dto/update-notification-preferences.dto");
const push_token_dto_1 = require("./dto/push-token.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getProfile(user) {
        return this.usersService.getProfile(user.sub);
    }
    async updateProfile(user, updateProfileDto) {
        return this.usersService.updateProfile(user.sub, updateProfileDto);
    }
    async deleteAccount(user, deleteAccountDto) {
        await this.usersService.deleteAccount(user.sub, deleteAccountDto.password);
        return { message: 'Account deleted successfully' };
    }
    async changePassword(user, changePasswordDto) {
        await this.usersService.changePassword(user.sub, changePasswordDto);
        return { message: 'Password changed successfully' };
    }
    async updateNotificationPreferences(user, updateDto) {
        return this.usersService.updateNotificationPreferences(user.sub, updateDto);
    }
    async addPushToken(user, dto) {
        return this.usersService.addPushToken(user.sub, dto.token, dto.platform);
    }
    async removePushToken(user, dto) {
        return this.usersService.removePushToken(user.sub, dto.token);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile retrieved successfully' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, response_message_decorator_1.ResponseMessage)('Profile updated successfully'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, response_message_decorator_1.ResponseMessage)('Account deleted successfully'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete current user account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Account deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid password' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delete_account_dto_1.DeleteAccountDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Patch)('me/password'),
    (0, response_message_decorator_1.ResponseMessage)('Password changed successfully'),
    (0, swagger_1.ApiOperation)({ summary: 'Change current user password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password changed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Current password is incorrect' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Patch)('me/notifications'),
    (0, response_message_decorator_1.ResponseMessage)('Notification preferences updated successfully'),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification preferences' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Notification preferences updated successfully',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_notification_preferences_dto_1.UpdateNotificationPreferencesDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateNotificationPreferences", null);
__decorate([
    (0, common_1.Post)('me/push-tokens'),
    (0, response_message_decorator_1.ResponseMessage)('Push token registered'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a device push token' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Push token registered' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_token_dto_1.RegisterPushTokenDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addPushToken", null);
__decorate([
    (0, common_1.Delete)('me/push-tokens'),
    (0, response_message_decorator_1.ResponseMessage)('Push token removed'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a device push token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Push token removed' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_token_dto_1.RemovePushTokenDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removePushToken", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map