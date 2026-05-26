/**
 * Seed script — uploads kraft-pics images to Cloudinary and creates listings.
 *
 * Usage:
 *   cd comaket-service
 *   node scripts/seed-kraft-products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// ────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const KRAFT_PICS_DIR = path.resolve(
  __dirname,
  '../../Comaket/public/assets/imgs/kraft-pics',
);

// ────────────────────────────────────────────────────────────────────
// Categories (must match DB exactly)
// ────────────────────────────────────────────────────────────────────

const CATEGORIES = {
  fashion: 'Fashion & Textiles',
  footwear: 'Leather & Footwear',
  jewelry: 'Jewelry & Accessories',
  bags: 'Bags & Luggage',
  beauty: 'Beauty & Skincare',
  art: 'Art & Sculpture',
};

// ────────────────────────────────────────────────────────────────────
// Stores (will be loaded from DB)
// ────────────────────────────────────────────────────────────────────

let STORES = [];

// Pick a random store appropriate for a category
function pickStore(category) {
  // Admin/Kraft_official skipped for organic look
  const eligible = STORES.filter((s) => s.name !== 'Kraft_official');

  const preferences = {
    [CATEGORIES.fashion]: ['Ankara by Adaeze', 'Adire Collection', 'Weave Queens'],
    [CATEGORIES.footwear]: ['Emeka O. Shoes', 'Emeka Leather Goods', 'Odogwu Shoes'],
    [CATEGORIES.jewelry]: ['Koral Kreations', 'Glow by Nature'],
    [CATEGORIES.bags]: ['Emeka Leather Goods', 'Koral Kreations', 'Weave Queens'],
    [CATEGORIES.beauty]: ['Glow by Nature', 'Glow Hair Collection'],
    [CATEGORIES.art]: ['Ngozi Art Gallery', 'Bakare Woodworks', 'Clay by Tunde'],
  };

  const preferred = preferences[category] || [];
  const matches = eligible.filter((s) => preferred.includes(s.name));
  const pool = matches.length > 0 ? matches : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ────────────────────────────────────────────────────────────────────
// Product catalog (image → product info)
// Prices in kobo (1 NGN = 100 kobo)
// ────────────────────────────────────────────────────────────────────

const CATALOG = [
  // ───── Abaya (5)
  { img: 'abaya-1.jpg', name: 'Embroidered Black Abaya', category: CATEGORIES.fashion, tags: ['Abaya', 'Modest Wear', 'Embroidery'], priceMin: 22000, priceMax: 35000, desc: 'Elegant black abaya with delicate gold embroidery. Perfect for special occasions and modest fashion.' },
  { img: 'abaya-2.jpg', name: 'Pearl Beaded Abaya', category: CATEGORIES.fashion, tags: ['Abaya', 'Modest Wear', 'Beaded'], priceMin: 28000, priceMax: 40000, desc: 'Premium abaya with hand-sewn pearl beadwork. Long-lasting fabric, custom sizing available.' },
  { img: 'abaya-3.jpg', name: 'Open Front Abaya — Cream', category: CATEGORIES.fashion, tags: ['Abaya', 'Modest Wear', 'Cream'], priceMin: 18000, priceMax: 28000, desc: 'Light cream open front abaya with flowing sleeves. Pairs well with both casual and formal wear.' },
  { img: 'abaya-4.jpg', name: 'Royal Blue Embroidered Abaya', category: CATEGORIES.fashion, tags: ['Abaya', 'Modest Wear', 'Royal Blue'], priceMin: 25000, priceMax: 38000, desc: 'Royal blue abaya with hand-embroidered floral motifs. Premium chiffon fabric, beautifully tailored.' },
  { img: 'abaya-5.jpg', name: 'Classic Black Abaya', category: CATEGORIES.fashion, tags: ['Abaya', 'Modest Wear', 'Classic'], priceMin: 15000, priceMax: 25000, desc: 'Simple yet elegant classic abaya. Comfortable fabric, ideal for everyday wear.' },

  // ───── Asoke (8)
  { img: 'asoke-1.jpg', name: 'Royal Asoke Wrapper Set', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Yoruba', 'Traditional', 'Wedding'], priceMin: 85000, priceMax: 150000, desc: 'Authentic handwoven Aso Oke wrapper set, perfect for traditional weddings and special ceremonies.' },
  { img: 'asoke-2.jpg', name: 'Premium Aso Oke — Burgundy & Gold', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Yoruba', 'Bridal', 'Burgundy'], priceMin: 95000, priceMax: 165000, desc: 'Burgundy and gold premium Aso Oke. Hand-woven by master craftsmen in Iseyin.' },
  { img: 'asoke-3.jpg', name: 'Bridal Aso Oke Ensemble', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Bridal', 'Yoruba', 'Wedding'], priceMin: 120000, priceMax: 200000, desc: 'Complete bridal Aso Oke ensemble — gele, ipele, and iro. Made for the discerning Yoruba bride.' },
  { img: 'asoke-4.jpg', name: 'Traditional Aso Oke Cloth', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Yoruba', 'Traditional'], priceMin: 65000, priceMax: 110000, desc: 'Authentic Aso Oke cloth with traditional patterns. Hand-woven, premium quality.' },
  { img: 'asoke-6.jpg', name: 'Royal Wedding Aso Oke', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Wedding', 'Royal', 'Yoruba'], priceMin: 110000, priceMax: 180000, desc: 'Magnificent royal wedding Aso Oke. Rich texture and intricate weaving patterns.' },
  { img: 'asoke-7.jpg', name: 'Aso Oke — Olivia Pattern', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Yoruba', 'Pattern'], priceMin: 75000, priceMax: 130000, desc: 'Aso Oke with the popular Olivia pattern. Suitable for weddings and traditional events.' },
  { img: 'asoke-8.jpg', name: 'Heritage Aso Oke Set', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Heritage', 'Yoruba'], priceMin: 90000, priceMax: 145000, desc: 'Heritage collection Aso Oke set. Includes wrapper and matching headtie.' },
  { img: 'asoke-9].jpg', name: 'Engagement Aso Oke', category: CATEGORIES.fashion, tags: ['Aso Oke', 'Engagement', 'Yoruba'], priceMin: 80000, priceMax: 135000, desc: 'Beautifully crafted Aso Oke for engagement ceremonies and traditional events.' },

  // ───── Kaftan (8)
  { img: 'kaftan-1.jpg', name: 'Embellished White Kaftan', category: CATEGORIES.fashion, tags: ['Kaftan', 'Embellished', 'White'], priceMin: 32000, priceMax: 50000, desc: 'White kaftan with stone embellishments. Fits beautifully on any body shape.' },
  { img: 'kaftan-2.jpg', name: 'Premium Beaded Kaftan', category: CATEGORIES.fashion, tags: ['Kaftan', 'Beaded', 'Premium'], priceMin: 45000, priceMax: 70000, desc: 'Premium kaftan with hand-sewn beads and crystals. Stunning for parties and weddings.' },
  { img: 'kaftan-4.jpg', name: 'Cream Lace Kaftan', category: CATEGORIES.fashion, tags: ['Kaftan', 'Lace', 'Cream'], priceMin: 28000, priceMax: 45000, desc: 'Cream-toned lace kaftan with delicate detailing. Lightweight and breathable.' },
  { img: 'kaftan-5.jpg', name: 'Sage Green Kaftan Dress', category: CATEGORIES.fashion, tags: ['Kaftan', 'Sage Green', 'Dress'], priceMin: 25000, priceMax: 38000, desc: 'Sage green flowing kaftan dress. Elegant and comfortable for any occasion.' },
  { img: 'kaftan-6.jpg', name: 'Royal Blue Embroidered Kaftan', category: CATEGORIES.fashion, tags: ['Kaftan', 'Royal Blue', 'Embroidered'], priceMin: 35000, priceMax: 52000, desc: 'Royal blue kaftan with intricate gold embroidery on the neckline and sleeves.' },
  { img: 'kaftan-7.jpg', name: 'Pearl Bead Kaftan', category: CATEGORIES.fashion, tags: ['Kaftan', 'Pearl', 'Bead'], priceMin: 40000, priceMax: 65000, desc: 'Stunning pearl-bead embellished kaftan. A statement piece for special events.' },
  { img: 'kaftan-8.jpg', name: 'Pastel Pink Kaftan', category: CATEGORIES.fashion, tags: ['Kaftan', 'Pink', 'Pastel'], priceMin: 26000, priceMax: 40000, desc: 'Soft pastel pink kaftan with subtle floral pattern. Light, airy, and feminine.' },
  { img: 'kaftan-9.jpg', name: 'Maxi Embellished Kaftan', category: CATEGORIES.fashion, tags: ['Kaftan', 'Maxi', 'Embellished'], priceMin: 38000, priceMax: 58000, desc: 'Floor-length maxi kaftan with elegant embellishments. Perfect for evening events.' },

  // ───── Men Jalabiya (5)
  { img: 'men-jalabiya-1.jpg', name: 'Royal Men\'s Jalabiya — Navy', category: CATEGORIES.fashion, tags: ['Jalabiya', 'Men', 'Navy'], priceMin: 35000, priceMax: 55000, desc: 'Navy blue jalabiya for men. Premium fabric with embroidered chest detail.' },
  { img: 'men-jalabiya-2.jpg', name: 'Embroidered White Jalabiya', category: CATEGORIES.fashion, tags: ['Jalabiya', 'Men', 'White', 'Embroidered'], priceMin: 30000, priceMax: 48000, desc: 'Crisp white jalabiya with intricate embroidery. Classic men\'s traditional wear.' },
  { img: 'men-jalabiya-3.jpg', name: 'Premium Black Jalabiya', category: CATEGORIES.fashion, tags: ['Jalabiya', 'Men', 'Black'], priceMin: 38000, priceMax: 58000, desc: 'Premium black jalabiya with gold thread embroidery. Tailored to perfection.' },
  { img: 'men-jalabiya-4.jpg', name: 'Cream Jalabiya for Men', category: CATEGORIES.fashion, tags: ['Jalabiya', 'Men', 'Cream'], priceMin: 28000, priceMax: 45000, desc: 'Smooth cream jalabiya for men. Lightweight and breathable for hot weather.' },
  { img: 'men-jalabiya-5.jpg', name: 'Royal Blue Men\'s Jalabiya', category: CATEGORIES.fashion, tags: ['Jalabiya', 'Men', 'Royal Blue'], priceMin: 32000, priceMax: 50000, desc: 'Royal blue jalabiya with elegant embroidery. Perfect for Eid and traditional ceremonies.' },
  { img: 'men-native.jpg', name: 'Men\'s Native Senator Set', category: CATEGORIES.fashion, tags: ['Native', 'Men', 'Senator'], priceMin: 45000, priceMax: 75000, desc: 'Premium Senator-style native attire for men. Custom-tailored, includes top and trousers.' },

  // ───── Women Dresses/Gowns (3)
  { img: 'women-dress-1.jpg', name: 'Statement Ankara Dress', category: CATEGORIES.fashion, tags: ['Ankara', 'Dress', 'Women'], priceMin: 22000, priceMax: 35000, desc: 'Statement Ankara dress with bold prints. Custom fitted, modern silhouette.' },
  { img: 'women-gown-2.jpg', name: 'Elegant Evening Gown', category: CATEGORIES.fashion, tags: ['Gown', 'Evening', 'Elegant'], priceMin: 55000, priceMax: 85000, desc: 'Elegant evening gown with flowing train. Custom-tailored to your measurements.' },
  { img: 'women-gown.jpg', name: 'Designer Wedding Gown', category: CATEGORIES.fashion, tags: ['Gown', 'Wedding', 'Designer'], priceMin: 85000, priceMax: 150000, desc: 'Stunning designer wedding gown with detailed beadwork and lace. The dream gown for the modern bride.' },

  // ───── Knitted (3)
  { img: 'knitted-dress-1.jpg', name: 'Crochet Mini Dress', category: CATEGORIES.fashion, tags: ['Crochet', 'Dress', 'Knitted'], priceMin: 18000, priceMax: 28000, desc: 'Hand-crocheted mini dress. Unique handmade piece, perfect for summer.' },
  { img: 'knitted-hair-bow.jpg', name: 'Knitted Hair Bow', category: CATEGORIES.fashion, tags: ['Knitted', 'Hair Accessory', 'Bow'], priceMin: 2500, priceMax: 4500, desc: 'Cute knitted hair bow accessory. Adds charm to any hairstyle.' },
  { img: 'knitted-cap-1.jpg', name: 'Knitted Beanie Cap', category: CATEGORIES.fashion, tags: ['Knitted', 'Cap', 'Beanie'], priceMin: 4500, priceMax: 8500, desc: 'Cozy knitted beanie cap. Perfect for chilly evenings.' },

  // ───── Hausa Caps (6)
  { img: 'hausa-cap-1.jpg', name: 'Hausa Embroidered Cap', category: CATEGORIES.fashion, tags: ['Hausa', 'Cap', 'Embroidered'], priceMin: 8000, priceMax: 15000, desc: 'Traditional Hausa cap with intricate embroidery. Hand-stitched in Kano.' },
  { img: 'hausa-cap-2.jpg', name: 'Royal Hausa Cap', category: CATEGORIES.fashion, tags: ['Hausa', 'Cap', 'Royal'], priceMin: 10000, priceMax: 18000, desc: 'Premium royal Hausa cap with gold thread detailing.' },
  { img: 'hausa-cap-3.jpg', name: 'Classic Hausa Fila', category: CATEGORIES.fashion, tags: ['Hausa', 'Cap', 'Fila'], priceMin: 7000, priceMax: 12000, desc: 'Classic Hausa fila cap. Simple yet stylish for everyday wear.' },
  { img: 'hausa-cap-4.jpg', name: 'Premium Embroidered Hausa Cap', category: CATEGORIES.fashion, tags: ['Hausa', 'Cap', 'Premium'], priceMin: 12000, priceMax: 22000, desc: 'Premium embroidered Hausa cap. A perfect complement to traditional attire.' },
  { img: 'hausa-cap-5.jpg', name: 'Heritage Hausa Cap', category: CATEGORIES.fashion, tags: ['Hausa', 'Cap', 'Heritage'], priceMin: 9000, priceMax: 16000, desc: 'Heritage Hausa cap, hand-embroidered with cultural patterns.' },
  { img: 'hausa-cap-6.jpg', name: 'Modern Hausa Cap', category: CATEGORIES.fashion, tags: ['Hausa', 'Cap', 'Modern'], priceMin: 8500, priceMax: 14000, desc: 'Modern take on the traditional Hausa cap. Stylish and contemporary.' },

  // ───── Yoruba Caps (5)
  { img: 'yoruba cap-1.jpg', name: 'Yoruba Fila Etu', category: CATEGORIES.fashion, tags: ['Yoruba', 'Cap', 'Fila'], priceMin: 8000, priceMax: 14000, desc: 'Traditional Yoruba fila etu cap. Made from premium aso oke fabric.' },
  { img: 'yoruba-cap-2.jpg', name: 'Royal Yoruba Cap', category: CATEGORIES.fashion, tags: ['Yoruba', 'Cap', 'Royal'], priceMin: 10000, priceMax: 18000, desc: 'Royal Yoruba cap with intricate detailing. A symbol of nobility.' },
  { img: 'yoruba-cap-4.jpg', name: 'Yoruba Abeti Aja Cap', category: CATEGORIES.fashion, tags: ['Yoruba', 'Cap', 'Abeti Aja'], priceMin: 9000, priceMax: 15000, desc: 'Yoruba Abeti Aja style cap. A timeless traditional design.' },
  { img: 'yoruba-cap-5.jpg', name: 'Premium Yoruba Cap', category: CATEGORIES.fashion, tags: ['Yoruba', 'Cap', 'Premium'], priceMin: 11000, priceMax: 19000, desc: 'Premium quality Yoruba cap. Made from finest aso oke material.' },
  { img: 'yoruba-cap-7.jpg', name: 'Yoruba Cap — Heritage Edition', category: CATEGORIES.fashion, tags: ['Yoruba', 'Cap', 'Heritage'], priceMin: 12000, priceMax: 20000, desc: 'Heritage edition Yoruba cap. Hand-crafted with traditional methods.' },

  // ───── Other Caps (2)
  { img: 'idoma-cap-1.jpg', name: 'Idoma Traditional Cap', category: CATEGORIES.fashion, tags: ['Idoma', 'Cap', 'Traditional'], priceMin: 9000, priceMax: 16000, desc: 'Authentic Idoma traditional cap. Made by master weavers in Benue.' },
  { img: 'traditional-hat-1.jpg', name: 'Traditional Nigerian Hat', category: CATEGORIES.fashion, tags: ['Traditional', 'Hat', 'Nigerian'], priceMin: 7500, priceMax: 13000, desc: 'Traditional Nigerian hat. A versatile piece for cultural events.' },

  // ───── Men Shoes (12)
  { img: 'shoe-1.jpg', name: 'Classic Brown Leather Loafers', category: CATEGORIES.footwear, tags: ['Loafers', 'Leather', 'Brown', 'Men'], priceMin: 35000, priceMax: 55000, desc: 'Handcrafted brown leather loafers. Premium leather, comfortable fit, made in Aba.' },
  { img: 'shoe-2.jpg', name: 'Black Oxford Dress Shoes', category: CATEGORIES.footwear, tags: ['Oxford', 'Dress Shoes', 'Black', 'Men'], priceMin: 38000, priceMax: 60000, desc: 'Classic black Oxford dress shoes. Perfect for office and formal events.' },
  { img: 'shoe-3.jpg', name: 'Tan Leather Brogues', category: CATEGORIES.footwear, tags: ['Brogues', 'Leather', 'Tan', 'Men'], priceMin: 42000, priceMax: 65000, desc: 'Premium tan leather brogues. Hand-stitched detail, durable construction.' },
  { img: 'shoe-4.jpg', name: 'Casual Suede Loafers', category: CATEGORIES.footwear, tags: ['Loafers', 'Suede', 'Casual', 'Men'], priceMin: 32000, priceMax: 48000, desc: 'Casual suede loafers, comfortable for daily wear. Multiple colors available.' },
  { img: 'shoe-5.jpg', name: 'Italian-Style Dress Shoes', category: CATEGORIES.footwear, tags: ['Dress Shoes', 'Italian', 'Premium', 'Men'], priceMin: 50000, priceMax: 80000, desc: 'Italian-style dress shoes. Premium leather, expert craftsmanship.' },
  { img: 'shoe-6.jpg', name: 'Brown Penny Loafers', category: CATEGORIES.footwear, tags: ['Loafers', 'Penny', 'Brown', 'Men'], priceMin: 36000, priceMax: 54000, desc: 'Classic brown penny loafers. A timeless addition to your wardrobe.' },
  { img: 'shoe-7.jpg', name: 'Black Leather Mules', category: CATEGORIES.footwear, tags: ['Mules', 'Leather', 'Black', 'Men'], priceMin: 30000, priceMax: 46000, desc: 'Black leather mules with handcrafted detailing. Comfortable and stylish.' },
  { img: 'shoe-8.jpg', name: 'Burgundy Tassel Loafers', category: CATEGORIES.footwear, tags: ['Loafers', 'Tassel', 'Burgundy', 'Men'], priceMin: 40000, priceMax: 62000, desc: 'Burgundy tassel loafers. Adds sophistication to any outfit.' },
  { img: 'shoe-10.jpg', name: 'Cognac Dress Loafers', category: CATEGORIES.footwear, tags: ['Loafers', 'Cognac', 'Dress', 'Men'], priceMin: 38000, priceMax: 58000, desc: 'Cognac dress loafers. Premium leather with hand-stitched details.' },
  { img: 'shoe-11.jpg', name: 'Navy Suede Slip-ons', category: CATEGORIES.footwear, tags: ['Slip-ons', 'Suede', 'Navy', 'Men'], priceMin: 32000, priceMax: 48000, desc: 'Navy suede slip-on shoes. Casual, comfortable, and modern.' },
  { img: 'shoe-12.jpg', name: 'Brown Monk Strap Shoes', category: CATEGORIES.footwear, tags: ['Monk Strap', 'Brown', 'Leather', 'Men'], priceMin: 45000, priceMax: 70000, desc: 'Distinguished brown monk strap shoes. A perfect blend of style and elegance.' },
  { img: 'shoe-15.jpg', name: 'Premium Wingtip Shoes', category: CATEGORIES.footwear, tags: ['Wingtip', 'Premium', 'Leather', 'Men'], priceMin: 48000, priceMax: 75000, desc: 'Premium wingtip dress shoes. Hand-finished, made for the discerning gentleman.' },

  // ───── Women Shoes (10)
  { img: 'woman-shoe-1.jpg', name: 'Elegant Pointed Toe Heels', category: CATEGORIES.footwear, tags: ['Heels', 'Pointed Toe', 'Women', 'Elegant'], priceMin: 28000, priceMax: 45000, desc: 'Elegant pointed-toe heels for the modern woman. Comfortable yet sophisticated.' },
  { img: 'woman-shoe-2.jpg', name: 'Classic Black Pumps', category: CATEGORIES.footwear, tags: ['Pumps', 'Black', 'Classic', 'Women'], priceMin: 25000, priceMax: 40000, desc: 'Classic black pumps. Essential for every woman\'s wardrobe.' },
  { img: 'woman-shoe-3.jpg', name: 'Strappy Stiletto Heels', category: CATEGORIES.footwear, tags: ['Stiletto', 'Strappy', 'Heels', 'Women'], priceMin: 30000, priceMax: 48000, desc: 'Strappy stiletto heels. Perfect for evening occasions and parties.' },
  { img: 'woman-shoe-4.jpg', name: 'Block Heel Sandals', category: CATEGORIES.footwear, tags: ['Sandals', 'Block Heel', 'Women'], priceMin: 22000, priceMax: 38000, desc: 'Stylish block heel sandals. Comfortable for all-day wear.' },
  { img: 'woman-shoe-5.jpg', name: 'Designer Wedding Heels', category: CATEGORIES.footwear, tags: ['Heels', 'Wedding', 'Designer', 'Women'], priceMin: 45000, priceMax: 75000, desc: 'Designer wedding heels with crystal embellishments. The perfect bridal shoe.' },
  { img: 'woman-shoe-6.jpg', name: 'Leather Flat Sandals', category: CATEGORIES.footwear, tags: ['Sandals', 'Flat', 'Leather', 'Women'], priceMin: 18000, priceMax: 30000, desc: 'Comfortable leather flat sandals. Versatile and durable for everyday wear.' },
  { img: 'woman-shoe-7.jpg', name: 'Embellished Party Heels', category: CATEGORIES.footwear, tags: ['Heels', 'Embellished', 'Party', 'Women'], priceMin: 32000, priceMax: 52000, desc: 'Beautifully embellished heels. Make a statement at any event.' },
  { img: 'woman-shoe-8.jpg', name: 'Slingback Pumps', category: CATEGORIES.footwear, tags: ['Pumps', 'Slingback', 'Women'], priceMin: 28000, priceMax: 44000, desc: 'Chic slingback pumps. Sophisticated and modern for office or evening wear.' },
  { img: 'woman-shoe-9.jpg', name: 'Open Toe Heeled Sandals', category: CATEGORIES.footwear, tags: ['Sandals', 'Open Toe', 'Heeled', 'Women'], priceMin: 26000, priceMax: 42000, desc: 'Open toe heeled sandals. Perfect for warm weather and special occasions.' },
  { img: 'woman-shoe-10.jpg', name: 'Premium Stiletto Pumps', category: CATEGORIES.footwear, tags: ['Stiletto', 'Pumps', 'Premium', 'Women'], priceMin: 35000, priceMax: 55000, desc: 'Premium stiletto pumps. Handcrafted with attention to every detail.' },

  // ───── Bead Bracelets/Hand beads (6)
  { img: 'bead-handband.jpg', name: 'Beaded Hand Band', category: CATEGORIES.jewelry, tags: ['Beads', 'Bracelet', 'Handcrafted'], priceMin: 3500, priceMax: 7000, desc: 'Hand-beaded bracelet with traditional African motifs. Ethically made.' },
  { img: 'hand-bead-1.jpg', name: 'Coral Bead Bracelet', category: CATEGORIES.jewelry, tags: ['Coral', 'Bead', 'Bracelet'], priceMin: 8500, priceMax: 15000, desc: 'Authentic coral bead bracelet. Hand-strung in Lagos. Symbolizes prosperity.' },
  { img: 'hand-bead-4.jpg', name: 'Multi-Strand Bead Bracelet', category: CATEGORIES.jewelry, tags: ['Multi-Strand', 'Bead', 'Bracelet'], priceMin: 6500, priceMax: 12000, desc: 'Multi-strand bead bracelet. A vibrant accessory for everyday wear.' },
  { img: 'hand-bead-5.jpg', name: 'Royal Bead Bracelet Set', category: CATEGORIES.jewelry, tags: ['Royal', 'Bead', 'Bracelet Set'], priceMin: 9500, priceMax: 18000, desc: 'Royal bead bracelet set. Includes 3 matching bracelets.' },
  { img: 'hand-bead-6.jpg', name: 'Premium Beaded Wristlet', category: CATEGORIES.jewelry, tags: ['Premium', 'Beaded', 'Wristlet'], priceMin: 7500, priceMax: 14000, desc: 'Premium quality beaded wristlet. Adds a touch of culture to any outfit.' },
  { img: 'hand-bead-7.jpg', name: 'Heritage Bead Bracelet', category: CATEGORIES.jewelry, tags: ['Heritage', 'Bead', 'Bracelet'], priceMin: 6000, priceMax: 11000, desc: 'Heritage style bead bracelet. Hand-crafted using traditional Nigerian techniques.' },
  { img: 'hand-bead-8.jpg', name: 'Designer Bead Bracelet', category: CATEGORIES.jewelry, tags: ['Designer', 'Bead', 'Bracelet'], priceMin: 8000, priceMax: 16000, desc: 'Designer bead bracelet with mixed materials. Unique handcrafted piece.' },

  // ───── Bead Necklaces (5)
  { img: 'bead-necklace-2.jpg', name: 'Traditional Bead Necklace', category: CATEGORIES.jewelry, tags: ['Necklace', 'Beads', 'Traditional'], priceMin: 12000, priceMax: 22000, desc: 'Traditional bead necklace inspired by Nigerian culture. A statement piece.' },
  { img: 'bead-necklace-3.jpg', name: 'Coral Bead Necklace', category: CATEGORIES.jewelry, tags: ['Coral', 'Necklace', 'Beads'], priceMin: 18000, priceMax: 35000, desc: 'Authentic coral bead necklace. Beautifully strung, a heritage piece.' },
  { img: 'neck-bead-1.jpg', name: 'Royal Neck Bead', category: CATEGORIES.jewelry, tags: ['Neck Bead', 'Royal'], priceMin: 14000, priceMax: 26000, desc: 'Royal neck bead with intricate detailing. Perfect for traditional ceremonies.' },
  { img: 'neck-bead-4.jpg', name: 'Premium Neck Bead Set', category: CATEGORIES.jewelry, tags: ['Neck Bead', 'Premium', 'Set'], priceMin: 16000, priceMax: 30000, desc: 'Premium neck bead set. Includes choker and matching earrings.' },
  { img: 'nead-necklace.jpg', name: 'Statement Bead Necklace', category: CATEGORIES.jewelry, tags: ['Statement', 'Bead', 'Necklace'], priceMin: 10000, priceMax: 20000, desc: 'Statement bead necklace. Bold colors and unique design.' },

  // ───── Waist beads (5)
  { img: 'waist-bead-1.jpg', name: 'Classic Waist Beads', category: CATEGORIES.jewelry, tags: ['Waist Beads', 'Classic'], priceMin: 4500, priceMax: 8500, desc: 'Classic waist beads. Hand-strung with quality glass beads.' },
  { img: 'waist-bead-2.jpg', name: 'Royal Waist Beads', category: CATEGORIES.jewelry, tags: ['Waist Beads', 'Royal'], priceMin: 5500, priceMax: 10000, desc: 'Royal waist beads with mixed colors. Adjustable to fit comfortably.' },
  { img: 'waist-bead-4.jpg', name: 'Premium Waist Beads Set', category: CATEGORIES.jewelry, tags: ['Waist Beads', 'Premium', 'Set'], priceMin: 7500, priceMax: 14000, desc: 'Premium waist beads set. Includes 3 strands in coordinating colors.' },
  { img: 'waist-bead-6.jpg', name: 'Coral Waist Beads', category: CATEGORIES.jewelry, tags: ['Waist Beads', 'Coral'], priceMin: 6500, priceMax: 12000, desc: 'Coral-tone waist beads. A beautiful traditional accessory.' },
  { img: 'waist-bead-9.jpg', name: 'Designer Waist Beads', category: CATEGORIES.jewelry, tags: ['Waist Beads', 'Designer'], priceMin: 8000, priceMax: 15000, desc: 'Designer waist beads with crystal accents. Elegant and unique.' },

  // ───── Leg bead (1)
  { img: 'leg-bead-1.jpg', name: 'Traditional Leg Beads', category: CATEGORIES.jewelry, tags: ['Leg Beads', 'Traditional'], priceMin: 5000, priceMax: 9500, desc: 'Traditional leg beads. Hand-crafted with authentic Nigerian style.' },

  // ───── Bags (8)
  { img: 'bag-1.jpg', name: 'Handmade Leather Tote', category: CATEGORIES.bags, tags: ['Tote', 'Leather', 'Handmade'], priceMin: 35000, priceMax: 55000, desc: 'Handmade leather tote bag. Spacious, durable, and stylish for daily use.' },
  { img: 'bead-bag-1.jpg', name: 'Beaded Evening Bag', category: CATEGORIES.bags, tags: ['Beaded', 'Evening', 'Bag'], priceMin: 22000, priceMax: 40000, desc: 'Hand-beaded evening bag. Adds glamour to any outfit.' },
  { img: 'bead-bag-2.jpg', name: 'Royal Beaded Clutch', category: CATEGORIES.bags, tags: ['Beaded', 'Clutch', 'Royal'], priceMin: 18000, priceMax: 32000, desc: 'Royal beaded clutch. Compact yet stylish for special occasions.' },
  { img: 'bead-bag-4.jpg', name: 'Premium Beaded Handbag', category: CATEGORIES.bags, tags: ['Beaded', 'Handbag', 'Premium'], priceMin: 28000, priceMax: 48000, desc: 'Premium beaded handbag. A statement piece for any wardrobe.' },
  { img: 'bead-bag-5.jpg', name: 'Statement Beaded Bag', category: CATEGORIES.bags, tags: ['Beaded', 'Statement', 'Bag'], priceMin: 25000, priceMax: 42000, desc: 'Statement beaded bag with bold colors. Stand out with this unique piece.' },
  { img: 'bead-bag-7.jpg', name: 'Wedding Beaded Purse', category: CATEGORIES.bags, tags: ['Beaded', 'Wedding', 'Purse'], priceMin: 30000, priceMax: 52000, desc: 'Wedding beaded purse. Elegantly crafted for the discerning bride.' },
  { img: 'bead-bag-9.jpg', name: 'Designer Beaded Tote', category: CATEGORIES.bags, tags: ['Beaded', 'Tote', 'Designer'], priceMin: 32000, priceMax: 55000, desc: 'Designer beaded tote bag. Roomy with intricate beadwork.' },
  { img: 'knitted-bag-2.jpg', name: 'Crochet Knitted Handbag', category: CATEGORIES.bags, tags: ['Crochet', 'Knitted', 'Handbag'], priceMin: 15000, priceMax: 28000, desc: 'Hand-crocheted knitted handbag. Lightweight and stylish.' },
  { img: 'woman-bag-2.jpg', name: 'Women\'s Premium Handbag', category: CATEGORIES.bags, tags: ['Handbag', 'Women', 'Premium'], priceMin: 26000, priceMax: 45000, desc: 'Premium women\'s handbag. Made with quality materials for lasting use.' },

  // ───── Beauty (9)
  { img: 'avila-black-soap.jpg', name: 'Avila African Black Soap', category: CATEGORIES.beauty, tags: ['Black Soap', 'Natural', 'African'], priceMin: 3500, priceMax: 6000, desc: 'Authentic African black soap. Natural ingredients, gentle on skin. 250g bar.' },
  { img: 'black soap.jpg', name: 'Pure African Black Soap', category: CATEGORIES.beauty, tags: ['Black Soap', 'Pure', 'Natural'], priceMin: 3000, priceMax: 5500, desc: 'Pure African black soap, traditionally made. Great for acne-prone skin.' },
  { img: 'face-black-soap.jpg', name: 'Face Black Soap — Brightening', category: CATEGORIES.beauty, tags: ['Black Soap', 'Face', 'Brightening'], priceMin: 4000, priceMax: 7500, desc: 'Specially formulated face black soap with brightening agents. Natural and effective.' },
  { img: 'herbal-black-soap.jpg', name: 'Herbal Black Soap', category: CATEGORIES.beauty, tags: ['Black Soap', 'Herbal', 'Natural'], priceMin: 3800, priceMax: 6500, desc: 'Herbal black soap with healing properties. Made with traditional Nigerian herbs.' },
  { img: 'natural-black-soap.jpg', name: 'Natural African Black Soap', category: CATEGORIES.beauty, tags: ['Black Soap', 'Natural', 'Organic'], priceMin: 3500, priceMax: 6000, desc: 'Natural African black soap, free from chemicals. Pure shea and plantain ash.' },
  { img: 'liquid-soap.jpg', name: 'Liquid Black Soap — Family Pack', category: CATEGORIES.beauty, tags: ['Liquid Soap', 'Black', 'Family Pack'], priceMin: 5500, priceMax: 10000, desc: 'Liquid black soap family pack. Mild yet effective for all skin types.' },
  { img: 'liquid soap-2.jpg', name: 'Brightening Liquid Soap', category: CATEGORIES.beauty, tags: ['Liquid Soap', 'Brightening'], priceMin: 4500, priceMax: 8500, desc: 'Brightening liquid soap with vitamin C. Gives skin a healthy glow.' },
  { img: 'liquid-soap-5.jpg', name: 'Herbal Liquid Soap', category: CATEGORIES.beauty, tags: ['Liquid Soap', 'Herbal', 'Natural'], priceMin: 5000, priceMax: 9000, desc: 'Herbal liquid soap with natural extracts. Perfect for sensitive skin.' },
  { img: 'liquidsoap-4.jpg', name: 'Premium Liquid Black Soap', category: CATEGORIES.beauty, tags: ['Liquid Soap', 'Premium', 'Black'], priceMin: 6000, priceMax: 11000, desc: 'Premium liquid black soap. 1L bottle, lasts up to 3 months.' },

  // ───── Art (3)
  { img: 'art-1.jpg', name: 'Original Nigerian Art Piece', category: CATEGORIES.art, tags: ['Art', 'Nigerian', 'Original'], priceMin: 45000, priceMax: 95000, desc: 'Original Nigerian art piece by a contemporary artist. Acrylic on canvas.' },
  { img: 'art-2.jpg', name: 'Contemporary African Art', category: CATEGORIES.art, tags: ['Art', 'Contemporary', 'African'], priceMin: 55000, priceMax: 120000, desc: 'Contemporary African art piece. A statement for your home or office.' },
  { img: 'artwork-3.jpg', name: 'Modern Abstract Painting', category: CATEGORIES.art, tags: ['Art', 'Modern', 'Abstract'], priceMin: 40000, priceMax: 85000, desc: 'Modern abstract painting. A captivating piece for art lovers.' },

  // ───── Art Frames (10)
  { img: 'art-frame-1.jpg', name: 'Framed African Art Print', category: CATEGORIES.art, tags: ['Framed', 'Art Print', 'African'], priceMin: 25000, priceMax: 45000, desc: 'Beautifully framed African art print. Ready to hang in your home.' },
  { img: 'art-frame-2.jpg', name: 'Cultural Art Frame', category: CATEGORIES.art, tags: ['Framed', 'Cultural', 'Art'], priceMin: 28000, priceMax: 48000, desc: 'Cultural art piece in premium frame. Celebrates Nigerian heritage.' },
  { img: 'art-frame-3.jpg', name: 'Heritage Framed Artwork', category: CATEGORIES.art, tags: ['Framed', 'Heritage', 'Artwork'], priceMin: 30000, priceMax: 52000, desc: 'Heritage framed artwork. A timeless decor piece.' },
  { img: 'art-frame-4.jpg', name: 'Premium Framed Art', category: CATEGORIES.art, tags: ['Framed', 'Premium', 'Art'], priceMin: 35000, priceMax: 60000, desc: 'Premium framed art. Made with quality materials.' },
  { img: 'art-frame-5.jpg', name: 'Modern Wall Art', category: CATEGORIES.art, tags: ['Wall Art', 'Modern', 'Framed'], priceMin: 22000, priceMax: 40000, desc: 'Modern wall art for contemporary spaces. Adds character to any room.' },
  { img: 'art-frame-6.jpg', name: 'Designer Art Frame', category: CATEGORIES.art, tags: ['Framed', 'Designer', 'Art'], priceMin: 32000, priceMax: 55000, desc: 'Designer art frame. Statement piece for your living room.' },
  { img: 'art-frame-7.jpg', name: 'Tribal Art Wall Decor', category: CATEGORIES.art, tags: ['Tribal', 'Wall Decor', 'Framed'], priceMin: 26000, priceMax: 46000, desc: 'Tribal art wall decor. Brings African essence to your space.' },
  { img: 'art-frame-8.jpg', name: 'Royal Art Frame', category: CATEGORIES.art, tags: ['Royal', 'Framed', 'Art'], priceMin: 38000, priceMax: 65000, desc: 'Royal art frame with gold accents. Luxurious wall decor.' },
  { img: 'art-frame-9.jpg', name: 'Contemporary Framed Print', category: CATEGORIES.art, tags: ['Contemporary', 'Framed', 'Print'], priceMin: 24000, priceMax: 42000, desc: 'Contemporary framed art print. Modern and elegant.' },
  { img: 'art-frame-10.jpg', name: 'Statement Framed Art', category: CATEGORIES.art, tags: ['Statement', 'Framed', 'Art'], priceMin: 36000, priceMax: 62000, desc: 'Statement framed art piece. Makes any room feel curated.' },

  // ───── Sculptures (3)
  { img: 'sculpture-1.jpg', name: 'Handcrafted Wood Sculpture', category: CATEGORIES.art, tags: ['Sculpture', 'Wood', 'Handcrafted'], priceMin: 35000, priceMax: 65000, desc: 'Handcrafted wood sculpture by Nigerian artisans. Unique decor piece.' },
  { img: 'sculpture-3.jpg', name: 'Traditional African Sculpture', category: CATEGORIES.art, tags: ['Sculpture', 'African', 'Traditional'], priceMin: 42000, priceMax: 80000, desc: 'Traditional African sculpture. Hand-carved with cultural significance.' },
  { img: 'sculpture-5.jpg', name: 'Premium Bronze Sculpture', category: CATEGORIES.art, tags: ['Sculpture', 'Bronze', 'Premium'], priceMin: 75000, priceMax: 145000, desc: 'Premium bronze sculpture. A heritage piece worthy of any collection.' },
];

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random date in the last 60 days
function randomRecentDate() {
  const now = Date.now();
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
  return new Date(randInt(sixtyDaysAgo, now));
}

// Shuffle array (Fisher-Yates)
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

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('\nLoading stores...');
  STORES = await db
    .collection('stores')
    .find({ isDeleted: { $ne: true } })
    .toArray();
  console.log(`Found ${STORES.length} stores`);

  console.log('\nDeleting all existing listings...');
  const delResult = await db.collection('listings').deleteMany({});
  console.log(`Deleted ${delResult.deletedCount} listings`);

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

  // Shuffle so categories are mixed
  const shuffledProducts = shuffle(validProducts);

  console.log('\nUploading images and creating listings...');
  let created = 0;
  let failed = 0;

  for (let i = 0; i < shuffledProducts.length; i++) {
    const product = shuffledProducts[i];
    const progress = `[${i + 1}/${shuffledProducts.length}]`;

    try {
      // Upload to Cloudinary
      const url = await uploadImage(product.filePath);

      // Pick a store
      const store = pickStore(product.category);
      if (!store) {
        console.warn(`${progress} no eligible store for: ${product.name}`);
        failed++;
        continue;
      }

      // Random price in the range, rounded to 500 NGN
      const priceNaira = Math.round(randInt(product.priceMin, product.priceMax) / 500) * 500;
      const priceKobo = priceNaira * 100;

      // Quantity (typically 1-15 for handmade items)
      const quantity = randInt(1, 12);

      // Random listing type — mostly self_listing (most realistic for handmade)
      // ~70% self_listing, ~25% consignment, ~5% direct_purchase
      const r = Math.random();
      let type, adminPricing = null;
      if (r < 0.7) {
        type = 'self_listing';
      } else if (r < 0.95) {
        type = 'consignment';
        adminPricing = {
          sellingPrice: Math.round(priceKobo * 1.15), // +15% markup
          commissionRate: 15,
        };
      } else {
        type = 'direct_purchase';
        adminPricing = {
          sellingPrice: Math.round(priceKobo * 1.25), // +25% markup
          purchasePrice: priceKobo,
        };
      }

      // Random condition
      const conditions = ['brand_new', 'brand_new', 'brand_new', 'fairly_used'];
      const condition = pickRandom(conditions);

      // Listing fee (2.5% of price for self-listing)
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
        askingPrice: {
          amount: priceKobo,
          currency: 'NGN',
          negotiable: Math.random() < 0.4,
        },
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
        views: randInt(20, 800),
        likes: randInt(0, 60),
        totalSales: randInt(0, 25),
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
      { $set: { totalListings: count } }
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
