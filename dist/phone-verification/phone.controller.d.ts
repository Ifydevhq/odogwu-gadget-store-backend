import { JwtPayload } from '@common/decorators/get-user.decorator';
import { PhoneService } from './phone.service';
import { RequestPhoneOtpDto, VerifyPhoneOtpDto } from './dto/phone.dto';
export declare class PhoneController {
    private readonly phoneService;
    constructor(phoneService: PhoneService);
    requestOtp(user: JwtPayload, dto: RequestPhoneOtpDto): Promise<{
        sent: true;
    }>;
    verifyOtp(user: JwtPayload, dto: VerifyPhoneOtpDto): Promise<{
        verified: true;
        welcomeGranted: boolean;
    }>;
}
