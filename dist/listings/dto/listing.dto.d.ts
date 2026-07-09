import { PaginationDto } from '@common/dto/pagination.dto';
import { ListingType, ListingStatus, ItemCondition, Currency } from '@config/contants';
declare class ListingLocationDto {
    country?: string;
    state?: string;
    city?: string;
}
declare class PriceInfoDto {
    amount: number;
    currency?: Currency;
    negotiable?: boolean;
}
declare class MediaItemDto {
    url: string;
    type?: string;
    thumbnail?: string;
}
export declare class CreateListingDto {
    storeId?: string;
    itemName: string;
    description: string;
    condition: ItemCondition;
    type: ListingType;
    askingPrice: PriceInfoDto;
    media: MediaItemDto[];
    category?: string;
    subCategory?: string;
    tags?: string[];
    quantity?: number;
    location?: ListingLocationDto;
    whatsappNumber?: string;
}
declare const UpdateListingDto_base: import("@nestjs/common").Type<Partial<Omit<CreateListingDto, "type" | "storeId">>>;
export declare class UpdateListingDto extends UpdateListingDto_base {
}
export declare class AdminReviewListingDto {
    action: string;
    rejectionReason?: string;
    adminNotes?: string;
    sellingPrice?: number;
    purchasePrice?: number;
    commissionRate?: number;
    platformBid?: number;
}
export declare class QueryListingsDto extends PaginationDto {
    type?: ListingType;
    status?: ListingStatus;
    condition?: ItemCondition;
    category?: string;
    subCategory?: string;
    storeId?: string;
    creatorId?: string;
    minPrice?: number;
    maxPrice?: number;
    buyableOnly?: boolean;
}
export {};
