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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementSchema = exports.Announcement = void 0;
const base_schema_1 = require("../../common/schemas/base-schema");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Announcement = class Announcement extends base_schema_1.BaseSchema {
};
exports.Announcement = Announcement;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Announcement.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Announcement.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: ['in_app'] }),
    __metadata("design:type", Array)
], Announcement.prototype, "channels", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'all' }),
    __metadata("design:type", String)
], Announcement.prototype, "audienceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Announcement.prototype, "audienceRole", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'User' }], default: [] }),
    __metadata("design:type", Array)
], Announcement.prototype, "audienceUserIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Announcement.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], Announcement.prototype, "data", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Announcement.prototype, "scheduleAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'sending' }),
    __metadata("design:type", String)
], Announcement.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Announcement.prototype, "sentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            inApp: { type: Number, default: 0 },
            push: { type: Number, default: 0 },
            email: { type: Number, default: 0 },
        },
        default: null,
    }),
    __metadata("design:type", Object)
], Announcement.prototype, "counts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Announcement.prototype, "createdBy", void 0);
exports.Announcement = Announcement = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    })
], Announcement);
exports.AnnouncementSchema = mongoose_1.SchemaFactory.createForClass(Announcement);
exports.AnnouncementSchema.index({ status: 1, scheduleAt: 1 });
exports.AnnouncementSchema.index({ createdAt: -1 });
//# sourceMappingURL=announcement.schema.js.map