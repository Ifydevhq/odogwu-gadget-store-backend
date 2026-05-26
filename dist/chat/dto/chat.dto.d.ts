import { PaginationDto } from '../../common/dto/pagination.dto';
declare class ProductContextDto {
    listingId: string;
    itemName: string;
    price: number;
    image?: string;
}
export declare class CreateConversationDto {
    participantId: string;
    productContext?: ProductContextDto;
    initialMessage?: string;
    participantType?: 'creator' | 'store';
}
declare class ProductCardDto {
    listingId: string;
    itemName: string;
    price: number;
    image?: string;
    storeName?: string;
}
export declare class SendMessageDto {
    content: string;
    type?: string;
    productCard?: ProductCardDto;
    attachments?: string[];
    metadata?: Record<string, any>;
}
export declare class QueryMessagesDto extends PaginationDto {
    before?: string;
}
export declare class SearchChatDto {
    q: string;
}
export {};
