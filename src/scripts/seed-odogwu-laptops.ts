/**
 * scripts/seed-odogwu-laptops.ts - Single-Store Seeder for Odogwu Laptops
 * ========================================================================
 * Wipes existing multistore demo data (stores, creators, listings, categories,
 * savedproducts, carts) and seeds the single-store setup:
 *   - Super-admin user (idempotent; reuses if present, otherwise creates)
 *   - Creator profile owned by super-admin (isSystemAccount: true)
 *   - One store: "Odogwu Laptops" (isVerified + isSuperVerified)
 *   - Categories: HP, Dell, Lenovo, Acer, Asus, Apple, Microsoft, HP Chargers, etc.
 *   - Sample products: laptops and laptop chargers per brand
 *
 * Run:
 *   yarn seed:odogwu
 *   # or: npx ts-node src/scripts/seed-odogwu-laptops.ts
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── Config ────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@odogwulaptops.com';
const ADMIN_PASSWORD = 'Test@1234';
const ADMIN_FIRST_NAME = 'Odogwu';
const ADMIN_LAST_NAME = 'Admin';
const STORE_WHATSAPP = '2348109362830';
const STORE_PHONE = '2348109362830';
const STORE_SLUG = 'odogwu-laptops';

// ─── Helpers ───────────────────────────────────────────────────────────
const oid = () => new mongoose.Types.ObjectId();
const ago = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// ─── Image pools (Unsplash) ────────────────────────────────────────────
const laptopImages = [
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1000',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000',
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1000',
  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1000',
  'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=1000',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1000',
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1000',
  'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1000',
  'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=1000',
  'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=1000',
];

const chargerImages = [
  'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1000',
  'https://images.unsplash.com/photo-1606293459297-5a049c3da77c?w=1000',
  'https://images.unsplash.com/photo-1609692814858-f7cd2f0afa4f?w=1000',
  'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=1000',
];

const storeLogo = '/assets/imgs/logos/odg-logo.png';
const storeCover =
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200';

// Round-robin image picker
let imgIdx = 0;
const nextLaptopImg = () => laptopImages[imgIdx++ % laptopImages.length];
let chargerIdx = 0;
const nextChargerImg = () =>
  chargerImages[chargerIdx++ % chargerImages.length];

// ─── Category definitions ──────────────────────────────────────────────
const BRANDS = [
  {
    slug: 'hp',
    name: 'HP',
    description: 'HP laptops and chargers — ProBook, EliteBook, Pavilion, Omen.',
    icon: 'ri-computer-line',
  },
  {
    slug: 'dell',
    name: 'Dell',
    description: 'Dell laptops and chargers — XPS, Inspiron, Latitude, Alienware.',
    icon: 'ri-computer-line',
  },
  {
    slug: 'lenovo',
    name: 'Lenovo',
    description: 'Lenovo laptops and chargers — ThinkPad, IdeaPad, Legion, Yoga.',
    icon: 'ri-computer-line',
  },
  {
    slug: 'acer',
    name: 'Acer',
    description: 'Acer laptops and chargers — Aspire, Predator, Swift, Nitro.',
    icon: 'ri-computer-line',
  },
  {
    slug: 'asus',
    name: 'Asus',
    description: 'Asus laptops and chargers — ZenBook, ROG, VivoBook, TUF.',
    icon: 'ri-computer-line',
  },
  {
    slug: 'apple',
    name: 'Apple',
    description: 'Apple MacBooks and chargers — MacBook Air, MacBook Pro.',
    icon: 'ri-apple-line',
  },
  {
    slug: 'microsoft',
    name: 'Microsoft',
    description: 'Microsoft Surface laptops and chargers.',
    icon: 'ri-microsoft-line',
  },
];

// ─── Product definitions per brand ─────────────────────────────────────
// Prices are in kobo (1 Naira = 100 kobo). e.g. 65000000 = ₦650,000

type ProductDef = {
  name: string;
  description: string;
  priceKobo: number;
  condition: 'brand_new' | 'fairly_used' | 'refurbished' | 'used';
  tags: string[];
  quantity: number;
  isCharger?: boolean;
};

const PRODUCTS_BY_BRAND: Record<string, ProductDef[]> = {
  HP: [
    {
      name: 'HP EliteBook 840 G8 — Core i7, 16GB RAM, 512GB SSD',
      description:
        'Business-class HP EliteBook 840 G8 with 11th Gen Intel Core i7, 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD display, backlit keyboard, fingerprint reader. Perfect for professionals.',
      priceKobo: 75000000,
      condition: 'brand_new',
      tags: ['EliteBook', 'Core i7', 'Business Laptop', '16GB RAM'],
      quantity: 5,
    },
    {
      name: 'HP ProBook 450 G9 — Core i5, 8GB RAM, 256GB SSD',
      description:
        'HP ProBook 450 G9 with Intel Core i5 12th Gen, 8GB RAM, 256GB SSD, 15.6" FHD display. Great for students and office work.',
      priceKobo: 55000000,
      condition: 'brand_new',
      tags: ['ProBook', 'Core i5', 'Student Laptop'],
      quantity: 8,
    },
    {
      name: 'HP Pavilion 15 — Ryzen 5, 8GB RAM, 512GB SSD',
      description:
        'HP Pavilion 15 with AMD Ryzen 5 5500U, 8GB RAM, 512GB SSD, 15.6" FHD micro-edge display. Sleek everyday laptop.',
      priceKobo: 48000000,
      condition: 'brand_new',
      tags: ['Pavilion', 'Ryzen 5', 'Everyday'],
      quantity: 6,
    },
    {
      name: 'HP Omen 16 Gaming Laptop — RTX 3060, Core i7, 16GB RAM',
      description:
        'HP Omen 16 gaming laptop with NVIDIA RTX 3060, Intel Core i7-12700H, 16GB DDR5 RAM, 1TB SSD, 165Hz QHD display.',
      priceKobo: 145000000,
      condition: 'brand_new',
      tags: ['Omen', 'Gaming', 'RTX 3060'],
      quantity: 3,
    },
    {
      name: 'HP EliteBook 840 G6 — Core i5 (Refurbished)',
      description:
        'Refurbished HP EliteBook 840 G6 — 8th Gen Core i5, 8GB RAM, 256GB SSD, 14" FHD. Inspected and certified.',
      priceKobo: 32000000,
      condition: 'refurbished',
      tags: ['EliteBook', 'Refurbished', 'UK Used'],
      quantity: 10,
    },
    {
      name: 'HP Original 65W Laptop Charger — USB-C',
      description:
        'Genuine HP 65W USB-C laptop charger. Compatible with HP EliteBook, ProBook, and Spectre models. 1.8m cable.',
      priceKobo: 1800000,
      condition: 'brand_new',
      tags: ['Charger', 'USB-C', '65W'],
      quantity: 25,
      isCharger: true,
    },
    {
      name: 'HP Original 45W Laptop Charger — Blue Tip',
      description:
        'Original HP 45W laptop charger with blue tip connector. Fits HP Pavilion, Stream, and 250 G series.',
      priceKobo: 1500000,
      condition: 'brand_new',
      tags: ['Charger', '45W', 'Blue Tip'],
      quantity: 30,
      isCharger: true,
    },
  ],
  Dell: [
    {
      name: 'Dell XPS 13 — Core i7, 16GB RAM, 512GB SSD',
      description:
        'Dell XPS 13 ultrabook with 12th Gen Intel Core i7, 16GB LPDDR5 RAM, 512GB SSD, 13.4" InfinityEdge FHD+ display. Premium build.',
      priceKobo: 125000000,
      condition: 'brand_new',
      tags: ['XPS', 'Ultrabook', 'Core i7'],
      quantity: 4,
    },
    {
      name: 'Dell Inspiron 15 3520 — Core i5, 8GB RAM, 512GB SSD',
      description:
        'Dell Inspiron 15 3520 with Intel Core i5 11th Gen, 8GB RAM, 512GB SSD, 15.6" FHD display. Reliable everyday laptop.',
      priceKobo: 52000000,
      condition: 'brand_new',
      tags: ['Inspiron', 'Core i5', 'Everyday'],
      quantity: 7,
    },
    {
      name: 'Dell Latitude 5420 — Core i7, 16GB RAM',
      description:
        'Dell Latitude 5420 business laptop with Core i7 11th Gen, 16GB RAM, 512GB SSD, 14" FHD anti-glare. Built for business.',
      priceKobo: 68000000,
      condition: 'fairly_used',
      tags: ['Latitude', 'Business', 'UK Used'],
      quantity: 6,
    },
    {
      name: 'Dell Alienware m15 R7 — RTX 3070 Ti, Core i9',
      description:
        'Dell Alienware m15 R7 gaming beast with NVIDIA RTX 3070 Ti, Core i9-12900H, 32GB DDR5, 1TB SSD, 240Hz QHD display.',
      priceKobo: 220000000,
      condition: 'brand_new',
      tags: ['Alienware', 'Gaming', 'RTX 3070 Ti'],
      quantity: 2,
    },
    {
      name: 'Dell Latitude E7470 — Core i5 (Refurbished)',
      description:
        'Refurbished Dell Latitude E7470, 6th Gen Core i5, 8GB RAM, 256GB SSD, 14" FHD. Affordable workhorse.',
      priceKobo: 22000000,
      condition: 'refurbished',
      tags: ['Latitude', 'Refurbished'],
      quantity: 12,
    },
    {
      name: 'Dell Original 65W Laptop Charger — 7.4mm Tip',
      description:
        'Original Dell 65W laptop charger with 7.4mm round tip. Fits Inspiron, Latitude, and Vostro series.',
      priceKobo: 1700000,
      condition: 'brand_new',
      tags: ['Charger', '65W', 'Dell'],
      quantity: 28,
      isCharger: true,
    },
    {
      name: 'Dell Original 90W Laptop Charger — Type-C',
      description:
        'Original Dell 90W USB Type-C laptop charger. Compatible with XPS, Latitude 7000 series, and Precision laptops.',
      priceKobo: 2200000,
      condition: 'brand_new',
      tags: ['Charger', '90W', 'Type-C'],
      quantity: 20,
      isCharger: true,
    },
  ],
  Lenovo: [
    {
      name: 'Lenovo ThinkPad X1 Carbon Gen 10 — Core i7, 16GB RAM',
      description:
        'Lenovo ThinkPad X1 Carbon Gen 10 with 12th Gen Intel Core i7, 16GB LPDDR5, 512GB SSD, 14" WUXGA IPS display. Premium business ultrabook.',
      priceKobo: 135000000,
      condition: 'brand_new',
      tags: ['ThinkPad', 'X1 Carbon', 'Business'],
      quantity: 4,
    },
    {
      name: 'Lenovo ThinkPad T14 — Core i5, 16GB RAM',
      description:
        'Lenovo ThinkPad T14 with Intel Core i5 11th Gen, 16GB RAM, 512GB SSD, 14" FHD. Built for productivity.',
      priceKobo: 72000000,
      condition: 'fairly_used',
      tags: ['ThinkPad', 'T14', 'Core i5'],
      quantity: 6,
    },
    {
      name: 'Lenovo IdeaPad 3 — Ryzen 5, 8GB RAM, 512GB SSD',
      description:
        'Lenovo IdeaPad 3 with AMD Ryzen 5 5500U, 8GB RAM, 512GB SSD, 15.6" FHD. Great everyday laptop.',
      priceKobo: 42000000,
      condition: 'brand_new',
      tags: ['IdeaPad', 'Ryzen 5'],
      quantity: 8,
    },
    {
      name: 'Lenovo Legion 5 Pro — RTX 3070, Ryzen 7',
      description:
        'Lenovo Legion 5 Pro gaming laptop with NVIDIA RTX 3070, Ryzen 7 5800H, 16GB DDR4, 1TB SSD, 16" QHD 165Hz display.',
      priceKobo: 175000000,
      condition: 'brand_new',
      tags: ['Legion', 'Gaming', 'RTX 3070'],
      quantity: 3,
    },
    {
      name: 'Lenovo Yoga 7i — Core i7, 2-in-1 Convertible',
      description:
        'Lenovo Yoga 7i 2-in-1 convertible with Core i7 12th Gen, 16GB RAM, 1TB SSD, 14" 2.8K OLED touchscreen.',
      priceKobo: 115000000,
      condition: 'brand_new',
      tags: ['Yoga', '2-in-1', 'OLED'],
      quantity: 3,
    },
    {
      name: 'Lenovo Original 65W USB-C Laptop Charger',
      description:
        'Original Lenovo 65W USB-C laptop charger. Compatible with ThinkPad X1, T-series, Yoga, and IdeaPad models.',
      priceKobo: 1800000,
      condition: 'brand_new',
      tags: ['Charger', '65W', 'USB-C'],
      quantity: 25,
      isCharger: true,
    },
    {
      name: 'Lenovo ThinkPad Slim Tip 90W Charger',
      description:
        'Original Lenovo 90W slim-tip laptop charger. Fits ThinkPad T440, T450, T460, L470 and similar.',
      priceKobo: 1900000,
      condition: 'brand_new',
      tags: ['Charger', '90W', 'Slim Tip'],
      quantity: 18,
      isCharger: true,
    },
  ],
  Acer: [
    {
      name: 'Acer Aspire 5 — Core i5, 8GB RAM, 512GB SSD',
      description:
        'Acer Aspire 5 with Intel Core i5 12th Gen, 8GB DDR4, 512GB NVMe SSD, 15.6" FHD IPS display. Solid everyday performer.',
      priceKobo: 45000000,
      condition: 'brand_new',
      tags: ['Aspire', 'Core i5'],
      quantity: 7,
    },
    {
      name: 'Acer Swift 3 — Ryzen 7, 16GB RAM',
      description:
        'Acer Swift 3 with AMD Ryzen 7 5700U, 16GB LPDDR4X, 512GB SSD, 14" FHD IPS, all-aluminium chassis.',
      priceKobo: 62000000,
      condition: 'brand_new',
      tags: ['Swift', 'Ryzen 7', 'Ultraslim'],
      quantity: 5,
    },
    {
      name: 'Acer Predator Helios 300 — RTX 3060, Core i7',
      description:
        'Acer Predator Helios 300 gaming laptop with NVIDIA RTX 3060, Core i7-12700H, 16GB DDR5, 1TB SSD, 15.6" QHD 165Hz.',
      priceKobo: 140000000,
      condition: 'brand_new',
      tags: ['Predator', 'Gaming', 'RTX 3060'],
      quantity: 3,
    },
    {
      name: 'Acer Nitro 5 — RTX 3050, Ryzen 5',
      description:
        'Acer Nitro 5 entry-level gaming laptop with NVIDIA RTX 3050, Ryzen 5 6600H, 8GB DDR5, 512GB SSD, 15.6" FHD 144Hz.',
      priceKobo: 88000000,
      condition: 'brand_new',
      tags: ['Nitro', 'Gaming', 'RTX 3050'],
      quantity: 4,
    },
    {
      name: 'Acer Original 65W Laptop Charger',
      description:
        'Original Acer 65W laptop charger with 3.0mm yellow tip. Fits Aspire, Swift, and TravelMate series.',
      priceKobo: 1500000,
      condition: 'brand_new',
      tags: ['Charger', '65W', 'Yellow Tip'],
      quantity: 22,
      isCharger: true,
    },
    {
      name: 'Acer Predator 180W Gaming Laptop Charger',
      description:
        'Original Acer 180W high-power adapter for Predator and Nitro gaming laptops.',
      priceKobo: 3500000,
      condition: 'brand_new',
      tags: ['Charger', '180W', 'Gaming'],
      quantity: 10,
      isCharger: true,
    },
  ],
  Asus: [
    {
      name: 'Asus ZenBook 14 — Core i7, 16GB RAM, OLED',
      description:
        'Asus ZenBook 14 with Intel Core i7 12th Gen, 16GB LPDDR5, 1TB SSD, 14" 2.8K OLED display. Premium ultrabook.',
      priceKobo: 118000000,
      condition: 'brand_new',
      tags: ['ZenBook', 'OLED', 'Core i7'],
      quantity: 4,
    },
    {
      name: 'Asus VivoBook 15 — Core i3, 8GB RAM, 512GB SSD',
      description:
        'Asus VivoBook 15 with Intel Core i3 11th Gen, 8GB RAM, 512GB SSD, 15.6" FHD display. Budget-friendly.',
      priceKobo: 36000000,
      condition: 'brand_new',
      tags: ['VivoBook', 'Core i3', 'Budget'],
      quantity: 10,
    },
    {
      name: 'Asus ROG Strix G15 — RTX 3070, Ryzen 9',
      description:
        'Asus ROG Strix G15 gaming laptop with NVIDIA RTX 3070, AMD Ryzen 9 6900HX, 16GB DDR5, 1TB SSD, 15.6" QHD 165Hz.',
      priceKobo: 195000000,
      condition: 'brand_new',
      tags: ['ROG', 'Gaming', 'RTX 3070'],
      quantity: 2,
    },
    {
      name: 'Asus TUF Gaming F15 — RTX 3050, Core i5',
      description:
        'Asus TUF Gaming F15 with NVIDIA RTX 3050, Core i5-11400H, 16GB DDR4, 512GB SSD, 15.6" FHD 144Hz. Durable build.',
      priceKobo: 92000000,
      condition: 'brand_new',
      tags: ['TUF', 'Gaming', 'RTX 3050'],
      quantity: 4,
    },
    {
      name: 'Asus Original 65W Laptop Charger',
      description:
        'Original Asus 65W laptop charger with 4.5mm tip. Fits ZenBook, VivoBook, and ASUS X-series.',
      priceKobo: 1600000,
      condition: 'brand_new',
      tags: ['Charger', '65W'],
      quantity: 25,
      isCharger: true,
    },
    {
      name: 'Asus ROG 240W Gaming Charger',
      description:
        'Original Asus ROG 240W high-output gaming charger for Strix and Scar series.',
      priceKobo: 4800000,
      condition: 'brand_new',
      tags: ['Charger', '240W', 'ROG'],
      quantity: 8,
      isCharger: true,
    },
  ],
  Apple: [
    {
      name: 'MacBook Air M2 — 8GB RAM, 256GB SSD',
      description:
        'Apple MacBook Air with M2 chip, 8GB unified memory, 256GB SSD, 13.6" Liquid Retina display, MagSafe charging.',
      priceKobo: 135000000,
      condition: 'brand_new',
      tags: ['MacBook Air', 'M2', 'Apple Silicon'],
      quantity: 5,
    },
    {
      name: 'MacBook Pro 14" M2 Pro — 16GB RAM, 512GB SSD',
      description:
        'Apple MacBook Pro 14" with M2 Pro chip, 16GB unified memory, 512GB SSD, 14.2" Liquid Retina XDR display.',
      priceKobo: 245000000,
      condition: 'brand_new',
      tags: ['MacBook Pro', 'M2 Pro', '14-inch'],
      quantity: 3,
    },
    {
      name: 'MacBook Pro 13" M1 — 8GB RAM, 256GB SSD (UK Used)',
      description:
        'Apple MacBook Pro 13" with M1 chip, 8GB unified memory, 256GB SSD. UK used, clean condition.',
      priceKobo: 95000000,
      condition: 'fairly_used',
      tags: ['MacBook Pro', 'M1', 'UK Used'],
      quantity: 4,
    },
    {
      name: 'Apple MagSafe 3 67W USB-C Power Adapter',
      description:
        'Genuine Apple 67W USB-C MagSafe 3 power adapter for MacBook Air M2 and MacBook Pro M2.',
      priceKobo: 4500000,
      condition: 'brand_new',
      tags: ['Charger', 'MagSafe', '67W'],
      quantity: 15,
      isCharger: true,
    },
    {
      name: 'Apple 96W USB-C Power Adapter',
      description:
        'Apple 96W USB-C Power Adapter for MacBook Pro 16" — fast charging supported.',
      priceKobo: 5800000,
      condition: 'brand_new',
      tags: ['Charger', 'USB-C', '96W'],
      quantity: 10,
      isCharger: true,
    },
  ],
  Microsoft: [
    {
      name: 'Microsoft Surface Laptop 5 — Core i7, 16GB RAM',
      description:
        'Microsoft Surface Laptop 5 with Intel Core i7 12th Gen, 16GB RAM, 512GB SSD, 13.5" PixelSense touchscreen.',
      priceKobo: 158000000,
      condition: 'brand_new',
      tags: ['Surface Laptop', 'Core i7', 'Touchscreen'],
      quantity: 3,
    },
    {
      name: 'Microsoft Surface Pro 9 — Core i5, 8GB RAM',
      description:
        'Microsoft Surface Pro 9 2-in-1 with Core i5, 8GB RAM, 256GB SSD, 13" PixelSense Flow display. Keyboard sold separately.',
      priceKobo: 128000000,
      condition: 'brand_new',
      tags: ['Surface Pro', '2-in-1', 'Touchscreen'],
      quantity: 4,
    },
    {
      name: 'Microsoft Surface 65W Power Supply',
      description:
        'Genuine Microsoft 65W Surface Connect power supply. For Surface Laptop, Surface Pro, and Surface Book.',
      priceKobo: 3200000,
      condition: 'brand_new',
      tags: ['Charger', 'Surface Connect', '65W'],
      quantity: 14,
      isCharger: true,
    },
  ],
};

// ─── Main seed ─────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // ── 1. Wipe single-store-relevant collections (preserve users for login continuity)
  const toWipe = [
    'stores',
    'creators',
    'listings',
    'categories',
    'savedproducts',
    'carts',
    'follows',
    'reviews',
    'orders',
  ];
  for (const name of toWipe) {
    try {
      await db.collection(name).drop();
      console.log(`🗑️  Dropped collection: ${name}`);
    } catch {
      /* may not exist */
    }
  }
  console.log('');

  // ── 2. Ensure super-admin user
  const usersCol = db.collection('users');
  let adminUser = await usersCol.findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    const hashedPw = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const res = await usersCol.insertOne({
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      email: ADMIN_EMAIL,
      password: hashedPw,
      role: 'super_admin',
      authProvider: 'local',
      isEmailVerified: true,
      isSuspended: false,
      isDeleted: false,
      mobile: { phoneNumber: STORE_PHONE, isoCode: 'NG' },
      country: 'Nigeria',
      city: 'Lagos',
      createdAt: ago(30),
      updatedAt: new Date(),
    });
    adminUser = await usersCol.findOne({ _id: res.insertedId });
    console.log(`✅ Created super-admin: ${ADMIN_EMAIL} (pw: ${ADMIN_PASSWORD})`);
  } else {
    await usersCol.updateOne(
      { _id: adminUser._id },
      {
        $set: {
          role: 'super_admin',
          isEmailVerified: true,
          mobile: { phoneNumber: STORE_PHONE, isoCode: 'NG' },
          updatedAt: new Date(),
        },
      },
    );
    console.log(`ℹ️  Super-admin already exists: ${ADMIN_EMAIL}`);
  }

  // ── 3. Create creator profile for super-admin (isSystemAccount: true)
  const creatorId = oid();
  await db.collection('creators').insertOne({
    _id: creatorId,
    userId: adminUser._id,
    username: 'Odogwu_Laptops',
    slug: STORE_SLUG,
    bio: 'Official Odogwu Laptops admin account.',
    profileImageUrl: storeLogo,
    phoneNumber: STORE_PHONE,
    whatsappNumber: STORE_WHATSAPP,
    industries: ['Laptops & Electronics'],
    tags: ['laptops', 'chargers', 'electronics'],
    plan: 'business',
    status: 'active',
    isVerified: true,
    isSystemAccount: true,
    location: { country: 'Nigeria' },
    totalStores: 1,
    totalListings: 0,
    totalSales: 0,
    rating: 5,
    totalReviews: 0,
    totalFollowers: 0,
    createdAt: ago(30),
    updatedAt: new Date(),
  });
  console.log('✅ Created creator profile (Odogwu_Laptops, system account)');

  // ── 4. Create the Odogwu Laptops store
  const storeId = oid();
  const totalProducts = Object.values(PRODUCTS_BY_BRAND).reduce(
    (sum, ps) => sum + ps.length,
    0,
  );
  await db.collection('stores').insertOne({
    _id: storeId,
    creatorId,
    userId: adminUser._id,
    name: 'Odogwu Laptops',
    slug: STORE_SLUG,
    logo: storeLogo,
    coverImage: storeCover,
    description:
      'Nigeria\'s trusted laptop store — brand new and UK-used laptops, original chargers, and accessories from HP, Dell, Lenovo, Acer, Asus, Apple, and Microsoft.',
    tagline: 'Quality laptops. Real warranty. Fast delivery.',
    phoneNumber: STORE_PHONE,
    whatsappNumber: STORE_WHATSAPP,
    email: ADMIN_EMAIL,
    location: {
      country: 'Nigeria',
    },
    categories: BRANDS.map((b) => b.name),
    tags: ['laptops', 'chargers', 'hp', 'dell', 'lenovo', 'apple'],
    featuredWorks: laptopImages.slice(0, 6),
    operatingHours: {
      monday: '9:00 AM - 7:00 PM',
      tuesday: '9:00 AM - 7:00 PM',
      wednesday: '9:00 AM - 7:00 PM',
      thursday: '9:00 AM - 7:00 PM',
      friday: '9:00 AM - 7:00 PM',
      saturday: '10:00 AM - 5:00 PM',
      sunday: 'Closed',
    },
    status: 'active',
    isVisible: true,
    isVerified: true,
    isSuperVerified: true,
    totalListings: totalProducts,
    totalSales: 0,
    rating: 5,
    totalReviews: 0,
    followers: 0,
    createdAt: ago(30),
    updatedAt: new Date(),
  });
  console.log('✅ Created store: Odogwu Laptops (super-verified)');

  // ── 5. Seed categories (one per brand)
  const categoriesDocs = BRANDS.map((b, idx) => ({
    _id: oid(),
    name: b.name,
    slug: b.slug,
    description: b.description,
    icon: b.icon,
    image: laptopImages[idx % laptopImages.length],
    parentId: null,
    sortOrder: idx + 1,
    isActive: true,
    listingCount: PRODUCTS_BY_BRAND[b.name]?.length || 0,
    isDeleted: false,
    createdAt: ago(30),
    updatedAt: new Date(),
  }));
  await db.collection('categories').insertMany(categoriesDocs);
  console.log(`✅ Created ${categoriesDocs.length} brand categories`);

  // ── 6. Seed listings (laptops + chargers per brand)
  const listingDocs: any[] = [];
  for (const brand of BRANDS) {
    const products = PRODUCTS_BY_BRAND[brand.name] || [];
    for (const p of products) {
      const img = p.isCharger ? nextChargerImg() : nextLaptopImg();
      const altImg = p.isCharger ? nextChargerImg() : nextLaptopImg();
      listingDocs.push({
        _id: oid(),
        storeId,
        creatorId,
        userId: adminUser._id,
        itemName: p.name,
        description: p.description,
        condition: p.condition,
        category: brand.name,
        tags: p.tags,
        quantity: p.quantity,
        media: [
          { url: img, type: 'image' },
          { url: altImg, type: 'image' },
        ],
        type: 'admin',
        askingPrice: {
          amount: p.priceKobo,
          currency: 'NGN',
          negotiable: false,
        },
        adminPricing: {
          sellingPrice: p.priceKobo,
        },
        status: 'live',
        whatsappNumber: STORE_WHATSAPP,
        listingFee: null,
        feePaidAmount: 0,
        isExpectingFee: false,
        location: { country: 'Nigeria' },
        views: Math.floor(Math.random() * 200),
        likes: Math.floor(Math.random() * 30),
        totalSales: 0,
        wasLive: false,
        isDeleted: false,
        createdAt: ago(Math.floor(Math.random() * 25) + 1),
        updatedAt: new Date(),
      });
    }
  }
  await db.collection('listings').insertMany(listingDocs);
  console.log(`✅ Created ${listingDocs.length} listings (laptops + chargers)`);

  // ── 7. Update denormalised counters
  await db.collection('creators').updateOne(
    { _id: creatorId },
    { $set: { totalListings: listingDocs.length, updatedAt: new Date() } },
  );

  // ── Summary
  console.log('\n══════════════════════════════════════════════');
  console.log('  ODOGWU LAPTOPS SEED COMPLETE');
  console.log('══════════════════════════════════════════════');
  console.log(`  Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Store slug:  ${STORE_SLUG}`);
  console.log(`  WhatsApp:    +${STORE_WHATSAPP}`);
  console.log(`  Categories:  ${BRANDS.length}`);
  console.log(`  Listings:    ${listingDocs.length}`);
  console.log('══════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
