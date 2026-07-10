declare const _default: (() => {
    name: string;
    logoUrl: string;
    env: string;
    port: number;
    corsOrigin: string;
    frontendUrl: string;
    jwt: {
        secret: string;
        expiresIn: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
    };
    paystack: {
        secretKey: string;
        publicKey: string;
        baseUrl: string;
        callbackUrl: string;
    };
    opay: {
        secretKey: string;
        publicKey: string;
        merchantId: string;
        baseUrl: string;
        callbackUrl: string;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    resendApiKey: string;
    mail: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
    adminEmail: string;
    whatsapp: {
        ownerNumber: string;
        cloudToken: string;
        phoneNumberId: string;
        apiVersion: string;
        callmebotApiKey: string;
    };
    listing: {
        freeListing: boolean;
        noCommission: boolean;
        selfListingFeePercent: number;
        consignmentCommissionPercent: number;
        listingFeeCapKobo: number;
        consignmentCommissionCapKobo: number;
    };
    upload: {
        allowedMimeTypes: string[];
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    name: string;
    logoUrl: string;
    env: string;
    port: number;
    corsOrigin: string;
    frontendUrl: string;
    jwt: {
        secret: string;
        expiresIn: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
    };
    paystack: {
        secretKey: string;
        publicKey: string;
        baseUrl: string;
        callbackUrl: string;
    };
    opay: {
        secretKey: string;
        publicKey: string;
        merchantId: string;
        baseUrl: string;
        callbackUrl: string;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    resendApiKey: string;
    mail: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
    adminEmail: string;
    whatsapp: {
        ownerNumber: string;
        cloudToken: string;
        phoneNumberId: string;
        apiVersion: string;
        callmebotApiKey: string;
    };
    listing: {
        freeListing: boolean;
        noCommission: boolean;
        selfListingFeePercent: number;
        consignmentCommissionPercent: number;
        listingFeeCapKobo: number;
        consignmentCommissionCapKobo: number;
    };
    upload: {
        allowedMimeTypes: string[];
    };
}>;
export default _default;
