"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneVerificationModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const users_module_1 = require("../users/users.module");
const platform_settings_module_1 = require("../platform-settings/platform-settings.module");
const phone_registry_schema_1 = require("./schemas/phone-registry.schema");
const phone_verification_service_1 = require("./phone-verification.service");
const phone_service_1 = require("./phone.service");
const phone_controller_1 = require("./phone.controller");
const sms_verification_provider_1 = require("./sms-verification.provider");
let PhoneVerificationModule = class PhoneVerificationModule {
};
exports.PhoneVerificationModule = PhoneVerificationModule;
exports.PhoneVerificationModule = PhoneVerificationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: phone_registry_schema_1.PhoneRegistry.name, schema: phone_registry_schema_1.PhoneRegistrySchema },
            ]),
            users_module_1.UsersModule,
            platform_settings_module_1.PlatformSettingsModule,
        ],
        controllers: [phone_controller_1.PhoneController],
        providers: [
            phone_verification_service_1.PhoneVerificationService,
            {
                provide: sms_verification_provider_1.SMS_VERIFICATION_PROVIDER,
                useExisting: phone_verification_service_1.PhoneVerificationService,
            },
            phone_service_1.PhoneService,
        ],
        exports: [phone_verification_service_1.PhoneVerificationService, phone_service_1.PhoneService, sms_verification_provider_1.SMS_VERIFICATION_PROVIDER],
    })
], PhoneVerificationModule);
//# sourceMappingURL=phone-verification.module.js.map