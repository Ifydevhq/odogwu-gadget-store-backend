/**
 * Seed script — adds furniture products from kraft-pics/furniture-and-home.
 * Does NOT delete existing listings, only adds new ones.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const KRAFT_PICS_DIR = path.resolve(
  __dirname,
  '../../Comaket/public/assets/imgs/kraft-pics/furniture-and-home',
);

const CATEGORIES = {
  woodwork: 'Woodwork & Furniture',
  homeLiving: 'Home & Living',
};

let STORES = [];

function pickStore(category) {
  const eligible = STORES.filter((s) => s.name !== 'Kraft_official');
  // Furniture-related stores — Bakare for wood, IronForge for metal-frame
  const preferences = {
    [CATEGORIES.woodwork]: ['Bakare Woodworks', 'IronForge Custom Doors'],
    [CATEGORIES.homeLiving]: ['Bakare Woodworks', 'Clay by Tunde'],
  };
  const preferred = preferences[category] || [];
  const matches = eligible.filter((s) => preferred.includes(s.name));
  const pool = matches.length > 0 ? matches : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

const CATALOG = [
  // ───── Beds (4)
  { img: 'bed-1.jpg', name: 'Solid Wood King-Size Bed Frame', category: CATEGORIES.woodwork, tags: ['Bed', 'King Size', 'Solid Wood'], priceMin: 180000, priceMax: 280000, desc: 'Handcrafted solid wood king-size bed frame. Premium hardwood, finished by master carpenters.' },
  { img: 'bed-2.jpg', name: 'Modern Upholstered Bed', category: CATEGORIES.woodwork, tags: ['Bed', 'Upholstered', 'Modern'], priceMin: 220000, priceMax: 350000, desc: 'Modern upholstered bed with tufted headboard. Comfortable and stylish bedroom centerpiece.' },
  { img: 'bed-4.jpg', name: 'Classic Wooden Queen Bed', category: CATEGORIES.woodwork, tags: ['Bed', 'Queen', 'Classic'], priceMin: 150000, priceMax: 240000, desc: 'Classic wooden queen-size bed. Sturdy mahogany construction, timeless design.' },
  { img: 'bed-6.jpg', name: 'Premium Hardwood Bed Frame', category: CATEGORIES.woodwork, tags: ['Bed', 'Hardwood', 'Premium'], priceMin: 200000, priceMax: 320000, desc: 'Premium hardwood bed frame, hand-sanded and lacquered. Lasts a lifetime.' },

  // ───── Chairs (4)
  { img: 'chair-1.jpg', name: 'Handcrafted Wooden Armchair', category: CATEGORIES.woodwork, tags: ['Chair', 'Armchair', 'Handcrafted'], priceMin: 35000, priceMax: 65000, desc: 'Handcrafted wooden armchair. Comfortable cushioning with traditional craftsmanship.' },
  { img: 'chair-5.jpg', name: 'Modern Accent Chair', category: CATEGORIES.woodwork, tags: ['Chair', 'Accent', 'Modern'], priceMin: 45000, priceMax: 80000, desc: 'Modern accent chair with sleek lines. Adds character to any living space.' },
  { img: 'chair-7.jpg', name: 'Premium Lounge Chair', category: CATEGORIES.woodwork, tags: ['Chair', 'Lounge', 'Premium'], priceMin: 55000, priceMax: 95000, desc: 'Premium lounge chair built for comfort. Locally sourced wood and quality upholstery.' },
  { img: 'chair-10.jpg', name: 'Designer Statement Chair', category: CATEGORIES.woodwork, tags: ['Chair', 'Designer', 'Statement'], priceMin: 65000, priceMax: 120000, desc: 'Designer statement chair. A bold focal point for any room.' },

  // ───── Tables (7)
  { img: 'table-1.jpg', name: 'Solid Wood Coffee Table', category: CATEGORIES.woodwork, tags: ['Table', 'Coffee Table', 'Solid Wood'], priceMin: 45000, priceMax: 85000, desc: 'Solid wood coffee table. Handcrafted with rustic finish, perfect centerpiece.' },
  { img: 'table-2.jpg', name: 'Modern Side Table', category: CATEGORIES.woodwork, tags: ['Table', 'Side Table', 'Modern'], priceMin: 28000, priceMax: 52000, desc: 'Modern side table with clean lines. Compact and functional for any space.' },
  { img: 'table-3.jpg', name: 'Designer Console Table', category: CATEGORIES.woodwork, tags: ['Table', 'Console', 'Designer'], priceMin: 65000, priceMax: 110000, desc: 'Designer console table. An elegant entryway or hallway accent.' },
  { img: 'table-5.jpg', name: 'Rustic Wooden End Table', category: CATEGORIES.woodwork, tags: ['Table', 'End Table', 'Rustic'], priceMin: 32000, priceMax: 58000, desc: 'Rustic wooden end table. Reclaimed wood with natural finish.' },
  { img: 'table-7.jpg', name: 'Contemporary Center Table', category: CATEGORIES.woodwork, tags: ['Table', 'Center Table', 'Contemporary'], priceMin: 48000, priceMax: 88000, desc: 'Contemporary center table with sleek design. Statement piece for the living room.' },
  { img: 'table-8.jpg', name: 'Premium Accent Table', category: CATEGORIES.woodwork, tags: ['Table', 'Accent', 'Premium'], priceMin: 38000, priceMax: 70000, desc: 'Premium accent table with hand-finished detailing. Timeless and durable.' },
  { img: 'table-11.jpg', name: 'Handcrafted Living Room Table', category: CATEGORIES.woodwork, tags: ['Table', 'Living Room', 'Handcrafted'], priceMin: 42000, priceMax: 80000, desc: 'Handcrafted living room table. Built to order in your preferred dimensions.' },

  // ───── Dining Tables (6)
  { img: 'table-dining-1.jpg', name: '6-Seater Dining Table Set', category: CATEGORIES.woodwork, tags: ['Dining Table', '6-Seater', 'Set'], priceMin: 180000, priceMax: 320000, desc: '6-seater dining table set with matching chairs. Solid wood, ideal for family meals.' },
  { img: 'table-dining-2.jpg', name: 'Modern 8-Seater Dining Table', category: CATEGORIES.woodwork, tags: ['Dining Table', '8-Seater', 'Modern'], priceMin: 250000, priceMax: 420000, desc: 'Modern 8-seater dining table. Contemporary design with premium finish.' },
  { img: 'table-dining-5.jpg', name: 'Premium Hardwood Dining Set', category: CATEGORIES.woodwork, tags: ['Dining Table', 'Hardwood', 'Premium'], priceMin: 280000, priceMax: 480000, desc: 'Premium hardwood dining set. Heirloom-quality construction for lasting memories.' },
  { img: 'table-dining-8.jpg', name: 'Designer Dining Table — 4 Seater', category: CATEGORIES.woodwork, tags: ['Dining Table', '4-Seater', 'Designer'], priceMin: 140000, priceMax: 240000, desc: 'Designer 4-seater dining table. Perfect for smaller homes and modern spaces.' },
  { img: 'table-dining-9.jpg', name: 'Classic Wooden Dining Set', category: CATEGORIES.woodwork, tags: ['Dining Table', 'Classic', 'Wooden'], priceMin: 200000, priceMax: 360000, desc: 'Classic wooden dining set. Timeless design that complements any decor.' },
  { img: 'table-dining-home.jpg', name: 'Family Dining Table Ensemble', category: CATEGORIES.woodwork, tags: ['Dining Table', 'Family', 'Ensemble'], priceMin: 220000, priceMax: 380000, desc: 'Family dining table ensemble. Built for gatherings with ample seating space.' },

  // ───── TV Stands (4)
  { img: 'tv-stand-1.jpg', name: 'Modern TV Console Stand', category: CATEGORIES.woodwork, tags: ['TV Stand', 'Console', 'Modern'], priceMin: 55000, priceMax: 110000, desc: 'Modern TV console stand. Multiple shelves for media storage and display.' },
  { img: 'tv-stand-4.jpg', name: 'Designer Entertainment Unit', category: CATEGORIES.woodwork, tags: ['TV Stand', 'Entertainment', 'Designer'], priceMin: 75000, priceMax: 145000, desc: 'Designer entertainment unit. Combines functionality with sophisticated style.' },
  { img: 'tvstand-5.jpg', name: 'Premium Wooden TV Stand', category: CATEGORIES.woodwork, tags: ['TV Stand', 'Wooden', 'Premium'], priceMin: 65000, priceMax: 125000, desc: 'Premium wooden TV stand with cable management. Sturdy and stylish.' },
  { img: 'tv-stand-8.jpg', name: 'Contemporary TV Cabinet', category: CATEGORIES.woodwork, tags: ['TV Stand', 'Cabinet', 'Contemporary'], priceMin: 70000, priceMax: 130000, desc: 'Contemporary TV cabinet with hidden storage. Clean lines and elegant finish.' },
];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomRecentDate() {
  const now = Date.now();
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
  return new Date(randInt(sixtyDaysAgo, now));
}
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function uploadImage(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'kraft/listings',
    resource_type: 'image',
  });
  return result.secure_url;
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('\nLoading stores...');
  STORES = await db.collection('stores').find({ isDeleted: { $ne: true } }).toArray();
  console.log(`Found ${STORES.length} stores`);

  console.log('\nValidating images...');
  const validProducts = [];
  for (const product of CATALOG) {
    const filePath = path.join(KRAFT_PICS_DIR, product.img);
    if (!fs.existsSync(filePath)) {
      console.warn(`  [SKIP] missing: ${product.img}`);
      continue;
    }
    validProducts.push({ ...product, filePath });
  }
  console.log(`${validProducts.length} valid products to seed`);

  const shuffledProducts = shuffle(validProducts);

  console.log('\nUploading and creating listings...');
  let created = 0;
  let failed = 0;

  for (let i = 0; i < shuffledProducts.length; i++) {
    const product = shuffledProducts[i];
    const progress = `[${i + 1}/${shuffledProducts.length}]`;

    try {
      const url = await uploadImage(product.filePath);

      const store = pickStore(product.category);
      if (!store) {
        console.warn(`${progress} no store for: ${product.name}`);
        failed++;
        continue;
      }

      const priceNaira = Math.round(randInt(product.priceMin, product.priceMax) / 1000) * 1000;
      const priceKobo = priceNaira * 100;
      const quantity = randInt(1, 6); // furniture is rarely high-stock

      // Type mix — slightly more consignment for furniture (higher-value items)
      const r = Math.random();
      let type, adminPricing = null;
      if (r < 0.55) {
        type = 'self_listing';
      } else if (r < 0.9) {
        type = 'consignment';
        adminPricing = {
          sellingPrice: Math.round(priceKobo * 1.15),
          commissionRate: 15,
        };
      } else {
        type = 'direct_purchase';
        adminPricing = {
          sellingPrice: Math.round(priceKobo * 1.25),
          purchasePrice: priceKobo,
        };
      }

      const condition = pickRandom(['brand_new', 'brand_new', 'brand_new']);

      let listingFee = null;
      let listingFeeStatus = null;
      let feePaidAmount = 0;
      if (type === 'self_listing') {
        listingFee = Math.round(priceKobo * 0.025);
        listingFeeStatus = 'processed';
        feePaidAmount = listingFee;
      }

      const createdAt = randomRecentDate();

      const listing = {
        _id: new mongoose.Types.ObjectId(),
        itemName: product.name,
        description: product.desc,
        condition,
        category: product.category,
        type,
        askingPrice: { amount: priceKobo, currency: 'NGN', negotiable: Math.random() < 0.5 },
        media: [{ url, type: 'image' }],
        tags: product.tags,
        quantity,
        location: null,
        whatsappNumber: null,
        listingFee,
        feePaidAmount,
        listingFeeStatus,
        wasLive: false,
        platformBid: null,
        counterOffer: null,
        adminPricing,
        reviewInfo: null,
        expiresAt: null,
        isDeleted: false,
        status: 'live',
        views: randInt(15, 600),
        likes: randInt(0, 40),
        totalSales: randInt(0, 12),
        storeId: store._id,
        creatorId: store.creatorId,
        userId: store.userId,
        createdAt,
        updatedAt: createdAt,
      };

      await db.collection('listings').insertOne(listing);
      created++;
      console.log(`${progress} created: ${product.name} (${store.name}, ₦${priceNaira.toLocaleString()})`);
    } catch (err) {
      failed++;
      console.error(`${progress} FAILED: ${product.name} - ${err.message}`);
    }
  }

  console.log(`\n✅ Done. Created: ${created}, Failed: ${failed}`);

  // Update store totalListings counts
  console.log('\nUpdating store listing counts...');
  for (const store of STORES) {
    const count = await db.collection('listings').countDocuments({
      storeId: store._id,
      isDeleted: { $ne: true },
    });
    await db.collection('stores').updateOne(
      { _id: store._id },
      { $set: { totalListings: count } },
    );
  }
  console.log('Store counts updated');

  await mongoose.connection.close();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
