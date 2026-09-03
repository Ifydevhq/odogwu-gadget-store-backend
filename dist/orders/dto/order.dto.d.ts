import { PaginationDto } from '@common/dto/pagination.dto';
import { OrderStatus, PaymentStatus } from '@config/contants';
declare class ShippingAddressDto {
    fullName: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country?: string;
    zipCode?: string;
}
export declare class CreateOrderDto {
    listingId: string;
    quantity?: number;
    shippingAddress: ShippingAddressDto;
    buyerNote?: string;
}
export declare class UpdateOrderStatusDto {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    adminNote?: string;
    cancellationReason?: string;
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
}
export declare class QueryOrdersDto extends PaginationDto {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    disbursementStatus?: string;
    storeId?: string;
}
export {};
