"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = exports.PLAN_PRICING = exports.DEFAULT_COMMISSION_RATES = exports.AlertType = exports.NotificationType = exports.Currency = exports.PaymentType = exports.DisbursementStatus = exports.PaymentStatus = exports.OrderStatus = exports.ItemCondition = exports.PendingApproval = exports.ListingStatus = exports.ListingType = exports.StoreStatus = exports.CreatorStatus = exports.CreatorPlan = exports.AuthProvider = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["User"] = "user";
    UserRole["Creator"] = "creator";
    UserRole["Admin"] = "admin";
    UserRole["SuperAdmin"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["Local"] = "local";
    AuthProvider["Google"] = "google";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
var CreatorPlan;
(function (CreatorPlan) {
    CreatorPlan["Starter"] = "starter";
    CreatorPlan["Pro"] = "pro";
    CreatorPlan["Business"] = "business";
})(CreatorPlan || (exports.CreatorPlan = CreatorPlan = {}));
var CreatorStatus;
(function (CreatorStatus) {
    CreatorStatus["Active"] = "active";
    CreatorStatus["Suspended"] = "suspended";
    CreatorStatus["Deactivated"] = "deactivated";
})(CreatorStatus || (exports.CreatorStatus = CreatorStatus = {}));
var StoreStatus;
(function (StoreStatus) {
    StoreStatus["Active"] = "active";
    StoreStatus["Suspended"] = "suspended";
    StoreStatus["Closed"] = "closed";
    StoreStatus["PendingApproval"] = "pending_approval";
})(StoreStatus || (exports.StoreStatus = StoreStatus = {}));
var ListingType;
(function (ListingType) {
    ListingType["SelfListing"] = "self_listing";
    ListingType["Consignment"] = "consignment";
    ListingType["DirectPurchase"] = "direct_purchase";
    ListingType["Admin"] = "admin";
})(ListingType || (exports.ListingType = ListingType = {}));
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["Draft"] = "draft";
    ListingStatus["InReview"] = "in_review";
    ListingStatus["Approved"] = "approved";
    ListingStatus["Rejected"] = "rejected";
    ListingStatus["AwaitingFee"] = "awaiting_fee";
    ListingStatus["AwaitingProduct"] = "awaiting_product";
    ListingStatus["PriceOffered"] = "price_offered";
    ListingStatus["CounterOffer"] = "counter_offer";
    ListingStatus["Live"] = "live";
    ListingStatus["Sold"] = "sold";
    ListingStatus["SoldToPlatform"] = "sold_to_platform";
    ListingStatus["Suspended"] = "suspended";
    ListingStatus["Expired"] = "expired";
    ListingStatus["Delisted"] = "delisted";
})(ListingStatus || (exports.ListingStatus = ListingStatus = {}));
exports.PendingApproval = ListingStatus.InReview;
var ItemCondition;
(function (ItemCondition) {
    ItemCondition["BrandNew"] = "brand_new";
    ItemCondition["FairlyUsed"] = "fairly_used";
    ItemCondition["Refurbished"] = "refurbished";
})(ItemCondition || (exports.ItemCondition = ItemCondition = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["Pending"] = "pending";
    OrderStatus["Confirmed"] = "confirmed";
    OrderStatus["Processing"] = "processing";
    OrderStatus["Shipped"] = "shipped";
    OrderStatus["Delivered"] = "delivered";
    OrderStatus["Completed"] = "completed";
    OrderStatus["Cancelled"] = "cancelled";
    OrderStatus["Refunded"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["Pending"] = "pending";
    PaymentStatus["Processing"] = "processing";
    PaymentStatus["Success"] = "success";
    PaymentStatus["Failed"] = "failed";
    PaymentStatus["Refunded"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var DisbursementStatus;
(function (DisbursementStatus) {
    DisbursementStatus["AwaitingCompletion"] = "awaiting_completion";
    DisbursementStatus["AwaitingDisbursement"] = "awaiting_disbursement";
    DisbursementStatus["Disbursed"] = "disbursed";
    DisbursementStatus["NotApplicable"] = "not_applicable";
})(DisbursementStatus || (exports.DisbursementStatus = DisbursementStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["ProductPurchase"] = "product_purchase";
    PaymentType["ListingFee"] = "listing_fee";
    PaymentType["Subscription"] = "subscription";
    PaymentType["Payout"] = "payout";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var Currency;
(function (Currency) {
    Currency["NGN"] = "NGN";
})(Currency || (exports.Currency = Currency = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ListingApproved"] = "listing_approved";
    NotificationType["ListingRejected"] = "listing_rejected";
    NotificationType["NewOrder"] = "new_order";
    NotificationType["OrderStatusUpdate"] = "order_status_update";
    NotificationType["PaymentReceived"] = "payment_received";
    NotificationType["PayoutSent"] = "payout_sent";
    NotificationType["NewReview"] = "new_review";
    NotificationType["SystemAlert"] = "system_alert";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var AlertType;
(function (AlertType) {
    AlertType["Welcome"] = "welcome";
    AlertType["ProfileUpdated"] = "profile_updated";
    AlertType["OrderPlaced"] = "order_placed";
    AlertType["OrderConfirmed"] = "order_confirmed";
    AlertType["OrderProcessing"] = "order_processing";
    AlertType["OrderShipped"] = "order_shipped";
    AlertType["OrderDelivered"] = "order_delivered";
    AlertType["OrderCompleted"] = "order_completed";
    AlertType["OrderCancelled"] = "order_cancelled";
    AlertType["OrderRefunded"] = "order_refunded";
    AlertType["NewOrderReceived"] = "new_order_received";
    AlertType["AffiliateSale"] = "affiliate_sale";
    AlertType["ReferralJoined"] = "referral_joined";
    AlertType["ListingSubmitted"] = "listing_submitted";
    AlertType["ListingApproved"] = "listing_approved";
    AlertType["ListingRejected"] = "listing_rejected";
    AlertType["ListingLive"] = "listing_live";
    AlertType["ListingSold"] = "listing_sold";
    AlertType["ListingSoldToPlatform"] = "listing_sold_to_platform";
    AlertType["PaymentSuccessful"] = "payment_successful";
    AlertType["PaymentFailed"] = "payment_failed";
    AlertType["StoreCreated"] = "store_created";
    AlertType["StoreVerified"] = "store_verified";
    AlertType["NewFollower"] = "new_follower";
    AlertType["NewReview"] = "new_review";
    AlertType["DisputeSubmitted"] = "dispute_submitted";
    AlertType["DisputeResolved"] = "dispute_resolved";
    AlertType["SystemAnnouncement"] = "system_announcement";
})(AlertType || (exports.AlertType = AlertType = {}));
exports.DEFAULT_COMMISSION_RATES = {
    [ListingType.SelfListing]: 5,
    [ListingType.Consignment]: 15,
    [ListingType.DirectPurchase]: 0,
};
exports.PLAN_PRICING = {
    [CreatorPlan.Starter]: 0,
    [CreatorPlan.Pro]: 300000,
    [CreatorPlan.Business]: 800000,
};
exports.PLAN_LIMITS = {
    stores: {
        [CreatorPlan.Starter]: 1,
        [CreatorPlan.Pro]: 3,
        [CreatorPlan.Business]: Infinity,
    },
    featuredWorks: {
        [CreatorPlan.Starter]: 0,
        [CreatorPlan.Pro]: 10,
        [CreatorPlan.Business]: 25,
    },
};
//# sourceMappingURL=contants.js.map