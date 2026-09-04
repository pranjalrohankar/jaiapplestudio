const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = 'mongodb+srv://pvrohankar_db_user:1MeIVUDOkIVzASCW@cluster0.the3xab.mongodb.net/apple_store?retryWrites=true&w=majority';

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('apple_store');
    const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

    // Insert categories
    const categoriesCollection = db.collection('categories');
    await categoriesCollection.deleteMany({});
    if (data.categories && data.categories.length > 0) {
      await categoriesCollection.insertMany(data.categories);
      console.log(`${data.categories.length} categories inserted`);
    }

    // Insert products
    const productsCollection = db.collection('products');
    await productsCollection.deleteMany({});
    if (data.products && data.products.length > 0) {
      await productsCollection.insertMany(data.products);
      console.log(`${data.products.length} products inserted`);
    }

    // Insert banner
    if (fs.existsSync('data/banners.json')) {
      const bannerData = JSON.parse(fs.readFileSync('data/banners.json', 'utf8'));
      const bannersCollection = db.collection('banners');
      await bannersCollection.deleteMany({});
      if (bannerData.banner) {
        await bannersCollection.insertOne(bannerData.banner);
        console.log('Banner configuration inserted');
      }
    }

    console.log('Seeding to Atlas completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.close();
  }
}

run();
