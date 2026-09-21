import { AuthProvider } from '@config/contants';
declare class MobileDto {
    phoneNumber: string;
    isoCode?: string;
}
export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    avatar?: string;
    authProvider?: AuthProvider;
    mobile?: MobileDto;
    gender?: string;
    dateOfBirth?: string;
    country?: string;
    state?: string;
    city?: string;
    bio?: string;
    referredBy?: string;
    isEmailVerified?: boolean;
    verificationCode?: string;
    verificationExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
}
export {};
