"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNigerianPhone = normalizeNigerianPhone;
const common_1 = require("@nestjs/common");
function normalizeNigerianPhone(input) {
    if (input == null || String(input).trim() === '') {
        throw new common_1.BadRequestException('Phone number is required');
    }
    let raw = String(input).trim().replace(/[\s\-().]/g, '');
    const hadPlus = raw.startsWith('+');
    if (hadPlus)
        raw = raw.slice(1);
    if (!/^\d+$/.test(raw)) {
        throw new common_1.BadRequestException('Invalid phone number');
    }
    let national;
    if (raw.startsWith('234')) {
        national = raw.slice(3);
    }
    else if (raw.startsWith('0')) {
        national = raw.slice(1);
    }
    else if (raw.length === 10) {
        national = raw;
    }
    else {
        throw new common_1.BadRequestException('Invalid Nigerian phone number');
    }
    if (!/^[789]\d{9}$/.test(national)) {
        throw new common_1.BadRequestException('Invalid Nigerian phone number');
    }
    return `+234${national}`;
}
//# sourceMappingURL=phone.util.js.map