"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comaket';
const TAXONOMY = {
    Laptops: [
        'Windows Laptops',
        'MacBooks',
        'Gaming Laptops',
        '2-in-1 / Convertibles',
        'Chromebooks',
        'Business/Ultrabooks',
    ],
    'Phones & Tablets': ['Android Phones', 'iPhones', 'Tablets', 'iPads'],
    Accessories: [
        'Chargers & Cables',
        'Laptop Bags & Cases',
        'Phone Cases',
        'Keyboards & Mice',
        'Screen Protectors',
        'Stands & Docks',
    ],
    Audio: ['Headphones', 'Earbuds', 'Bluetooth Speakers', 'Microphones'],
    'Storage & Components': [
        'SSDs',
        'Hard Drives',
        'RAM',
        'Flash Drives',
        'Memory Cards',
    ],
    Gaming: ['Consoles', 'Controllers', 'Gaming Accessories'],
    Wearables: ['Smartwatches', 'Fitness Bands'],
    Networking: ['Routers', 'Modems & MiFi', 'Extenders'],
    Power: ['Power Banks', 'UPS & Inverters', 'Adapters'],
};
function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/\//g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
async function upsertCategory(db, name, parentId, sortOrder) {
    const slug = slugify(name);
    const now = new Date();
    await db.collection('categories').updateOne({ slug }, {
        $set: {
            name,
            parentId: parentId || null,
            sortOrder,
            isActive: true,
            updatedAt: now,
        },
        $setOnInsert: {
            slug,
            description: null,
            icon: null,
            image: null,
            listingCount: 0,
            isDeleted: false,
            createdAt: now,
        },
    }, { upsert: true });
    const doc = await db.collection('categories').findOne({ slug });
    return doc;
}
async function seed() {
    await (0, mongoose_1.connect)(DB_URI);
    console.log('Connected to MongoDB');
    const db = mongoose_1.connection.db;
    let parentOrder = 0;
    for (const [parentName, children] of Object.entries(TAXONOMY)) {
        const parent = await upsertCategory(db, parentName, null, parentOrder);
        console.log(`✓ ${parentName}`);
        parentOrder += 1;
        let childOrder = 0;
        for (const childName of children) {
            await upsertCategory(db, childName, parent._id, childOrder);
            console.log(`    └─ ${childName}`);
            childOrder += 1;
        }
    }
    console.log('Category taxonomy seeded successfully!');
    await mongoose_1.connection.close();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-categories.js.map