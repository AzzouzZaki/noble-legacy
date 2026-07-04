import "dotenv/config";
import { db } from './src/db/index';
import { products } from './src/db/schema';
db.select().from(products).then(res => {
  console.log('Products in DB:', res);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
