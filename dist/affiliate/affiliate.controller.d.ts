import { PaginationDto } from '../common/dto/pagination.dto';
import { AffiliateService } from './affiliate.service';
export declare class AffiliateController {
    private readonly affiliateService;
    constructor(affiliateService: AffiliateService);
    join(userId: string): Promise<{
        isAffiliate: boolean;
    }>;
    getSummary(userId: string): Promise<{
        isAffiliate: boolean;
        pendingAmount: number;
        availableAmount: number;
        totalEarned: number;
    }>;
    listCommissions(userId: string, paging: PaginationDto): Promise<{
        items: import("./schemas/affiliate-commission.schema").AffiliateCommissionDocument[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
    getLink(userId: string, listingId: string): Promise<{
        listingId: string;
        affiliateCode: string;
        link: string;
    }>;
    listProducts(paging: PaginationDto): Promise<{
        items: import("../listings/schemas/listing.schema").ListingDocument[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
}
