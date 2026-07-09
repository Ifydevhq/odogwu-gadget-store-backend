"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const STORE_SLUG = 'odogwu-laptops';
const NEW_NAME = 'Odogwu Gadget Store';
const LOGO_PATH = '/assets/imgs/logos/ogs-logo-dark-theme.png';
async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const storeRes = await db.collection('stores').updateOne({ slug: STORE_SLUG }, { $set: { name: NEW_NAME, logo: LOGO_PATH, updatedAt: new Date() } });
    console.log(`✅ Store update: matched=${storeRes.matchedCount} modified=${storeRes.modifiedCount}`);
    const creatorRes = await db.collection('creators').updateOne({ slug: STORE_SLUG }, { $set: { profileImageUrl: LOGO_PATH, updatedAt: new Date() } });
    console.log(`✅ Creator update: matched=${creatorRes.matchedCount} modified=${creatorRes.modifiedCount}`);
    if (storeRes.matchedCount === 0) {
        console.warn(`⚠️  No store found with slug "${STORE_SLUG}". Run yarn seed:catalog first.`);
    }
    else {
        const store = await db.collection('stores').findOne({ slug: STORE_SLUG });
        console.log(`\n🏬 Store is now: "${store?.name}"  |  logo: ${store?.logo}`);
    }
    await mongoose.disconnect();
}
run().catch((err) => {
    console.error('❌ Update failed:', err);
    process.exit(1);
});
//# sourceMappingURL=update-store-brand.js.map