/**
 * Standalone MongoDB Seeder & Synchronizer
 * Run with: node scripts/sync-mongodb.js
 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/MONGODB_URI=(.*)/);
      if (match) return match[1].trim();
    }
  } catch {}
  return null;
}

function readData(filename, fallback = {}) {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.warn(`Could not read ${filename}:`, err.message);
    return fallback;
  }
}

async function main() {
  const uri = getMongoUri();
  if (!uri) {
    console.error('❌ Error: MONGODB_URI not found in environment or .env.local');
    process.exit(1);
  }

  console.log('🚀 Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB!');
    const db = client.db('apple_store');

    // 1. Products
    const productsData = readData('products.json', { products: [], categories: [] });
    const products = Array.isArray(productsData.products) ? productsData.products : [];
    if (products.length > 0) {
      await db.collection('products').deleteMany({});
      const cleanProducts = products.map(({ _id, ...rest }) => rest);
      await db.collection('products').insertMany(cleanProducts);
      console.log(`📦 Synced ${cleanProducts.length} Products to collection "products"`);
    }

    // 2. Categories
    const categoriesData = readData('categories.json', { categories: [] });
    const categories =
      Array.isArray(categoriesData.categories) && categoriesData.categories.length > 0
        ? categoriesData.categories
        : Array.isArray(productsData.categories)
        ? productsData.categories
        : [];
    if (categories.length > 0) {
      await db.collection('categories').deleteMany({});
      const cleanCategories = categories.map(({ _id, ...rest }) => rest);
      await db.collection('categories').insertMany(cleanCategories);

      await db.collection('categories_config').deleteMany({});
      await db.collection('categories_config').insertOne({ categories: cleanCategories });

      console.log(`📁 Synced ${cleanCategories.length} Categories to collections "categories" & "categories_config"`);
    }

    // 3. Top Hero Slider
    const sliderData = readData('slider.json', { slides: [] });
    if (sliderData) {
      await db.collection('slider_config').deleteMany({});
      const { _id, ...cleanSlider } = sliderData;
      await db.collection('slider_config').insertOne(cleanSlider);
      console.log(`🎠 Synced ${sliderData.slides?.length || 0} Hero Slides to collection "slider_config"`);
    }

    // 4. Offer Banners & Posters
    const bannersData = readData('banners.json', { banners: [] });
    if (bannersData) {
      await db.collection('banners_config').deleteMany({});
      const { _id, ...cleanBanners } = bannersData;
      await db.collection('banners_config').insertOne(cleanBanners);

      await db.collection('banners').deleteMany({});
      await db.collection('banners').insertOne(cleanBanners);

      console.log(`🎨 Synced ${bannersData.banners?.length || 0} Offer Banners to collections "banners_config" & "banners"`);
    }

    // 5. Orders (Non-destructive upsert)
    const ordersData = readData('orders.json', { orders: [] });
    const orders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
    let syncedOrdersCount = 0;
    for (const o of orders) {
      if (o && o.orderNo) {
        const { _id, ...cleanOrder } = o;
        await db.collection('orders').updateOne(
          { orderNo: cleanOrder.orderNo },
          { $set: cleanOrder },
          { upsert: true }
        );
        syncedOrdersCount++;
      }
    }
    console.log(`📋 Synced/Upserted ${syncedOrdersCount} Orders to collection "orders"`);

    // 6. Enquiries (Non-destructive upsert)
    const enquiriesData = readData('enquiries.json', { enquiries: [] });
    const enquiries = Array.isArray(enquiriesData.enquiries) ? enquiriesData.enquiries : [];
    let syncedEnquiriesCount = 0;
    for (const e of enquiries) {
      if (e && e.enquiryNo) {
        const { _id, ...cleanEnquiry } = e;
        await db.collection('enquiries').updateOne(
          { enquiryNo: cleanEnquiry.enquiryNo },
          { $set: cleanEnquiry },
          { upsert: true }
        );
        syncedEnquiriesCount++;
      }
    }
    console.log(`💬 Synced/Upserted ${syncedEnquiriesCount} Enquiries to collection "enquiries"`);

    // 7. Social Links
    const socialData = readData('social.json', { socialLinks: [] });
    if (socialData) {
      await db.collection('social_links').deleteMany({});
      const { _id, ...cleanSocial } = socialData;
      await db.collection('social_links').insertOne(cleanSocial);
      console.log(`🌐 Synced ${socialData.socialLinks?.length || 0} Social Links to collection "social_links"`);
    }

    console.log('\n✨ COMPLETE! All data from local JSON is now in MongoDB Atlas!');
  } catch (err) {
    console.error('\n❌ MongoDB Connection Error:', err.message);
    if (err.message.includes('SSL alert number 80') || err.message.includes('tlsv1 alert')) {
      console.error('\n🔒 IP Whitelist Issue Detected in MongoDB Atlas:');
      console.error('1. Go to https://cloud.mongodb.com/');
      console.error('2. Navigate to "Network Access" in the left sidebar.');
      console.error('3. Click "Add IP Address" and choose "Allow Access From Anywhere" (0.0.0.0/0).');
      console.error('4. Wait 1 minute for Atlas to update, then re-run this script!');
    }
  } finally {
    await client.close();
  }
}

main();
