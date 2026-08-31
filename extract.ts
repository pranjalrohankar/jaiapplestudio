import { categories, products } from './src/lib/products';
import fs from 'fs';

const data = {
  categories,
  products,
};

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2));
