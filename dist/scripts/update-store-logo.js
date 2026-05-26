"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const STORE_SLUG = 'odogwu-laptops';
const LOGO_PATH = '/assets/imgs/logos/odg-logo.png';
async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const storeRes = await db.collection('stores').updateOne({ slug: STORE_SLUG }, {
        $set: {
            logo: LOGO_PATH,
            location: { country: 'Nigeria' },
            updatedAt: new Date(),
        },
    });
    console.log(`✅ Store update: matched=${storeRes.matchedCount} modified=${storeRes.modifiedCount}`);
    const creatorRes = await db.collection('creators').updateOne({ slug: STORE_SLUG }, {
        $set: {
            profileImageUrl: LOGO_PATH,
            location: { country: 'Nigeria' },
            updatedAt: new Date(),
        },
    });
    console.log(`✅ Creator update: matched=${creatorRes.matchedCount} modified=${creatorRes.modifiedCount}`);
    const store = await db.collection('stores').findOne({ slug: STORE_SLUG });
    if (store) {
        const listingsRes = await db.collection('listings').updateMany({ storeId: store._id }, { $set: { location: { country: 'Nigeria' }, updatedAt: new Date() } });
        console.log(`✅ Listings location reset: matched=${listingsRes.matchedCount} modified=${listingsRes.modifiedCount}`);
    }
    if (storeRes.matchedCount === 0) {
        console.warn(`⚠️  No store found with slug "${STORE_SLUG}". Run yarn seed:odogwu first.`);
    }
    await mongoose.disconnect();
}
run().catch((err) => {
    console.error('❌ Update failed:', err);
    process.exit(1);
});
//# sourceMappingURL=update-store-logo.js.map