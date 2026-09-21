import { Document, Types } from 'mongoose';
import { ListingType, ListingStatus, ItemCondition } from '@config/contants';
import { BaseSchema } from '@common/schemas/base-schema';
export type ListingDocument = Listing & Document;
declare class PriceInfo {
    amount: number;
    currency: string;
    negotiable: boolean;
}
declare class MediaItem {
    url: string;
    type: string;
    thumbnail?: string;
}
declare class AdminPricing {
    sellingPrice?: number;
    purchasePrice?: number;
    commissionRate?: number;
}
declare class ReviewInfo {
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
    adminNotes?: string;
}
export declare class Listing extends BaseSchema {
    storeId: Types.ObjectId | null;
    creatorId: Types.ObjectId;
    userId: Types.ObjectId;
    itemName: string;
    description: string;
    condition: ItemCondition;
    category?: string;
    subCategory?: string;
    tags: string[];
    quantity: number;
    media: MediaItem[];
    type: ListingType;
    askingPrice: PriceInfo;
    adminPricing?: AdminPricing;
    discountPrice?: number;
    formerPrice?: number;
    discountPercent?: number;
    listingFee?: number;
    feePaidAmount: number;
    listingFeeStatus?: string;
    isExpectingFee: boolean;
    wasLive: boolean;
    platformBid?: number;
    counterOffer?: number;
    status: ListingStatus;
    reviewInfo?: ReviewInfo;
    location?: {
        country?: string;
        state?: string;
        city?: string;
    };
    whatsappNumber?: string;
    expiresAt?: Date;
    views: number;
    likes: number;
    totalSales: number;
    affiliateEnabled: boolean;
    affiliateCommissionType: string;
    affiliateCommissionPercent: number;
    affiliateCommissionAmount: number;
}
export declare const ListingSchema: import("mongoose").Schema<Listing, import("mongoose").Model<Listing, any, any, any, Document<unknown, any, Listing> & Listing & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Listing, Document<unknown, {}, import("mongoose").FlatRecord<Listing>> & import("mongoose").FlatRecord<Listing> & {
    _id: Types.ObjectId;
}>;
export {};
