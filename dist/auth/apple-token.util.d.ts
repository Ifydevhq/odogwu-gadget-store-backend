export interface AppleTokenPayload {
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    sub: string;
    email?: string;
    email_verified?: boolean | string;
    is_private_email?: boolean | string;
    [key: string]: any;
}
export declare function verifyAppleIdentityToken(identityToken: string, audiences: string[]): Promise<AppleTokenPayload>;
