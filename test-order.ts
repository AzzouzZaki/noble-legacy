async function testOrder() {
  console.log('Hitting POST /api/orders...');
  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test Customer',
      customerPhone: '0555555555',
      customerEmail: 'test@example.com',
      shippingAddress: 'Algiers, Algeria',
      totalAmount: '5000',
      items: [
        {
          productId: 47,
          size: 'M',
          quantity: 2,
          unitPrice: '2500'
        }
      ]
    })
  });
  
  const text = await res.text();
  console.log('Order status:', res.status);
  console.log('Order response:', text);
  
  process.exit(0);
}

testOrder().catch(console.error);
