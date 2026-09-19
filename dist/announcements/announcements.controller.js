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
exports.AnnouncementsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const contants_1 = require("../config/contants");
const announcements_service_1 = require("./announcements.service");
const create_announcement_dto_1 = require("./dto/create-announcement.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let AnnouncementsController = class AnnouncementsController {
    constructor(announcementsService) {
        this.announcementsService = announcementsService;
    }
    async create(user, dto) {
        return this.announcementsService.createAndSend(dto, user.sub);
    }
    async list(dto) {
        return this.announcementsService.list({
            page: dto.page,
            perPage: dto.perPage,
        });
    }
    getTemplates() {
        return this.announcementsService.getTemplates();
    }
    async getById(id) {
        return this.announcementsService.getById(id);
    }
    async sendNow(id) {
        return this.announcementsService.sendNow(id);
    }
    async cancel(id) {
        return this.announcementsService.cancelScheduled(id);
    }
};
exports.AnnouncementsController = AnnouncementsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create and send (or schedule) an announcement' }),
    (0, response_message_decorator_1.ResponseMessage)('Announcement created'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_announcement_dto_1.CreateAnnouncementDto]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List announcements (history)' }),
    (0, response_message_decorator_1.ResponseMessage)('Announcements retrieved'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get standard announcement templates' }),
    (0, response_message_decorator_1.ResponseMessage)('Templates retrieved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an announcement' }),
    (0, response_message_decorator_1.ResponseMessage)('Announcement retrieved'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a scheduled/draft announcement now' }),
    (0, response_message_decorator_1.ResponseMessage)('Announcement sent'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "sendNow", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a scheduled announcement' }),
    (0, response_message_decorator_1.ResponseMessage)('Announcement cancelled'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "cancel", null);
exports.AnnouncementsController = AnnouncementsController = __decorate([
    (0, swagger_1.ApiTags)('admin-announcements'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('admin/announcements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin),
    __metadata("design:paramtypes", [announcements_service_1.AnnouncementsService])
], AnnouncementsController);
//# sourceMappingURL=announcements.controller.js.map