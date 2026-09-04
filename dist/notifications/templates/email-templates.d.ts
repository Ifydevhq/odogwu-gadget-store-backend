export interface EmailBrand {
    appName: string;
    logoUrl: string | null;
    frontendUrl: string;
}
export declare function verificationOtpTemplate(brand: EmailBrand, data: {
    firstName: string;
    otp: string;
}): {
    subject: string;
    html: string;
};
export declare function welcomeTemplate(brand: EmailBrand, data: {
    firstName: string;
}): {
    subject: string;
    html: string;
};
export declare function passwordResetTemplate(brand: EmailBrand, data: {
    firstName: string;
    resetToken: string;
    frontendUrl: string;
}): {
    subject: string;
    html: string;
};
export declare function orderConfirmationTemplate(brand: EmailBrand, data: {
    buyerName: string;
    orderNumber: string;
    items: Array<{
        itemName: string;
        quantity: number;
        unitPrice: number;
    }>;
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        address: string;
        city: string;
        state: string;
    };
}): {
    subject: string;
    html: string;
};
export declare function orderPlacedOnDeliveryTemplate(brand: EmailBrand, data: {
    buyerName: string;
    orderNumber: string;
    items: Array<{
        itemName: string;
        quantity: number;
        unitPrice: number;
    }>;
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        address: string;
        city: string;
        state: string;
    };
}): {
    subject: string;
    html: string;
};
export declare function adminOrderCopyTemplate(brand: EmailBrand, data: {
    buyerName: string;
    orderNumber: string;
    items: Array<{
        itemName: string;
        quantity: number;
        unitPrice: number;
    }>;
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        address: string;
        city: string;
        state: string;
        phoneNumber?: string;
    };
    payOnDelivery?: boolean;
}): {
    subject: string;
    html: string;
};
export declare function newOrderAlertTemplate(brand: EmailBrand, data: {
    sellerName: string;
    orderNumber: string;
    itemName: string;
    quantity: number;
    sellerPayout: number;
    buyerName: string;
}): {
    subject: string;
    html: string;
};
export declare function orderStatusUpdateTemplate(brand: EmailBrand, data: {
    buyerName: string;
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    carrier?: string;
}): {
    subject: string;
    html: string;
};
export declare function listingApprovedTemplate(brand: EmailBrand, data: {
    sellerName: string;
    itemName: string;
}): {
    subject: string;
    html: string;
};
export declare function listingRejectedTemplate(brand: EmailBrand, data: {
    sellerName: string;
    itemName: string;
    reason: string;
}): {
    subject: string;
    html: string;
};
