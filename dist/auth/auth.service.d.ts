import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AlertsService } from '../alerts/alerts.service';
import { ReferralsService } from '../referrals/referrals.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private notificationsService;
    private alertsService;
    private referralsService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, notificationsService: NotificationsService, alertsService: AlertsService, referralsService: ReferralsService);
    private generateOTP;
    private generateToken;
    private buildAuthResponse;
    register(registerDto: RegisterDto): Promise<any>;
    login(loginDto: LoginDto): Promise<any>;
    googleAuth(googleToken: string): Promise<any>;
    private validateOrCreateGoogleUser;
    verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    resendVerification(email: string): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private tokenBlacklist;
    logout(token: string): Promise<{
        message: string;
    }>;
    isTokenBlacklisted(token: string): boolean;
}
