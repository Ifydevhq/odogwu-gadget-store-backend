/**
 * Seed script for the standard Odogwu Gadget Store category taxonomy.
 * Idempotent: upserts top-level categories and their subcategories keyed
 * by slug, so it is safe to run multiple times.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed-categories.ts
 *   or: npm run seed:categories
 */
import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comaket';

// parent -> [children]
const TAXONOMY: Record<string, string[]> = {
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function upsertCategory(
  db: any,
  name: string,
  parentId: any,
  sortOrder: number,
) {
  const slug = slugify(name);
  const now = new Date();

  await db.collection('categories').updateOne(
    { slug },
    {
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
    },
    { upsert: true },
  );

  const doc = await db.collection('categories').findOne({ slug });
  return doc;
}

async function seed() {
  await connect(DB_URI);
  console.log('Connected to MongoDB');

  const db = connection.db;

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
  await connection.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
