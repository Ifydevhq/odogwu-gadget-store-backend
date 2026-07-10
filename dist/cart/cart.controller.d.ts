import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CheckoutCartDto } from './dto/cart.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    addToCart(req: any, dto: AddToCartDto): Promise<{
        items: any;
        itemCount: any;
        subtotal: any;
        currency: string;
        hasIssues: boolean;
    }>;
    getCart(req: any): Promise<{
        items: any;
        itemCount: any;
        subtotal: any;
        currency: string;
        hasIssues: boolean;
    } | {
        items: any[];
        itemCount: number;
        subtotal: number;
        currency: string;
    }>;
    getItemCount(req: any): Promise<{
        count: number;
    }>;
    updateQuantity(req: any, listingId: string, dto: UpdateCartItemDto): Promise<{
        items: any;
        itemCount: any;
        subtotal: any;
        currency: string;
        hasIssues: boolean;
    }>;
    removeItem(req: any, listingId: string): Promise<{
        items: any;
        itemCount: any;
        subtotal: any;
        currency: string;
        hasIssues: boolean;
    }>;
    clearCart(req: any): Promise<{
        message: string;
        items: any[];
        itemCount: number;
        subtotal: number;
    }>;
    validateCart(req: any): Promise<{
        valid: boolean;
        validItems: number;
        totalItems: number;
        issues: any[];
    }>;
    checkout(req: any, dto: CheckoutCartDto): Promise<{
        paymentMethod: string;
        codOrder: boolean;
        order: {
            _id: any;
            orderNumber: string;
            totalAmount: number;
            itemCount: number;
        };
        grandTotal: any;
        itemCount: number;
        skippedItems: any[];
        sessionId?: undefined;
        payment?: undefined;
    } | {
        sessionId: any;
        paymentMethod: "paystack" | "opay";
        payment: {
            authorizationUrl: any;
            accessCode: any;
            reference: any;
            grandTotal: any;
        };
        itemCount: number;
        skippedItems: any[];
        codOrder?: undefined;
        order?: undefined;
        grandTotal?: undefined;
    }>;
}
