import { PaginationDto } from '../common/dto/pagination.dto';
import { ReferralsService } from './referrals.service';
export declare class ReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
    getMySummary(userId: string): Promise<{
        referralCode: string;
        referralLink: string;
        totalReferred: number;
        totalQualified: number;
        totalRewardedAmount: number;
    }>;
    listMyReferrals(userId: string, paging: PaginationDto): Promise<{
        items: Array<{
            id: string;
            name: string;
            status: import("./schemas/referral.schema").ReferralStatus;
            cumulativeQualifyingSpend: number;
            qualifiedAt?: Date;
            rewardedAt?: Date;
            createdAt: Date;
        }>;
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
}
