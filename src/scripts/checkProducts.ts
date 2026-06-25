import 'dotenv/config';
import { db } from '../db/index';
import { products } from '../db/schema';

async function main(){
  const prods = await db.select().from(products);
  console.log('products:', prods.map(p=>({id:p.id, name:p.name}))); 
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1)})
