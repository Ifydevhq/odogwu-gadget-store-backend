import { HydratedDocument } from 'mongoose';
export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;
export declare class PlatformSettings {
    key: string;
    freeListing: boolean;
    noCommission: boolean;
    selfListingFeePercent: number;
    consignmentCommissionPercent: number;
    listingFeeCapKobo: number;
    consignmentCommissionCapKobo: number;
    selfListingEnabled: boolean;
    consignmentEnabled: boolean;
    directSaleEnabled: boolean;
    autoApproveVerified: boolean;
    maintenanceMode: boolean;
    starterPlanPriceKobo: number;
    proPlanPriceKobo: number;
    businessPlanPriceKobo: number;
    starterPlanActive: boolean;
    proPlanActive: boolean;
    businessPlanActive: boolean;
    minListingPriceKobo: number;
    maxListingImages: number;
    maxFileSizeBytes: number;
    maxFilesPerUpload: number;
    maxReturnHoursBeforeAutoComplete: number;
    welcomeCreditAmount: number;
    creditMaxPercentPerOrder: number;
    referralMinOrderAmount: number;
    referralRewardAmount: number;
    affiliateHoldDays: number;
    affiliateDefaultCommissionPercent: number;
    minWithdrawalAmount: number;
}
export declare const PlatformSettingsSchema: import("mongoose").Schema<PlatformSettings, import("mongoose").Model<PlatformSettings, any, any, any, import("mongoose").Document<unknown, any, PlatformSettings> & PlatformSettings & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PlatformSettings, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PlatformSettings>> & import("mongoose").FlatRecord<PlatformSettings> & {
    _id: import("mongoose").Types.ObjectId;
}>;
