import "dotenv/config";
import { db } from './src/db/index';
import { adminPushSubscriptions } from './src/db/schema';

async function testApi() {
  const adminToken = 'authenticated';
  const res1 = await fetch('http://localhost:3000/api/admin/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: 'admin_token=authenticated' },
    body: JSON.stringify({
      endpoint: 'https://fcm.googleapis.com/fcm/send/fake-endpoint',
      keys: { p256dh: 'fakep256dh', auth: 'fakeauth' }
    })
  });
  console.log('Subscribe response:', await res1.json());
  
  const subs = await db.select().from(adminPushSubscriptions);
  console.log('Subscriptions in DB after subscribe:', subs.length);
  
  const res2 = await fetch('http://localhost:3000/api/admin/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: 'admin_token=authenticated' }
  });
  console.log('Test endpoint response:', await res2.json());
  
  const subsAfter = await db.select().from(adminPushSubscriptions);
  console.log('Subscriptions in DB after test:', subsAfter.length);
  
  process.exit(0);
}
testApi().catch(console.error);
