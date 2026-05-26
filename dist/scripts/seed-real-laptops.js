"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const cloudinary_1 = require("cloudinary");
dotenv.config();
const STORE_SLUG = 'odogwu-laptops';
const IMAGES_DIR = path.resolve(__dirname, '../../../Odogwu-Laptops-Frontend/public/assets/imgs/laptops-pics');
const oid = () => new mongoose.Types.ObjectId();
const ago = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const naira = (amount) => amount * 100;
const uploadCache = {};
async function uploadImage(filename) {
    if (uploadCache[filename])
        return uploadCache[filename];
    const filePath = path.join(IMAGES_DIR, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Image not found: ${filePath}`);
    }
    const res = await cloudinary_1.v2.uploader.upload(filePath, {
        folder: 'odogwu-laptops/listings',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        resource_type: 'image',
    });
    uploadCache[filename] = res.secure_url;
    return res.secure_url;
}
const CATALOG = [
    {
        category: 'HP',
        itemName: 'HP EliteBook 1030 G2 x360 — Core i5 7th Gen, 8GB RAM, 256GB SSD (Touch)',
        description: 'HP EliteBook x360 1030 G2 convertible business ultrabook. Intel Core i5-7300U (7th Gen), 8GB DDR4 RAM, 256GB NVMe SSD, 13.3" FHD touchscreen (2-in-1 hinge), backlit keyboard, fingerprint reader, Wi-Fi + Bluetooth. Lightweight 1.28 kg aluminium build.\n\nIdeal for: students, freelancers, forex trading, light web development, remote work, business presentations.',
        condition: 'fairly_used',
        priceNaira: 245000,
        quantity: 3,
        tags: ['EliteBook', 'x360', '2-in-1', 'Touchscreen', 'Core i5', 'UK Used'],
        files: ['hp 1030 g2.jpg', 'HP Elitebook 1030 G2 ___- i5_- 7th Gen _- 256ssd and 8gb Ram _- Touchscreen __Price _ 890,000__0756321405 • 0763378511_#theaccessoriesguykeith.jpeg'],
    },
    {
        category: 'HP',
        itemName: 'HP EliteBook 820 G4 — Core i5 7th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 820 G4 ultra-portable business laptop. Intel Core i5-7300U (7th Gen), 8GB DDR4 RAM, 256GB SSD, 12.5" HD anti-glare display, backlit keyboard, fingerprint reader, MIL-STD-810G tested chassis. Compact 1.34 kg form factor.\n\nIdeal for: forex trading, accounting, students, sales reps, light development work.',
        condition: 'fairly_used',
        priceNaira: 195000,
        quantity: 4,
        tags: ['EliteBook', '820 G4', 'Compact', 'Core i5', 'UK Used'],
        files: ['hp 820 g4.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP EliteBook 830 G5 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 830 G5 premium business ultrabook. Intel Core i5-8350U (8th Gen quad-core), 8GB DDR4 RAM, 256GB NVMe SSD, 13.3" FHD IPS display, backlit keyboard, fingerprint + smart card reader, USB-C/Thunderbolt.\n\nIdeal for: corporate professionals, forex trading, web development, cyber-security analysts, remote work.',
        condition: 'fairly_used',
        priceNaira: 295000,
        quantity: 4,
        tags: ['EliteBook', '830 G5', 'Core i5', 'Ultrabook', 'UK Used'],
        files: ['hp 830 g5.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP EliteBook 840 G3 — Core i5 6th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 840 G3 — proven business workhorse. Intel Core i5-6300U (6th Gen), 8GB DDR4 RAM, 256GB SSD, 14" FHD display, backlit keyboard, fingerprint reader. Refurbished, inspected, and tested.\n\nIdeal for: students, office productivity, web browsing, online learning, forex trading.',
        condition: 'refurbished',
        priceNaira: 220000,
        quantity: 6,
        tags: ['EliteBook', '840 G3', 'Refurbished', 'Core i5', 'Budget'],
        files: ['hp 840 g3.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP EliteBook 840 G4 — Core i7 7th Gen, 16GB RAM, 512GB SSD',
        description: 'HP EliteBook 840 G4 — premium business 14-inch laptop. Intel Core i7-7600U (7th Gen), 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD IPS anti-glare display, backlit keyboard, fingerprint reader, vPro security.\n\nIdeal for: web developers, data analysts, forex traders, designers, cyber-security professionals running VMs.',
        condition: 'fairly_used',
        priceNaira: 310000,
        quantity: 5,
        tags: ['EliteBook', '840 G4', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['hp 840 g4.jpg', 'hp 840 g46.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP EliteBook 840 G5 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 840 G5 — sleek 14-inch business notebook. Intel Core i5-8250U (8th Gen quad-core), 8GB DDR4 RAM, 256GB NVMe SSD, 14" FHD IPS display, backlit keyboard, fingerprint reader, dual-band Wi-Fi + Bluetooth 5.\n\nIdeal for: developers, finance professionals, students, marketing teams, forex trading.',
        condition: 'fairly_used',
        priceNaira: 360000,
        quantity: 5,
        tags: ['EliteBook', '840 G5', 'Core i5', 'UK Used', 'Backlit'],
        files: ['hp 840 g5.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP EliteBook 840 G6 — Core i7 8th Gen, 16GB RAM, 512GB SSD',
        description: 'HP EliteBook 840 G6 — modern slim business laptop. Intel Core i7-8665U (8th Gen quad-core, vPro), 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD IPS display, backlit keyboard, fingerprint reader, Sure View privacy screen option.\n\nIdeal for: senior developers, cyber-security analysts, forex traders, finance professionals, executives.',
        condition: 'fairly_used',
        priceNaira: 480000,
        quantity: 4,
        tags: ['EliteBook', '840 G6', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['hp 840 g6.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP EliteBook 840 G8 — Core i5 11th Gen, 16GB RAM, 512GB SSD',
        description: 'HP EliteBook 840 G8 — modern thin & light business laptop. Intel Core i5-1135G7 (11th Gen) with Intel Iris Xe graphics, 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD IPS anti-glare display, backlit keyboard, fingerprint reader, Wi-Fi 6 + Bluetooth 5.2.\n\nIdeal for: software developers, cyber-security professionals, forex traders, content creators, anyone needing modern performance with all-day battery.',
        condition: 'fairly_used',
        priceNaira: 620000,
        quantity: 4,
        tags: ['EliteBook', '840 G8', '11th Gen', 'Iris Xe', '16GB RAM'],
        files: ['hp 840 g8.jpg', 'hp 840 g8 2.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP Pavilion 14 — Core i5, 8GB RAM, 512GB SSD',
        description: 'HP Pavilion 14 — slim everyday laptop. Intel Core i5 with Intel UHD Graphics, 8GB DDR4 RAM, 512GB SSD, 14" FHD micro-edge display, fast charging, dual speakers tuned by B&O.\n\nIdeal for: students, content creators, online learning, web browsing, light work-from-home, forex trading.',
        condition: 'brand_new',
        priceNaira: 540000,
        quantity: 6,
        tags: ['Pavilion', '14-inch', 'Core i5', 'Everyday', 'Brand New'],
        files: ['hp pavilion 14.jpg'],
    },
    {
        category: 'HP',
        itemName: 'HP Pavilion Gaming — Core i5 8th Gen, 8GB RAM, GTX Graphics',
        description: 'HP Pavilion Gaming 15 — entry-level gaming and creator laptop. Intel Core i5 (8th Gen), NVIDIA GeForce GTX dedicated graphics, 8GB DDR4 RAM, 256GB SSD + 1TB HDD, 15.6" FHD display, green-backlit keyboard, dual cooling fans.\n\nIdeal for: gamers, video editors, 3D design students, web developers running VMs/containers, casual streaming.',
        condition: 'fairly_used',
        priceNaira: 590000,
        quantity: 3,
        tags: ['Pavilion', 'Gaming', 'GTX', 'Core i5', 'UK Used'],
        files: ['Gaming laptop.jpeg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell Latitude 3500 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'Dell Latitude 3500 — reliable 15.6" business laptop. Intel Core i5-8265U (8th Gen quad-core), 8GB DDR4 RAM, 256GB SSD, 15.6" FHD anti-glare display, full-size keyboard with number pad.\n\nIdeal for: office productivity, finance, students, forex trading, accountants.',
        condition: 'fairly_used',
        priceNaira: 295000,
        quantity: 4,
        tags: ['Latitude', '3500', 'Core i5', '15.6-inch', 'UK Used'],
        files: ['dell 3500.jpg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell Latitude 7390 — Core i7 8th Gen, 16GB RAM, 512GB SSD',
        description: 'Dell Latitude 7390 — premium 13.3" business ultrabook. Intel Core i7-8650U (8th Gen vPro), 16GB DDR4 RAM, 512GB NVMe SSD, 13.3" FHD IPS display, backlit keyboard, fingerprint reader, carbon-fibre composite chassis, Thunderbolt 3.\n\nIdeal for: senior developers, forex traders, cyber-security pros, consultants, executives.',
        condition: 'fairly_used',
        priceNaira: 395000,
        quantity: 4,
        tags: ['Latitude', '7390', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['dell 7390.jpg', 'dell E7390.jpg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell Latitude 5289 2-in-1 — Core i5 7th Gen, 8GB RAM, 256GB SSD (Convertible)',
        description: 'Dell Latitude 5289 (2-in-1 convertible). Intel Core i5-7300U (7th Gen), 8GB DDR4 RAM, 256GB SSD, 12.5" FHD touchscreen with 360° hinge, backlit keyboard, active pen support, fingerprint reader.\n\nIdeal for: presentations, students, note-takers, designers, sales reps, executives on the move.',
        condition: 'fairly_used',
        priceNaira: 320000,
        quantity: 3,
        tags: ['Latitude', '5289', '2-in-1', 'Convertible', 'Touchscreen', 'UK Used'],
        files: ['dell x360 5298.jpg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell Latitude E7450 — Core i5 5th Gen, 8GB RAM, 256GB SSD',
        description: 'Dell Latitude E7450 — proven 14" business ultrabook. Intel Core i5-5300U (5th Gen), 8GB DDR3L RAM, 256GB SSD, 14" FHD display, backlit keyboard, fingerprint reader. Inspected and refurbished.\n\nIdeal for: students, office tasks, online classes, light forex trading, web browsing.',
        condition: 'refurbished',
        priceNaira: 215000,
        quantity: 6,
        tags: ['Latitude', 'E7450', 'Refurbished', 'Budget', 'Core i5'],
        files: ['dell-E7450.jpg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell XPS 13 — Core i7, 16GB RAM, 512GB SSD',
        description: 'Dell XPS 13 — premium InfinityEdge ultrabook. Intel Core i7, 16GB LPDDR4X RAM, 512GB NVMe SSD, 13.3" FHD+ near-edgeless display, machined aluminium & carbon-fibre build, backlit keyboard, fingerprint power button, Thunderbolt 3.\n\nIdeal for: senior software engineers, designers, forex traders, cyber-security pros, executives wanting the best in a small form factor.',
        condition: 'fairly_used',
        priceNaira: 820000,
        quantity: 2,
        tags: ['XPS 13', 'Ultrabook', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['dell-xps-13.jpg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell XPS 15 — Core i7, 16GB RAM, 512GB SSD',
        description: 'Dell XPS 15 — flagship 15.6" creator-class laptop. Intel Core i7 with dedicated NVIDIA graphics, 16GB DDR4 RAM, 512GB NVMe SSD, 15.6" FHD InfinityEdge display, carbon-fibre palmrest, backlit keyboard, fingerprint reader, Thunderbolt 3.\n\nIdeal for: video editors, photographers, 3D designers, senior developers, AI/ML practitioners, cyber-security pros running VMs.',
        condition: 'fairly_used',
        priceNaira: 1050000,
        quantity: 2,
        tags: ['XPS 15', 'Creator', 'Core i7', 'NVIDIA', 'UK Used'],
        files: ['laptop best price for you buy now zezesmart.jpeg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell Precision 5510 — Workstation, Core i7, 16GB RAM, Quadro Graphics',
        description: 'Dell Precision 5510 — mobile workstation. Intel Core i7 6th Gen, 16GB DDR4 RAM, 512GB SSD, NVIDIA Quadro M1000M dedicated graphics, 15.6" FHD InfinityEdge display, carbon-fibre palmrest, backlit keyboard.\n\nIdeal for: CAD/CAM, 3D modelling, video editing, engineering students, GIS professionals, AI/ML training on smaller datasets.',
        condition: 'fairly_used',
        priceNaira: 595000,
        quantity: 2,
        tags: ['Precision', 'Workstation', 'Quadro', 'Core i7', 'UK Used'],
        files: ['Dell Precision 5510 sản xuất năm nào_ Liệu có nên mua không_.jpeg'],
    },
    {
        category: 'Dell',
        itemName: 'Dell Latitude 3420 — Core i5 11th Gen, 16GB RAM, 512GB SSD',
        description: 'Dell Latitude 3420 — modern 14" business laptop. Intel Core i5-1135G7 (11th Gen) with Intel Iris Xe graphics, 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD display, spill-resistant keyboard, MIL-STD-810H tested.\n\nIdeal for: developers, finance professionals, forex traders, IT support staff, students, anyone wanting modern 11th Gen performance.',
        condition: 'fairly_used',
        priceNaira: 510000,
        quantity: 5,
        tags: ['Latitude', '3420', '11th Gen', 'Iris Xe', '16GB RAM'],
        files: ['🔥👉🏽💙𝐃𝐞𝐥𝐥💙𝐋𝐚𝐭𝐢𝐭𝐮𝐝𝐞💙𝟑𝟒𝟐𝟎💙𝐰𝐢𝐭𝐡💙𝐈𝐧𝐭𝐞𝐥®💙𝐂𝐨𝐫𝐞™💙𝐢𝟓-𝟏𝟏𝟑𝟓𝐆𝟕,💙𝟏𝟔𝐆𝐁💙𝐑𝐀𝐌💙𝐚.jpeg'],
    },
    {
        category: 'Lenovo',
        itemName: 'Lenovo ThinkPad X1 Carbon Gen 6 — Core i7 8th Gen, 16GB RAM, 512GB SSD',
        description: 'Lenovo ThinkPad X1 Carbon Gen 6 — premium business ultrabook. Intel Core i7-8650U (8th Gen vPro), 16GB LPDDR3 RAM, 512GB NVMe SSD, 14" 2K (2560×1440) IPS display, backlit keyboard, fingerprint reader, carbon-fibre roll cage, Thunderbolt 3. Weight 1.13 kg.\n\nIdeal for: senior software engineers, CTOs, forex traders, cyber-security pros, consultants, executives — the gold standard for serious work-on-the-go.',
        condition: 'fairly_used',
        priceNaira: 525000,
        quantity: 3,
        tags: ['ThinkPad', 'X1 Carbon', 'Gen 6', 'Core i7', '2K Display', 'UK Used'],
        files: ['Lenovo Thinkpad X1 Carbon Gen 6, core i7, 8th generation, 512ssd, 16gb ram, 2K screen display, backlit keyboard KSH_63,0000 CONTACT US_ 0714215210.jpeg'],
    },
    {
        category: 'Lenovo',
        itemName: 'Lenovo Yoga 720 2-in-1 — Core i7, 8GB RAM, 256GB SSD (Convertible Touchscreen)',
        description: 'Lenovo Yoga 720 — slim 13.3" 2-in-1 convertible. Intel Core i7 with Intel HD Graphics, 8GB DDR4 RAM, 256GB NVMe SSD, 13.3" FHD IPS touchscreen with 360° hinge, backlit keyboard, fingerprint reader, JBL stereo speakers, Thunderbolt 3.\n\nIdeal for: students, content creators, presenters, designers, sales reps, anyone wanting a tablet-laptop hybrid.',
        condition: 'fairly_used',
        priceNaira: 345000,
        quantity: 3,
        tags: ['Yoga', '720', '2-in-1', 'Touchscreen', 'Core i7', 'UK Used'],
        files: ['Lenovo yoga x360.jpg'],
    },
    {
        category: 'Lenovo',
        itemName: 'Lenovo ThinkPad L480 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'Lenovo ThinkPad L480 — durable 14" business laptop. Intel Core i5-8250U (8th Gen quad-core), 8GB DDR4 RAM, 256GB SSD, 14" FHD IPS display, spill-resistant ThinkPad keyboard, fingerprint reader, MIL-STD durability testing.\n\nIdeal for: developers, IT pros, finance, forex trading, students — built to last.',
        condition: 'fairly_used',
        priceNaira: 305000,
        quantity: 5,
        tags: ['ThinkPad', 'L480', 'Core i5', '14-inch', 'UK Used'],
        files: ['lenovo-l480.jpg'],
    },
    {
        category: 'Asus',
        itemName: 'Asus VivoBook 14 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'Asus VivoBook 14 — slim everyday laptop. Intel Core i5-8250U (8th Gen quad-core), 8GB DDR4 RAM, 256GB SSD, 14" FHD NanoEdge display, ergonomic hinge, fingerprint reader, lightweight 1.45 kg.\n\nIdeal for: students, online learning, content creators on a budget, forex trading, web browsing, light development.',
        condition: 'fairly_used',
        priceNaira: 295000,
        quantity: 4,
        tags: ['VivoBook', '14-inch', 'Core i5', 'NanoEdge', 'UK Used'],
        files: ['asus vivobook.jpg'],
    },
    {
        category: 'Apple',
        itemName: 'MacBook Pro 13" 2019 — Intel Core i5, 8GB RAM, 256GB SSD (UK Used)',
        description: 'MacBook Pro 13" 2019 (Touch Bar + Touch ID). Intel Core i5 (8th Gen), 8GB LPDDR3 RAM, 256GB SSD, 13.3" Retina display, Touch Bar, Touch ID, four Thunderbolt 3 ports, backlit Magic Keyboard. Cycle count ~260.\n\nIdeal for: developers, designers, content creators, forex traders, cyber-security analysts in the Apple ecosystem.',
        condition: 'fairly_used',
        priceNaira: 695000,
        quantity: 2,
        tags: ['MacBook Pro', '2019', '13-inch', 'Touch Bar', 'Retina', 'UK Used'],
        files: ['MACBOOK PRO 2019_INTEL CORE I5_13_3” RETINA DISPLAY_RAM_ 8GB_STORAGE_ 256GB SSD_TOUCH BAR _ TOUCH ID_CYCLE COUNT_ 260_CONDITION_ UK USED__GHC 6500.jpeg', 'Macbook Pro 2019.jpeg'],
    },
    {
        category: 'Apple',
        itemName: 'MacBook Pro 14" M1 Pro — 16GB Unified Memory, 512GB SSD',
        description: 'MacBook Pro 14" with Apple M1 Pro chip (8-core CPU, 14-core GPU), 16GB unified memory, 512GB SSD, 14.2" Liquid Retina XDR display (ProMotion 120Hz), MagSafe charging, Touch ID, three Thunderbolt 4 ports, HDMI, SD card slot. Open-box, cycle count ~230.\n\nIdeal for: video editors, 3D designers, senior developers, music producers, AI/ML engineers, cyber-security pros — flagship pro-grade performance.',
        condition: 'fairly_used',
        priceNaira: 1950000,
        quantity: 2,
        tags: ['MacBook Pro', '14-inch', 'M1 Pro', 'Apple Silicon', 'Pro', 'UK Used'],
        files: ['MacBook pro 14 inch 16GB unified memory 512 GB ssd Apple M1 pro chip open Box cycle count 230 KSH_218,000_= CONTACT US_0714215201.jpeg'],
    },
    {
        category: 'Apple',
        itemName: 'MacBook Pro 13" 2020 — Intel Core i5, 8GB RAM, 256GB SSD (UK Used)',
        description: 'MacBook Pro 13" 2020 (Two Thunderbolt 3 ports model). Intel Core i5 1.4 GHz Quad-Core (10th Gen), 8GB LPDDR3 RAM, 256GB SSD, 13.3" Retina display with True Tone, Touch Bar, Touch ID, Magic Keyboard with scissor mechanism.\n\nIdeal for: developers, designers, students, forex traders, content creators on the Apple ecosystem.',
        condition: 'fairly_used',
        priceNaira: 780000,
        quantity: 2,
        tags: ['MacBook Pro', '2020', '13-inch', 'Touch Bar', 'Quad-Core', 'UK Used'],
        files: ['_ (21).jpeg', '_ (22).jpeg'],
    },
    {
        category: 'Apple',
        itemName: 'MacBook Air M1 2020 — Apple M1, 8GB RAM, 256GB SSD',
        description: 'MacBook Air with Apple M1 chip (8-core CPU, 7-core GPU), 8GB unified memory, 256GB SSD, 13.3" Retina display with True Tone, Touch ID, Magic Keyboard, fanless silent design, up to 18-hour battery.\n\nIdeal for: students, writers, developers, forex traders, designers — Apple Silicon performance in a thin, silent body.',
        condition: 'fairly_used',
        priceNaira: 985000,
        quantity: 3,
        tags: ['MacBook Air', 'M1', 'Apple Silicon', '2020', 'Retina', 'UK Used'],
        files: ['Macbook air m1 2020 (1).jpeg', 'macbook air m1 2020.jpeg'],
    },
    {
        category: 'Apple',
        itemName: 'MacBook Pro 15" Touch Bar — Intel Core i7, 16GB RAM, 256GB SSD',
        description: 'MacBook Pro 15" with Touch Bar. Intel Core i7 quad-core, 16GB DDR4 RAM, 256GB SSD, Radeon Pro dedicated graphics, 15.4" Retina display, Touch Bar with Touch ID, four Thunderbolt 3 ports, backlit keyboard.\n\nIdeal for: video editors, photographers, music producers, senior developers, designers needing a larger Retina canvas.',
        condition: 'fairly_used',
        priceNaira: 750000,
        quantity: 2,
        tags: ['MacBook Pro', '15-inch', 'Touch Bar', 'Radeon Pro', 'UK Used'],
        files: ['Macbook pro.jpeg'],
    },
];
async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ CLOUDINARY_* env vars missing');
        process.exit(1);
    }
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log(`📁 Images dir: ${IMAGES_DIR}`);
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`❌ Images dir not found: ${IMAGES_DIR}`);
        process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');
    const db = mongoose.connection.db;
    const store = await db.collection('stores').findOne({ slug: STORE_SLUG });
    if (!store) {
        console.error(`❌ Store "${STORE_SLUG}" not found. Run yarn seed:odogwu first.`);
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`🏬 Store:   ${store.name} (${store._id})`);
    console.log(`👤 Creator: ${store.creatorId}`);
    console.log(`👨‍💼 User:    ${store.userId}\n`);
    for (const col of ['listings', 'savedproducts', 'carts', 'orders', 'reviews', 'follows']) {
        try {
            const r = await db.collection(col).deleteMany({});
            console.log(`🗑️  Wiped ${col}: ${r.deletedCount} docs`);
        }
        catch {
        }
    }
    console.log('');
    console.log(`📦 Seeding ${CATALOG.length} products with ${CATALOG.reduce((s, p) => s + p.files.length, 0)} images...\n`);
    const listingDocs = [];
    for (const product of CATALOG) {
        process.stdout.write(`  • ${product.itemName.substring(0, 50).padEnd(50)} `);
        const media = [];
        for (const filename of product.files) {
            try {
                const url = await uploadImage(filename);
                media.push({ url, type: 'image' });
            }
            catch (err) {
                console.error(`\n    ❌ Failed to upload ${filename}: ${err.message}`);
            }
        }
        if (media.length === 0) {
            console.log(`SKIPPED (no images uploaded)`);
            continue;
        }
        listingDocs.push({
            _id: oid(),
            storeId: store._id,
            creatorId: store.creatorId,
            userId: store.userId,
            itemName: product.itemName,
            description: product.description,
            condition: product.condition,
            category: product.category,
            tags: product.tags,
            quantity: product.quantity,
            media,
            type: 'admin',
            askingPrice: {
                amount: naira(product.priceNaira),
                currency: 'NGN',
                negotiable: false,
            },
            adminPricing: { sellingPrice: naira(product.priceNaira) },
            status: 'live',
            whatsappNumber: '2348109362830',
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
        console.log(`✓ (${media.length} img)`);
    }
    await db.collection('listings').insertMany(listingDocs);
    console.log(`\n✅ Inserted ${listingDocs.length} listings`);
    await db
        .collection('stores')
        .updateOne({ _id: store._id }, { $set: { totalListings: listingDocs.length, updatedAt: new Date() } });
    await db.collection('creators').updateOne({ _id: store.creatorId }, { $set: { totalListings: listingDocs.length, updatedAt: new Date() } });
    const byCategory = {};
    listingDocs.forEach((l) => {
        byCategory[l.category] = (byCategory[l.category] || 0) + 1;
    });
    for (const [name, count] of Object.entries(byCategory)) {
        await db
            .collection('categories')
            .updateOne({ name }, { $set: { listingCount: count, updatedAt: new Date() } });
    }
    await db
        .collection('categories')
        .updateMany({ name: { $nin: Object.keys(byCategory) } }, { $set: { listingCount: 0, updatedAt: new Date() } });
    console.log('\n══════════════════════════════════════════════');
    console.log('  ODOGWU LAPTOPS — REAL INVENTORY SEED COMPLETE');
    console.log('══════════════════════════════════════════════');
    console.log(`  Total products: ${listingDocs.length}`);
    console.log('  By category:');
    for (const [cat, n] of Object.entries(byCategory)) {
        console.log(`    ${cat.padEnd(12)} ${n}`);
    }
    console.log('══════════════════════════════════════════════\n');
    await mongoose.disconnect();
}
seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-real-laptops.js.map