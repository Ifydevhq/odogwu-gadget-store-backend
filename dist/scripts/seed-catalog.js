"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const cloudinary_1 = require("cloudinary");
dotenv.config();
const ADMIN_EMAIL = 'admin@odogwulaptops.com';
const ADMIN_PASSWORD = 'Test@1234';
const ADMIN_FIRST_NAME = 'Odogwu';
const ADMIN_LAST_NAME = 'Admin';
const STORE_SLUG = 'odogwu-laptops';
const STORE_PHONE = '2348109362830';
const STORE_WHATSAPP = '2348109362830';
const STORE_LOGO = '/assets/imgs/logos/odg-logo.png';
const BASE_IMG_DIR = path.resolve(__dirname, '../../../Odogwu-gadget-Frontend/public/assets/imgs');
const FOLDERS = {
    laptops: path.join(BASE_IMG_DIR, 'laptops-pics'),
    gadget: path.join(BASE_IMG_DIR, 'gadget-pics'),
};
const oid = () => new mongoose.Types.ObjectId();
const ago = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const naira = (amount) => amount * 100;
const slugify = (name) => name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
const sub = (categorySlug, brand) => `${categorySlug}-${slugify(brand)}`;
const uploadCache = {};
async function uploadImage(folder, filename) {
    const key = `${folder}/${filename}`;
    if (uploadCache[key])
        return uploadCache[key];
    const filePath = path.join(FOLDERS[folder], filename);
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
    uploadCache[key] = res.secure_url;
    return res.secure_url;
}
const TAXONOMY = [
    {
        name: 'Laptops',
        icon: 'ri-macbook-line',
        description: 'Brand new, UK-used and refurbished laptops.',
        brands: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Microsoft', 'MSI', 'Samsung', 'Toshiba', 'Huawei', 'Razer'],
    },
    {
        name: 'Phones',
        icon: 'ri-smartphone-line',
        description: 'Smartphones from every major brand.',
        brands: ['Apple', 'Samsung', 'Google', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Vivo', 'Nokia', 'Huawei', 'OnePlus', 'Itel', 'Realme'],
    },
    {
        name: 'Tablets',
        icon: 'ri-tablet-line',
        description: 'Tablets and iPads for work and play.',
        brands: ['Apple', 'Samsung', 'Lenovo', 'Huawei', 'Amazon', 'Microsoft', 'Xiaomi'],
    },
    {
        name: 'Speakers',
        icon: 'ri-speaker-line',
        description: 'Bluetooth, portable and party speakers.',
        brands: ['JBL', 'Zealot', 'Sony', 'Bose', 'Oraimo', 'Anker', 'Harman Kardon', 'Marshall', 'Generic'],
    },
    {
        name: 'Power Banks',
        icon: 'ri-battery-charge-line',
        description: 'Portable chargers and power banks.',
        brands: ['Oraimo', 'Anker', 'Baseus', 'Romoss', 'New Age', 'Itel', 'Xiaomi', 'Generic'],
    },
    {
        name: 'Earpods',
        icon: 'ri-headphone-line',
        description: 'Wireless earbuds and earpods.',
        brands: ['Apple', 'Samsung', 'Sony', 'Oraimo', 'JBL', 'Anker', 'Xiaomi', 'Generic'],
    },
    {
        name: 'Headsets',
        icon: 'ri-headphone-line',
        description: 'Headphones, gaming and wireless headsets.',
        brands: ['Sony', 'Bose', 'JBL', 'Beats', 'Sennheiser', 'HyperX', 'Oraimo', 'Generic'],
    },
    {
        name: 'Smartwatches',
        icon: 'ri-watch-line',
        description: 'Smartwatches and fitness bands.',
        brands: ['Apple', 'Samsung', 'Huawei', 'Amazfit', 'Fitbit', 'Oraimo', 'Generic'],
    },
    {
        name: 'Chargers & Cables',
        icon: 'ri-plug-line',
        description: 'Chargers, adapters and cables.',
        brands: ['Apple', 'Oraimo', 'Anker', 'Baseus', 'Samsung', 'UGREEN', 'Generic'],
    },
    {
        name: 'Monitors',
        icon: 'ri-tv-2-line',
        description: 'Desktop and gaming monitors.',
        brands: ['Dell', 'HP', 'LG', 'Samsung', 'Asus', 'AOC', 'Generic'],
    },
    {
        name: 'Computer Accessories',
        icon: 'ri-mouse-line',
        description: 'Keyboards, mice, bags, hubs and more.',
        brands: ['Logitech', 'HP', 'Dell', 'Microsoft', 'Razer', 'Anker', 'UGREEN', 'Generic'],
    },
    {
        name: 'Gaming',
        icon: 'ri-gamepad-line',
        description: 'Consoles, controllers and gaming gear.',
        brands: ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo', 'Razer', 'Logitech', 'Generic'],
    },
    {
        name: 'Networking',
        icon: 'ri-router-line',
        description: 'Routers, MiFi, and internet kits.',
        brands: ['Starlink', 'TP-Link', 'Tenda', 'Huawei', 'MTN', 'Airtel', 'Glo', 'Netgear', 'Generic'],
    },
    {
        name: 'Camera & Photography',
        icon: 'ri-camera-line',
        description: 'Cameras, tripods, and phone rigs.',
        brands: ['Canon', 'Nikon', 'Sony', 'GoPro', 'Yunteng', 'Ulanzi', 'Generic'],
    },
    {
        name: 'Home & Lifestyle',
        icon: 'ri-home-gear-line',
        description: 'Fans, inverters, lighting and smart gadgets.',
        brands: ['Itel', 'Oraimo', 'Bruhm', 'Xiaomi', 'Generic'],
    },
];
const CAT = {
    laptops: 'laptops',
    phones: 'phones',
    speakers: 'speakers',
    powerBanks: slugify('Power Banks'),
    earpods: 'earpods',
    headsets: 'headsets',
    networking: 'networking',
    camera: slugify('Camera & Photography'),
    home: slugify('Home & Lifestyle'),
};
const CATALOG = [
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 1030 G2 x360 — Core i5 7th Gen, 8GB RAM, 256GB SSD (Touch)',
        description: 'HP EliteBook x360 1030 G2 convertible business ultrabook. Intel Core i5-7300U (7th Gen), 8GB DDR4 RAM, 256GB NVMe SSD, 13.3" FHD touchscreen (2-in-1 hinge), backlit keyboard, fingerprint reader, Wi-Fi + Bluetooth. Lightweight 1.28 kg aluminium build.\n\nIdeal for: students, freelancers, forex trading, light web development, remote work.',
        condition: 'fairly_used', priceNaira: 245000, quantity: 3,
        tags: ['EliteBook', 'x360', '2-in-1', 'Touchscreen', 'Core i5', 'UK Used'],
        files: ['hp 1030 g2.jpg', 'HP Elitebook 1030 G2 ___- i5_- 7th Gen _- 256ssd and 8gb Ram _- Touchscreen __Price _ 890,000__0756321405 • 0763378511_#theaccessoriesguykeith.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 820 G4 — Core i5 7th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 820 G4 ultra-portable business laptop. Intel Core i5-7300U (7th Gen), 8GB DDR4 RAM, 256GB SSD, 12.5" HD anti-glare display, backlit keyboard, fingerprint reader, MIL-STD-810G tested chassis. Compact 1.34 kg form factor.',
        condition: 'fairly_used', priceNaira: 195000, quantity: 4,
        tags: ['EliteBook', '820 G4', 'Compact', 'Core i5', 'UK Used'],
        files: ['hp 820 g4.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 830 G5 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 830 G5 premium business ultrabook. Intel Core i5-8350U (8th Gen quad-core), 8GB DDR4 RAM, 256GB NVMe SSD, 13.3" FHD IPS display, backlit keyboard, fingerprint + smart card reader, USB-C/Thunderbolt.',
        condition: 'fairly_used', priceNaira: 295000, quantity: 4,
        tags: ['EliteBook', '830 G5', 'Core i5', 'Ultrabook', 'UK Used'],
        files: ['hp 830 g5.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 840 G3 — Core i5 6th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 840 G3 — proven business workhorse. Intel Core i5-6300U (6th Gen), 8GB DDR4 RAM, 256GB SSD, 14" FHD display, backlit keyboard, fingerprint reader. Refurbished, inspected, and tested.',
        condition: 'refurbished', priceNaira: 220000, quantity: 6,
        tags: ['EliteBook', '840 G3', 'Refurbished', 'Core i5', 'Budget'],
        files: ['hp 840 g3.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 840 G4 — Core i7 7th Gen, 16GB RAM, 512GB SSD',
        description: 'HP EliteBook 840 G4 — premium business 14-inch laptop. Intel Core i7-7600U (7th Gen), 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD IPS anti-glare display, backlit keyboard, fingerprint reader, vPro security.',
        condition: 'fairly_used', priceNaira: 310000, quantity: 5,
        tags: ['EliteBook', '840 G4', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['hp 840 g4.jpg', 'hp 840 g46.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 840 G5 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'HP EliteBook 840 G5 — sleek 14-inch business notebook. Intel Core i5-8250U (8th Gen quad-core), 8GB DDR4 RAM, 256GB NVMe SSD, 14" FHD IPS display, backlit keyboard, fingerprint reader, dual-band Wi-Fi + Bluetooth 5.',
        condition: 'fairly_used', priceNaira: 360000, quantity: 5,
        tags: ['EliteBook', '840 G5', 'Core i5', 'UK Used', 'Backlit'],
        files: ['hp 840 g5.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 840 G6 — Core i7 8th Gen, 16GB RAM, 512GB SSD',
        description: 'HP EliteBook 840 G6 — modern slim business laptop. Intel Core i7-8665U (8th Gen quad-core, vPro), 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD IPS display, backlit keyboard, fingerprint reader, Sure View privacy screen option.',
        condition: 'fairly_used', priceNaira: 480000, quantity: 4,
        tags: ['EliteBook', '840 G6', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['hp 840 g6.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP EliteBook 840 G8 — Core i5 11th Gen, 16GB RAM, 512GB SSD',
        description: 'HP EliteBook 840 G8 — modern thin & light business laptop. Intel Core i5-1135G7 (11th Gen) with Intel Iris Xe graphics, 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD IPS anti-glare display, backlit keyboard, fingerprint reader, Wi-Fi 6 + Bluetooth 5.2.',
        condition: 'fairly_used', priceNaira: 620000, quantity: 4,
        tags: ['EliteBook', '840 G8', '11th Gen', 'Iris Xe', '16GB RAM'],
        files: ['hp 840 g8.jpg', 'hp 840 g8 2.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP Pavilion 14 — Core i5, 8GB RAM, 512GB SSD',
        description: 'HP Pavilion 14 — slim everyday laptop. Intel Core i5 with Intel UHD Graphics, 8GB DDR4 RAM, 512GB SSD, 14" FHD micro-edge display, fast charging, dual speakers tuned by B&O.',
        condition: 'brand_new', priceNaira: 540000, quantity: 6,
        tags: ['Pavilion', '14-inch', 'Core i5', 'Everyday', 'Brand New'],
        files: ['hp pavilion 14.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'HP'),
        itemName: 'HP Pavilion Gaming — Core i5 8th Gen, 8GB RAM, GTX Graphics',
        description: 'HP Pavilion Gaming 15 — entry-level gaming and creator laptop. Intel Core i5 (8th Gen), NVIDIA GeForce GTX dedicated graphics, 8GB DDR4 RAM, 256GB SSD + 1TB HDD, 15.6" FHD display, green-backlit keyboard, dual cooling fans.',
        condition: 'fairly_used', priceNaira: 590000, quantity: 3,
        tags: ['Pavilion', 'Gaming', 'GTX', 'Core i5', 'UK Used'],
        files: ['Gaming laptop.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell Latitude 3500 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'Dell Latitude 3500 — reliable 15.6" business laptop. Intel Core i5-8265U (8th Gen quad-core), 8GB DDR4 RAM, 256GB SSD, 15.6" FHD anti-glare display, full-size keyboard with number pad.',
        condition: 'fairly_used', priceNaira: 295000, quantity: 4,
        tags: ['Latitude', '3500', 'Core i5', '15.6-inch', 'UK Used'],
        files: ['dell 3500.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell Latitude 7390 — Core i7 8th Gen, 16GB RAM, 512GB SSD',
        description: 'Dell Latitude 7390 — premium 13.3" business ultrabook. Intel Core i7-8650U (8th Gen vPro), 16GB DDR4 RAM, 512GB NVMe SSD, 13.3" FHD IPS display, backlit keyboard, fingerprint reader, carbon-fibre composite chassis, Thunderbolt 3.',
        condition: 'fairly_used', priceNaira: 395000, quantity: 4,
        tags: ['Latitude', '7390', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['dell 7390.jpg', 'dell E7390.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell Latitude 5289 2-in-1 — Core i5 7th Gen, 8GB RAM, 256GB SSD (Convertible)',
        description: 'Dell Latitude 5289 (2-in-1 convertible). Intel Core i5-7300U (7th Gen), 8GB DDR4 RAM, 256GB SSD, 12.5" FHD touchscreen with 360° hinge, backlit keyboard, active pen support, fingerprint reader.',
        condition: 'fairly_used', priceNaira: 320000, quantity: 3,
        tags: ['Latitude', '5289', '2-in-1', 'Convertible', 'Touchscreen', 'UK Used'],
        files: ['dell x360 5298.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell Latitude E7450 — Core i5 5th Gen, 8GB RAM, 256GB SSD',
        description: 'Dell Latitude E7450 — proven 14" business ultrabook. Intel Core i5-5300U (5th Gen), 8GB DDR3L RAM, 256GB SSD, 14" FHD display, backlit keyboard, fingerprint reader. Inspected and refurbished.',
        condition: 'refurbished', priceNaira: 215000, quantity: 6,
        tags: ['Latitude', 'E7450', 'Refurbished', 'Budget', 'Core i5'],
        files: ['dell-E7450.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell XPS 13 — Core i7, 16GB RAM, 512GB SSD',
        description: 'Dell XPS 13 — premium InfinityEdge ultrabook. Intel Core i7, 16GB LPDDR4X RAM, 512GB NVMe SSD, 13.3" FHD+ near-edgeless display, machined aluminium & carbon-fibre build, backlit keyboard, fingerprint power button, Thunderbolt 3.',
        condition: 'fairly_used', priceNaira: 820000, quantity: 2,
        tags: ['XPS 13', 'Ultrabook', 'Core i7', '16GB RAM', 'UK Used'],
        files: ['dell-xps-13.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell XPS 15 — Core i7, 16GB RAM, 512GB SSD',
        description: 'Dell XPS 15 — flagship 15.6" creator-class laptop. Intel Core i7 with dedicated NVIDIA graphics, 16GB DDR4 RAM, 512GB NVMe SSD, 15.6" FHD InfinityEdge display, carbon-fibre palmrest, backlit keyboard, fingerprint reader, Thunderbolt 3.',
        condition: 'fairly_used', priceNaira: 1050000, quantity: 2,
        tags: ['XPS 15', 'Creator', 'Core i7', 'NVIDIA', 'UK Used'],
        files: ['laptop best price for you buy now zezesmart.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell Precision 5510 — Workstation, Core i7, 16GB RAM, Quadro Graphics',
        description: 'Dell Precision 5510 — mobile workstation. Intel Core i7 6th Gen, 16GB DDR4 RAM, 512GB SSD, NVIDIA Quadro M1000M dedicated graphics, 15.6" FHD InfinityEdge display, carbon-fibre palmrest, backlit keyboard.',
        condition: 'fairly_used', priceNaira: 595000, quantity: 2,
        tags: ['Precision', 'Workstation', 'Quadro', 'Core i7', 'UK Used'],
        files: ['Dell Precision 5510 sản xuất năm nào_ Liệu có nên mua không_.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Dell'),
        itemName: 'Dell Latitude 3420 — Core i5 11th Gen, 16GB RAM, 512GB SSD',
        description: 'Dell Latitude 3420 — modern 14" business laptop. Intel Core i5-1135G7 (11th Gen) with Intel Iris Xe graphics, 16GB DDR4 RAM, 512GB NVMe SSD, 14" FHD display, spill-resistant keyboard, MIL-STD-810H tested.',
        condition: 'fairly_used', priceNaira: 510000, quantity: 5,
        tags: ['Latitude', '3420', '11th Gen', 'Iris Xe', '16GB RAM'],
        files: ['🔥👉🏽💙𝐃𝐞𝐥𝐥💙𝐋𝐚𝐭𝐢𝐭𝐮𝐝𝐞💙𝟑𝟒𝟐𝟎💙𝐰𝐢𝐭𝐡💙𝐈𝐧𝐭𝐞𝐥®💙𝐂𝐨𝐫𝐞™💙𝐢𝟓-𝟏𝟏𝟑𝟓𝐆𝟕,💙𝟏𝟔𝐆𝐁💙𝐑𝐀𝐌💙𝐚.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Lenovo'),
        itemName: 'Lenovo ThinkPad X1 Carbon Gen 6 — Core i7 8th Gen, 16GB RAM, 512GB SSD',
        description: 'Lenovo ThinkPad X1 Carbon Gen 6 — premium business ultrabook. Intel Core i7-8650U (8th Gen vPro), 16GB LPDDR3 RAM, 512GB NVMe SSD, 14" 2K (2560×1440) IPS display, backlit keyboard, fingerprint reader, carbon-fibre roll cage, Thunderbolt 3. Weight 1.13 kg.',
        condition: 'fairly_used', priceNaira: 525000, quantity: 3,
        tags: ['ThinkPad', 'X1 Carbon', 'Gen 6', 'Core i7', '2K Display', 'UK Used'],
        files: ['Lenovo Thinkpad X1 Carbon Gen 6, core i7, 8th generation, 512ssd, 16gb ram, 2K screen display, backlit keyboard KSH_63,0000 CONTACT US_ 0714215210.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Lenovo'),
        itemName: 'Lenovo Yoga 720 2-in-1 — Core i7, 8GB RAM, 256GB SSD (Convertible Touchscreen)',
        description: 'Lenovo Yoga 720 — slim 13.3" 2-in-1 convertible. Intel Core i7 with Intel HD Graphics, 8GB DDR4 RAM, 256GB NVMe SSD, 13.3" FHD IPS touchscreen with 360° hinge, backlit keyboard, fingerprint reader, JBL stereo speakers, Thunderbolt 3.',
        condition: 'fairly_used', priceNaira: 345000, quantity: 3,
        tags: ['Yoga', '720', '2-in-1', 'Touchscreen', 'Core i7', 'UK Used'],
        files: ['Lenovo yoga x360.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Lenovo'),
        itemName: 'Lenovo ThinkPad L480 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'Lenovo ThinkPad L480 — durable 14" business laptop. Intel Core i5-8250U (8th Gen quad-core), 8GB DDR4 RAM, 256GB SSD, 14" FHD IPS display, spill-resistant ThinkPad keyboard, fingerprint reader, MIL-STD durability testing.',
        condition: 'fairly_used', priceNaira: 305000, quantity: 5,
        tags: ['ThinkPad', 'L480', 'Core i5', '14-inch', 'UK Used'],
        files: ['lenovo-l480.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Asus'),
        itemName: 'Asus VivoBook 14 — Core i5 8th Gen, 8GB RAM, 256GB SSD',
        description: 'Asus VivoBook 14 — slim everyday laptop. Intel Core i5-8250U (8th Gen quad-core), 8GB DDR4 RAM, 256GB SSD, 14" FHD NanoEdge display, ergonomic hinge, fingerprint reader, lightweight 1.45 kg.',
        condition: 'fairly_used', priceNaira: 295000, quantity: 4,
        tags: ['VivoBook', '14-inch', 'Core i5', 'NanoEdge', 'UK Used'],
        files: ['asus vivobook.jpg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Apple'),
        itemName: 'MacBook Pro 13" 2019 — Intel Core i5, 8GB RAM, 256GB SSD (UK Used)',
        description: 'MacBook Pro 13" 2019 (Touch Bar + Touch ID). Intel Core i5 (8th Gen), 8GB LPDDR3 RAM, 256GB SSD, 13.3" Retina display, Touch Bar, Touch ID, four Thunderbolt 3 ports, backlit Magic Keyboard. Cycle count ~260.',
        condition: 'fairly_used', priceNaira: 695000, quantity: 2,
        tags: ['MacBook Pro', '2019', '13-inch', 'Touch Bar', 'Retina', 'UK Used'],
        files: ['MACBOOK PRO 2019_INTEL CORE I5_13_3” RETINA DISPLAY_RAM_ 8GB_STORAGE_ 256GB SSD_TOUCH BAR _ TOUCH ID_CYCLE COUNT_ 260_CONDITION_ UK USED__GHC 6500.jpeg', 'Macbook Pro 2019.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Apple'),
        itemName: 'MacBook Pro 14" M1 Pro — 16GB Unified Memory, 512GB SSD',
        description: 'MacBook Pro 14" with Apple M1 Pro chip (8-core CPU, 14-core GPU), 16GB unified memory, 512GB SSD, 14.2" Liquid Retina XDR display (ProMotion 120Hz), MagSafe charging, Touch ID, three Thunderbolt 4 ports, HDMI, SD card slot. Open-box, cycle count ~230.',
        condition: 'fairly_used', priceNaira: 1950000, quantity: 2,
        tags: ['MacBook Pro', '14-inch', 'M1 Pro', 'Apple Silicon', 'Pro', 'UK Used'],
        files: ['MacBook pro 14 inch 16GB unified memory 512 GB ssd Apple M1 pro chip open Box cycle count 230 KSH_218,000_= CONTACT US_0714215201.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Apple'),
        itemName: 'MacBook Pro 13" 2020 — Intel Core i5, 8GB RAM, 256GB SSD (UK Used)',
        description: 'MacBook Pro 13" 2020 (Two Thunderbolt 3 ports model). Intel Core i5 1.4 GHz Quad-Core (10th Gen), 8GB LPDDR3 RAM, 256GB SSD, 13.3" Retina display with True Tone, Touch Bar, Touch ID, Magic Keyboard with scissor mechanism.',
        condition: 'fairly_used', priceNaira: 780000, quantity: 2,
        tags: ['MacBook Pro', '2020', '13-inch', 'Touch Bar', 'Quad-Core', 'UK Used'],
        files: ['_ (21).jpeg', '_ (22).jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Apple'),
        itemName: 'MacBook Air M1 2020 — Apple M1, 8GB RAM, 256GB SSD',
        description: 'MacBook Air with Apple M1 chip (8-core CPU, 7-core GPU), 8GB unified memory, 256GB SSD, 13.3" Retina display with True Tone, Touch ID, Magic Keyboard, fanless silent design, up to 18-hour battery.',
        condition: 'fairly_used', priceNaira: 985000, quantity: 3,
        tags: ['MacBook Air', 'M1', 'Apple Silicon', '2020', 'Retina', 'UK Used'],
        files: ['Macbook air m1 2020 (1).jpeg', 'macbook air m1 2020.jpeg'],
    },
    {
        folder: 'laptops', category: CAT.laptops, subCategory: sub(CAT.laptops, 'Apple'),
        itemName: 'MacBook Pro 15" Touch Bar — Intel Core i7, 16GB RAM, 256GB SSD',
        description: 'MacBook Pro 15" with Touch Bar. Intel Core i7 quad-core, 16GB DDR4 RAM, 256GB SSD, Radeon Pro dedicated graphics, 15.4" Retina display, Touch Bar with Touch ID, four Thunderbolt 3 ports, backlit keyboard.',
        condition: 'fairly_used', priceNaira: 750000, quantity: 2,
        tags: ['MacBook Pro', '15-inch', 'Touch Bar', 'Radeon Pro', 'UK Used'],
        files: ['Macbook pro.jpeg'],
    },
    {
        folder: 'gadget', category: CAT.phones, subCategory: sub(CAT.phones, 'Apple'),
        itemName: 'Apple iPhone 12 — 128GB (UK Used)',
        description: 'Apple iPhone 12 with A14 Bionic chip, 6.1" Super Retina XDR OLED display, dual 12MP cameras, Face ID, 5G, Ceramic Shield, MagSafe. Clean UK-used unit, battery health 85%+.',
        condition: 'fairly_used', priceNaira: 385000, quantity: 4,
        tags: ['iPhone', 'iPhone 12', 'A14', '5G', 'UK Used'],
        files: ['iphone-12.jpg', 'iphone-12(2).jpg'],
    },
    {
        folder: 'gadget', category: CAT.phones, subCategory: sub(CAT.phones, 'Apple'),
        itemName: 'Apple iPhone 12 Pro — 128GB (UK Used)',
        description: 'Apple iPhone 12 Pro with A14 Bionic, 6.1" Super Retina XDR OLED, triple 12MP Pro camera system with LiDAR, stainless steel frame, Face ID, 5G, MagSafe. Battery health 85%+.',
        condition: 'fairly_used', priceNaira: 520000, quantity: 3,
        tags: ['iPhone', 'iPhone 12 Pro', 'A14', 'LiDAR', 'UK Used'],
        files: ['iphone-12-pro.jpg'],
    },
    {
        folder: 'gadget', category: CAT.phones, subCategory: sub(CAT.phones, 'Apple'),
        itemName: 'Apple iPhone 14 Pro Max — 256GB (Brand New)',
        description: 'Apple iPhone 14 Pro Max — sealed brand new. A16 Bionic, 6.7" Super Retina XDR OLED with Dynamic Island and Always-On display, 48MP Pro camera system, stainless steel frame, Face ID, 5G. 1-year warranty.',
        condition: 'brand_new', priceNaira: 1250000, quantity: 3,
        tags: ['iPhone', 'iPhone 14 Pro Max', 'A16', 'Dynamic Island', 'Brand New'],
        files: ['iphone-14-pro-max-brandnew.jpg'],
    },
    {
        folder: 'gadget', category: CAT.phones, subCategory: sub(CAT.phones, 'Apple'),
        itemName: 'Apple iPhone 15 — 128GB (Brand New)',
        description: 'Apple iPhone 15 — sealed brand new. A16 Bionic, 6.1" Super Retina XDR OLED with Dynamic Island, 48MP main camera, USB-C, Ceramic Shield, Face ID, 5G. 1-year warranty.',
        condition: 'brand_new', priceNaira: 1150000, quantity: 3,
        tags: ['iPhone', 'iPhone 15', 'A16', 'USB-C', 'Brand New'],
        files: ['iphone-15.jpg'],
    },
    {
        folder: 'gadget', category: CAT.phones, subCategory: sub(CAT.phones, 'Samsung'),
        itemName: 'Samsung Galaxy S21 5G — 128GB (UK Used)',
        description: 'Samsung Galaxy S21 5G with Exynos 2100 / Snapdragon 888, 6.2" Dynamic AMOLED 2X 120Hz display, triple rear camera, IP68, wireless charging, 5G. Clean UK-used unit.',
        condition: 'fairly_used', priceNaira: 340000, quantity: 4,
        tags: ['Samsung', 'Galaxy S21', '5G', '120Hz', 'UK Used'],
        files: ['samsung-s21.jpg'],
    },
    {
        folder: 'gadget', category: CAT.phones, subCategory: sub(CAT.phones, 'Google'),
        itemName: 'Google Pixel — Clean Android, Great Camera (UK Used)',
        description: 'Google Pixel flagship with stock Android, industry-leading computational photography, OLED display, Titan security, and guaranteed Android updates. Clean UK-used unit.',
        condition: 'fairly_used', priceNaira: 310000, quantity: 3,
        tags: ['Google', 'Pixel', 'Stock Android', 'Camera', 'UK Used'],
        files: ['google-pixel-1.jpg'],
    },
    {
        folder: 'gadget', category: CAT.speakers, subCategory: sub(CAT.speakers, 'JBL'),
        itemName: 'JBL Portable Bluetooth Speaker — Bold Sound, Waterproof',
        description: 'JBL portable Bluetooth speaker with JBL Pro Sound, deep bass, IPX7 waterproof rating, wireless Bluetooth streaming, and long-lasting battery. Perfect for outdoors, parties and travel.',
        condition: 'brand_new', priceNaira: 85000, quantity: 8,
        tags: ['JBL', 'Bluetooth', 'Waterproof', 'Portable', 'Brand New'],
        files: ['speaker-jbl.jpg'],
    },
    {
        folder: 'gadget', category: CAT.speakers, subCategory: sub(CAT.speakers, 'Zealot'),
        itemName: 'Zealot S32 Bluetooth Speaker — Compact, Punchy Bass',
        description: 'Zealot S32 compact Bluetooth speaker with rich bass, wireless Bluetooth 5.0, TF card + AUX support, and a rechargeable battery. Great for desk, bedroom, and travel.',
        condition: 'brand_new', priceNaira: 45000, quantity: 10,
        tags: ['Zealot', 'S32', 'Bluetooth', 'Compact', 'Brand New'],
        files: ['zealot-speaker.jpg', 'zealot-speaker-1.jpg'],
    },
    {
        folder: 'gadget', category: CAT.speakers, subCategory: sub(CAT.speakers, 'Zealot'),
        itemName: 'Zealot S49 Bluetooth Speaker — Stereo, RGB Lights',
        description: 'Zealot S49 wireless speaker with powerful stereo sound, pulsing RGB light show, Bluetooth 5.0, TWS pairing, FM radio, TF/AUX inputs, and a big rechargeable battery.',
        condition: 'brand_new', priceNaira: 62000, quantity: 8,
        tags: ['Zealot', 'S49', 'Stereo', 'RGB', 'Brand New'],
        files: ['zealot-speaker-2.jpg', 'zealot-speaker-3.jpg'],
    },
    {
        folder: 'gadget', category: CAT.speakers, subCategory: sub(CAT.speakers, 'Zealot'),
        itemName: 'Zealot Party Speaker — Loud, Deep Bass, TWS',
        description: 'Zealot party speaker with high-output drivers, deep thumping bass, TWS dual-pairing, Bluetooth 5.0, and dynamic lighting. Fills a room for hangouts and small events.',
        condition: 'brand_new', priceNaira: 78000, quantity: 6,
        tags: ['Zealot', 'Party', 'Loud', 'TWS', 'Brand New'],
        files: ['zealot-speaker-4.jpg', 'zealot-speaker-5.jpg'],
    },
    {
        folder: 'gadget', category: CAT.speakers, subCategory: sub(CAT.speakers, 'Zealot'),
        itemName: 'Zealot Portable Wireless Speaker — All-Day Battery',
        description: 'Zealot portable wireless speaker with clear highs, solid bass, Bluetooth 5.0, AUX/TF playback, and all-day battery life in a rugged, grab-and-go body.',
        condition: 'brand_new', priceNaira: 38000, quantity: 12,
        tags: ['Zealot', 'Portable', 'Wireless', 'Battery', 'Brand New'],
        files: ['zealot-speaker-8.jpg', 'zealot-speaker-9.jpg'],
    },
    {
        folder: 'gadget', category: CAT.powerBanks, subCategory: sub(CAT.powerBanks, 'Oraimo'),
        itemName: 'Oraimo 20000mAh Power Bank — Fast Charge, Dual USB',
        description: 'Oraimo 20000mAh power bank with fast charging, dual USB output + USB-C, LED capacity indicator, and multi-protection safety. Charges phones multiple times over.',
        condition: 'brand_new', priceNaira: 22000, quantity: 15,
        tags: ['Oraimo', '20000mAh', 'Fast Charge', 'Power Bank', 'Brand New'],
        files: ['oraimo-powerbank.jpg'],
    },
    {
        folder: 'gadget', category: CAT.powerBanks, subCategory: sub(CAT.powerBanks, 'Generic'),
        itemName: '10000mAh Slim Power Bank — Pocket-Size',
        description: 'Slim 10000mAh power bank with dual output, USB-C input, and LED indicator. Lightweight and pocket-friendly for everyday top-ups.',
        condition: 'brand_new', priceNaira: 12000, quantity: 20,
        tags: ['10000mAh', 'Slim', 'Portable', 'Power Bank', 'Brand New'],
        files: ['power-bank-1.jpg'],
    },
    {
        folder: 'gadget', category: CAT.powerBanks, subCategory: sub(CAT.powerBanks, 'Generic'),
        itemName: '20000mAh Power Bank — High Capacity, Dual USB',
        description: 'High-capacity 20000mAh power bank with dual USB outputs, fast charging support, and a digital battery display. Keeps phones and tablets going all day.',
        condition: 'brand_new', priceNaira: 18000, quantity: 18,
        tags: ['20000mAh', 'High Capacity', 'Dual USB', 'Power Bank', 'Brand New'],
        files: ['powerbank-2.jpg'],
    },
    {
        folder: 'gadget', category: CAT.powerBanks, subCategory: sub(CAT.powerBanks, 'Generic'),
        itemName: 'Fast-Charge Power Bank — PD & QC Support',
        description: 'Fast-charge power bank with Power Delivery (PD) and Quick Charge (QC) support, USB-C in/out, and a compact design that refuels modern phones rapidly.',
        condition: 'brand_new', priceNaira: 15000, quantity: 16,
        tags: ['Fast Charge', 'PD', 'QC', 'Power Bank', 'Brand New'],
        files: ['power-bank-3.jpg'],
    },
    {
        folder: 'gadget', category: CAT.powerBanks, subCategory: sub(CAT.powerBanks, 'Generic'),
        itemName: 'Slim Travel Power Bank — Lightweight',
        description: 'Ultra-slim travel power bank with a premium finish, dual output, and reliable capacity for on-the-go charging.',
        condition: 'brand_new', priceNaira: 13500, quantity: 14,
        tags: ['Slim', 'Travel', 'Lightweight', 'Power Bank', 'Brand New'],
        files: ['power-bank-5.jpg'],
    },
    {
        folder: 'gadget', category: CAT.powerBanks, subCategory: sub(CAT.powerBanks, 'Generic'),
        itemName: 'Solar Power Bank — Outdoor, Rugged',
        description: 'Rugged solar power bank with a built-in panel for emergency top-ups, dual USB outputs, LED torch, and a water-resistant body. Ideal for outdoors and travel.',
        condition: 'brand_new', priceNaira: 16500, quantity: 12,
        tags: ['Solar', 'Outdoor', 'Rugged', 'Power Bank', 'Brand New'],
        files: ['power-bank-6.jpg'],
    },
    {
        folder: 'gadget', category: CAT.earpods, subCategory: sub(CAT.earpods, 'Generic'),
        itemName: 'Wireless Earbuds (TWS) — Bluetooth 5.0, Charging Case',
        description: 'True wireless stereo (TWS) earbuds with Bluetooth 5.0, touch controls, clear calls, and a compact charging case for all-day listening.',
        condition: 'brand_new', priceNaira: 14000, quantity: 20,
        tags: ['TWS', 'Wireless', 'Bluetooth', 'Earbuds', 'Brand New'],
        files: ['earpod-1.jpg'],
    },
    {
        folder: 'gadget', category: CAT.earpods, subCategory: sub(CAT.earpods, 'Generic'),
        itemName: 'Pro Wireless Earbuds — ENC Calls, Long Battery',
        description: 'Pro wireless earbuds with environmental noise cancellation (ENC) for calls, punchy bass, touch controls, and long battery life with the charging case.',
        condition: 'brand_new', priceNaira: 17000, quantity: 18,
        tags: ['Pro', 'ENC', 'Wireless', 'Earbuds', 'Brand New'],
        files: ['earpod-3.jpg'],
    },
    {
        folder: 'gadget', category: CAT.earpods, subCategory: sub(CAT.earpods, 'Sony'),
        itemName: 'Sony Wireless Earbuds — Rich Sound, Noise Isolation',
        description: 'Sony wireless earbuds with signature Sony sound, strong noise isolation, clear hands-free calls, touch controls, and a compact charging case.',
        condition: 'brand_new', priceNaira: 65000, quantity: 8,
        tags: ['Sony', 'Wireless', 'Noise Isolation', 'Earbuds', 'Brand New'],
        files: ['sony-earpod.jpg'],
    },
    {
        folder: 'gadget', category: CAT.headsets, subCategory: sub(CAT.headsets, 'Generic'),
        itemName: 'Wireless Headset — Over-Ear, Bluetooth, Mic',
        description: 'Comfortable over-ear wireless headset with Bluetooth, built-in microphone, soft ear cushions, and long battery life. Great for calls, music and study.',
        condition: 'brand_new', priceNaira: 24000, quantity: 12,
        tags: ['Wireless', 'Over-Ear', 'Bluetooth', 'Headset', 'Brand New'],
        files: ['headset-1.jpg'],
    },
    {
        folder: 'gadget', category: CAT.headsets, subCategory: sub(CAT.headsets, 'Generic'),
        itemName: 'Over-Ear Headphones — Deep Bass, Foldable',
        description: 'Foldable over-ear headphones with deep bass, cushioned headband, wired + wireless modes, and an inline mic. Comfortable for long sessions.',
        condition: 'brand_new', priceNaira: 28000, quantity: 10,
        tags: ['Headphones', 'Over-Ear', 'Bass', 'Foldable', 'Brand New'],
        files: ['headset-4.jpg'],
    },
    {
        folder: 'gadget', category: CAT.networking, subCategory: sub(CAT.networking, 'Starlink'),
        itemName: 'Starlink Kit — High-Speed Satellite Internet',
        description: 'Starlink standard kit for high-speed, low-latency satellite internet anywhere. Includes dish, Wi-Fi router, cables and mount. Perfect for homes and businesses beyond fibre coverage.',
        condition: 'brand_new', priceNaira: 590000, quantity: 5,
        tags: ['Starlink', 'Satellite', 'Internet', 'Router', 'Brand New'],
        files: ['starlink.jpg'],
    },
    {
        folder: 'gadget', category: CAT.home, subCategory: sub(CAT.home, 'Itel'),
        itemName: 'Itel Rechargeable Fan — Long Runtime, Quiet',
        description: 'Itel rechargeable fan with a strong quiet motor, long battery runtime, adjustable speeds, and built-in LED light. Keeps you cool through power outages.',
        condition: 'brand_new', priceNaira: 32000, quantity: 10,
        tags: ['Itel', 'Rechargeable Fan', 'Battery', 'LED', 'Brand New'],
        files: ['itel-fan.jpg'],
    },
    {
        folder: 'gadget', category: CAT.home, subCategory: sub(CAT.home, 'Generic'),
        itemName: 'Rechargeable Standing Fan — Multi-Speed, USB Charge',
        description: 'Rechargeable standing fan with multiple speed settings, wide oscillation, USB charging, and a long-lasting battery for cool air anytime.',
        condition: 'brand_new', priceNaira: 28000, quantity: 12,
        tags: ['Rechargeable Fan', 'Standing', 'Multi-Speed', 'Brand New'],
        files: ['rechargeable-fan-1.jpg'],
    },
    {
        folder: 'gadget', category: CAT.home, subCategory: sub(CAT.home, 'Itel'),
        itemName: 'Itel Inverter — Reliable Home Backup Power',
        description: 'Itel inverter for reliable home backup power — clean, stable output for lights, fans, TVs and small appliances during outages. Efficient and easy to set up.',
        condition: 'brand_new', priceNaira: 145000, quantity: 6,
        tags: ['Itel', 'Inverter', 'Backup Power', 'Home', 'Brand New'],
        files: ['itel-inverter.jpg'],
    },
    {
        folder: 'gadget', category: CAT.home, subCategory: sub(CAT.home, 'Generic'),
        itemName: 'Rechargeable LED Light — Emergency, Bright',
        description: 'Bright rechargeable LED light with multiple brightness modes, long runtime, and a hanging hook. Perfect emergency and outdoor lighting for power cuts.',
        condition: 'brand_new', priceNaira: 9500, quantity: 25,
        tags: ['LED', 'Rechargeable', 'Emergency', 'Light', 'Brand New'],
        files: ['led-light.jpg'],
    },
    {
        folder: 'gadget', category: CAT.camera, subCategory: sub(CAT.camera, 'Generic'),
        itemName: 'Professional Tripod Stand — Adjustable, Stable',
        description: 'Professional tripod stand with adjustable height, 360° pan head, quick-release plate, and a sturdy build for cameras, phones and ring lights.',
        condition: 'brand_new', priceNaira: 18000, quantity: 12,
        tags: ['Tripod', 'Professional', 'Adjustable', 'Camera', 'Brand New'],
        files: ['tripod-1.jpg'],
    },
    {
        folder: 'gadget', category: CAT.camera, subCategory: sub(CAT.camera, 'Generic'),
        itemName: 'Camera Tripod — Lightweight, Travel-Ready',
        description: 'Lightweight travel camera tripod with foldable legs, adjustable head, and a compact carry size. Great for vlogging, photography and live streams.',
        condition: 'brand_new', priceNaira: 16000, quantity: 10,
        tags: ['Tripod', 'Lightweight', 'Travel', 'Camera', 'Brand New'],
        files: ['tripod-2.jpg'],
    },
    {
        folder: 'gadget', category: CAT.camera, subCategory: sub(CAT.camera, 'Generic'),
        itemName: 'Phone Tripod Stand — With Phone Mount',
        description: 'Versatile phone tripod stand with a secure phone mount, adjustable height and angles. Ideal for content creation, video calls and photos.',
        condition: 'brand_new', priceNaira: 12000, quantity: 15,
        tags: ['Tripod', 'Phone Mount', 'Content', 'Stand', 'Brand New'],
        files: ['tripod-stand-4.jpg'],
    },
    {
        folder: 'gadget', category: CAT.camera, subCategory: sub(CAT.camera, 'Generic'),
        itemName: 'Selfie Stick — Bluetooth Remote, Extendable',
        description: 'Extendable selfie stick with a Bluetooth shutter remote, secure phone clamp, and a foldable pocket-size design for photos and vlogging on the go.',
        condition: 'brand_new', priceNaira: 8500, quantity: 20,
        tags: ['Selfie Stick', 'Bluetooth', 'Extendable', 'Phone', 'Brand New'],
        files: ['selfee-stick.jpg'],
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
    for (const [name, dir] of Object.entries(FOLDERS)) {
        if (!fs.existsSync(dir)) {
            console.error(`❌ Images dir not found (${name}): ${dir}`);
            process.exit(1);
        }
        console.log(`📁 ${name}: ${dir}`);
    }
    console.log('');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');
    const db = mongoose.connection.db;
    const now = new Date();
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
            updatedAt: now,
        });
        adminUser = await usersCol.findOne({ _id: res.insertedId });
        console.log(`✅ Created super-admin: ${ADMIN_EMAIL} (pw: ${ADMIN_PASSWORD})`);
    }
    else {
        console.log(`ℹ️  Super-admin already exists: ${ADMIN_EMAIL}`);
    }
    let creator = await db.collection('creators').findOne({ slug: STORE_SLUG });
    if (!creator) {
        const creatorId = oid();
        await db.collection('creators').insertOne({
            _id: creatorId,
            userId: adminUser._id,
            username: 'Odogwu_Laptops',
            slug: STORE_SLUG,
            bio: 'Official Odogwu Laptops admin account.',
            profileImageUrl: STORE_LOGO,
            phoneNumber: STORE_PHONE,
            whatsappNumber: STORE_WHATSAPP,
            industries: ['Laptops & Electronics'],
            tags: ['laptops', 'phones', 'gadgets', 'electronics'],
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
            updatedAt: now,
        });
        creator = await db.collection('creators').findOne({ _id: creatorId });
        console.log('✅ Created creator profile (Odogwu_Laptops)');
    }
    else {
        console.log('ℹ️  Creator profile already exists');
    }
    let store = await db.collection('stores').findOne({ slug: STORE_SLUG });
    if (!store) {
        const storeId = oid();
        await db.collection('stores').insertOne({
            _id: storeId,
            creatorId: creator._id,
            userId: adminUser._id,
            name: 'Odogwu Laptops',
            slug: STORE_SLUG,
            logo: STORE_LOGO,
            description: "Nigeria's trusted gadget store — laptops, phones, speakers, power banks, and accessories from the brands you love.",
            tagline: 'Quality gadgets. Real warranty. Fast delivery.',
            phoneNumber: STORE_PHONE,
            whatsappNumber: STORE_WHATSAPP,
            email: ADMIN_EMAIL,
            location: { country: 'Nigeria' },
            categories: TAXONOMY.map((c) => c.name),
            tags: ['laptops', 'phones', 'speakers', 'gadgets'],
            status: 'active',
            isVisible: true,
            isVerified: true,
            isSuperVerified: true,
            totalListings: 0,
            totalSales: 0,
            rating: 5,
            totalReviews: 0,
            followers: 0,
            createdAt: ago(30),
            updatedAt: now,
        });
        store = await db.collection('stores').findOne({ _id: storeId });
        console.log('✅ Created store: Odogwu Laptops');
    }
    else {
        console.log('ℹ️  Store already exists');
    }
    console.log(`\n🏬 Store: ${store.name} | 👤 Creator: ${creator._id} | 👨‍💼 User: ${adminUser._id}\n`);
    for (const col of [
        'listings',
        'categories',
        'savedproducts',
        'carts',
        'orders',
        'reviews',
        'follows',
    ]) {
        try {
            const r = await db.collection(col).deleteMany({});
            console.log(`🗑️  Wiped ${col}: ${r.deletedCount} docs`);
        }
        catch {
        }
    }
    console.log('');
    const parentIdBySlug = {};
    const categoryDocs = [];
    TAXONOMY.forEach((cat, i) => {
        const catSlug = slugify(cat.name);
        const parentId = oid();
        parentIdBySlug[catSlug] = parentId;
        categoryDocs.push({
            _id: parentId,
            name: cat.name,
            slug: catSlug,
            description: cat.description,
            icon: cat.icon,
            image: null,
            parentId: null,
            sortOrder: i + 1,
            isActive: true,
            listingCount: 0,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
        });
        cat.brands.forEach((brand, j) => {
            categoryDocs.push({
                _id: oid(),
                name: brand,
                slug: sub(catSlug, brand),
                description: `${brand} ${cat.name.toLowerCase()}`,
                icon: null,
                image: null,
                parentId,
                sortOrder: j + 1,
                isActive: true,
                listingCount: 0,
                isDeleted: false,
                createdAt: now,
                updatedAt: now,
            });
        });
    });
    await db.collection('categories').insertMany(categoryDocs);
    const parentCount = TAXONOMY.length;
    console.log(`✅ Created ${parentCount} categories + ${categoryDocs.length - parentCount} sub-categories\n`);
    const totalImages = CATALOG.reduce((s, p) => s + p.files.length, 0);
    console.log(`📦 Seeding ${CATALOG.length} products with ${totalImages} images...\n`);
    const listingDocs = [];
    for (const product of CATALOG) {
        process.stdout.write(`  • ${product.itemName.substring(0, 48).padEnd(48)} `);
        const media = [];
        for (const filename of product.files) {
            try {
                const url = await uploadImage(product.folder, filename);
                media.push({ url, type: 'image' });
            }
            catch (err) {
                console.error(`\n    ❌ Failed to upload ${filename}: ${err.message}`);
            }
        }
        if (media.length === 0) {
            console.log('SKIPPED (no images)');
            continue;
        }
        listingDocs.push({
            _id: oid(),
            storeId: store._id,
            creatorId: creator._id,
            userId: adminUser._id,
            itemName: product.itemName,
            description: product.description,
            condition: product.condition,
            category: product.category,
            subCategory: product.subCategory,
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
            updatedAt: now,
        });
        console.log(`✓ (${media.length} img)`);
    }
    await db.collection('listings').insertMany(listingDocs);
    console.log(`\n✅ Inserted ${listingDocs.length} listings`);
    const bySub = {};
    const byCat = {};
    listingDocs.forEach((l) => {
        bySub[l.subCategory] = (bySub[l.subCategory] || 0) + 1;
        byCat[l.category] = (byCat[l.category] || 0) + 1;
    });
    for (const [slug, count] of Object.entries({ ...bySub, ...byCat })) {
        await db
            .collection('categories')
            .updateOne({ slug }, { $set: { listingCount: count, updatedAt: now } });
    }
    await db
        .collection('stores')
        .updateOne({ _id: store._id }, { $set: { totalListings: listingDocs.length, updatedAt: now } });
    await db
        .collection('creators')
        .updateOne({ _id: creator._id }, { $set: { totalListings: listingDocs.length, updatedAt: now } });
    console.log('\n══════════════════════════════════════════════');
    console.log('  ODOGWU GADGET STORE — CATALOG SEED COMPLETE');
    console.log('══════════════════════════════════════════════');
    console.log(`  Categories:      ${parentCount}`);
    console.log(`  Sub-categories:  ${categoryDocs.length - parentCount}`);
    console.log(`  Products:        ${listingDocs.length}`);
    console.log('  By category:');
    for (const [cat, n] of Object.entries(byCat)) {
        console.log(`    ${cat.padEnd(20)} ${n}`);
    }
    console.log('══════════════════════════════════════════════\n');
    await mongoose.disconnect();
}
seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-catalog.js.map