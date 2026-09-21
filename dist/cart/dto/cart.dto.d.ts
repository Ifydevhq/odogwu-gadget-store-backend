export declare class AddToCartDto {
    listingId: string;
    quantity?: number;
}
export declare class UpdateCartItemDto {
    quantity: number;
}
export declare class ShippingAddressDto {
    fullName: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
}
export declare class CheckoutCartDto {
    shippingAddress: ShippingAddressDto;
    listingIds?: string[];
    email?: string;
    buyerNote?: string;
    callbackUrl?: string;
    deliveryFee?: number;
    paymentMethod?: 'paystack' | 'opay' | 'pay_on_delivery';
    applyWalletCredit?: boolean;
    walletCreditAmount?: number;
    affiliateCodes?: Record<string, string>;
}
