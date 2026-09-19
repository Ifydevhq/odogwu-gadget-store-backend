import { JwtPayload } from '@common/decorators/get-user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    create(user: JwtPayload, dto: CreateAnnouncementDto): Promise<import("./schemas/announcement.schema").AnnouncementDocument>;
    list(dto: PaginationDto): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/announcement.schema").AnnouncementDocument> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    getTemplates(): import("./announcement-templates").AnnouncementTemplate[];
    getById(id: string): Promise<import("./schemas/announcement.schema").AnnouncementDocument>;
    sendNow(id: string): Promise<import("./schemas/announcement.schema").AnnouncementDocument>;
    cancel(id: string): Promise<import("./schemas/announcement.schema").AnnouncementDocument>;
}
