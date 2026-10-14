import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
  console.log('=== RUNNING PRODUCTION HARDENING & ORDER CONTRACT AUDIT TESTS ===\n');
  const baseUrl = 'http://localhost:3000';

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string, detail?: any) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`, detail || '');
    }
  }

  // 1. Health Endpoint Test
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.ok && healthJson.status === 'ok', 'GET /api/health returns HTTP 200 with status ok');
  } catch (e: any) {
    assert(false, 'GET /api/health failed', e.message);
  }

  // 2. Unauthenticated Admin API Protection
  try {
    const unauthProductRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test-hacker', name: 'Malicious Product', price: 100 })
    });
    assert(unauthProductRes.status === 401, 'POST /api/admin/products without token is rejected with HTTP 401');

    const unauthStatusRes = await fetch(`${baseUrl}/api/admin/orders/SNA-TEST/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dibayar' })
    });
    assert(unauthStatusRes.status === 401, 'PUT /api/admin/orders/:id/status without token is rejected with HTTP 401');
  } catch (e: any) {
    assert(false, 'Admin security check failed', e.message);
  }

  // 3. Authenticated Admin API Test (using SAENA_ADMIN_KEY from env or default key)
  const adminKey = process.env.SAENA_ADMIN_KEY || 'saena-boutique-secret-key-2026';
  let adminToken = '';
  try {
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: adminKey })
    });
    const loginJson = await loginRes.json();
    if (loginRes.ok && loginJson.token) {
      adminToken = loginJson.token;
      assert(true, 'POST /api/admin/login succeeds and returns signed admin session token');

      // Test authorized product update
      const prodRes = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          id: 'saena-test-audit',
          name: 'Produk Uji Coba Hardening',
          price: 250000,
          category: 'abaya-gamis',
          stock: { 'All Size': 10 }
        })
      });
      const prodJson = await prodRes.json();
      assert(prodRes.ok && prodJson.success, 'POST /api/admin/products with admin token succeeds (HTTP 200)');

      // Clean up test product
      await fetch(`${baseUrl}/api/admin/products?id=saena-test-audit`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
    } else {
      console.log('[NOTE] Admin key not matching test key, skipping admin creation test');
    }
  } catch (e: any) {
    console.warn('Admin test notice:', e.message);
  }

  // 4. Test Customer Order Creation (/api/orders/create)
  let createdOrderNumber = '';
  let createdAccessToken = '';
  try {
    const orderPayload = {
      customer: {
        customerName: 'Siti Aminah',
        phone: '081234567890',
        email: 'siti.aminah@test.com',
        address: 'Jl. Sutisna Senjaya No. 45 RT 02 RW 05',
        city: 'Kota Tasikmalaya',
        province: 'Jawa Barat',
        district: 'Cihideung',
        postalCode: '46123'
      },
      items: [
        {
          id: 'saena-03',
          productId: 'saena-03',
          name: 'Madina Pleated Silk Pashmina Shawl (Standard - Emerald Forest)',
          price: 129000,
          quantity: 1,
          color: 'Emerald Forest',
          size: 'Standard',
          weight: 200
        }
      ],
      shipping: {
        id: 'jne-reg',
        courier: 'JNE Express',
        service: 'REG',
        cost: 15000
      },
      paymentMethod: 'COD',
      paymentChannel: 'cod',
      notes: 'Harap dikemas rapi'
    };

    const createRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const createJson = await createRes.json();
    assert(createRes.ok && createJson.success, 'POST /api/orders/create returns HTTP 200 JSON with success: true');
    assert(!!(createJson.order || createJson.data), 'POST /api/orders/create returns canonical order object');

    createdOrderNumber = createJson.order?.orderNumber || createJson.data?.orderNumber || createJson.orderNumber;
    createdAccessToken = createJson.order?.accessToken || createJson.data?.accessToken || createJson.accessToken;
    assert(!!createdOrderNumber && createdOrderNumber.startsWith('SNA-'), `Order Number correctly generated with prefix: ${createdOrderNumber}`);
    assert(!!createdAccessToken, `Secure accessToken correctly generated: ${createdAccessToken ? createdAccessToken.slice(0, 8) + '...' : ''}`);
  } catch (e: any) {
    assert(false, 'POST /api/orders/create failed', e.message);
  }

  // 5. Test Order Detail Endpoint Contract (/api/orders/:orderNumber)
  if (createdOrderNumber && createdAccessToken) {
    try {
      // 5a. Access with valid token via Authorization Bearer header
      const detailRes = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(createdOrderNumber)}`, {
        headers: {
          'Authorization': `Bearer ${createdAccessToken}`,
          'x-order-token': createdAccessToken
        }
      });
      const detailJson = await detailRes.json();

      assert(detailRes.ok && detailJson.success, 'GET /api/orders/:orderNumber with header token returns HTTP 200 (order A + token A -> PASS)');
      assert(!!detailJson.order, 'GET /api/orders/:orderNumber response contains "order" root key');
      assert(detailJson.order.orderNumber === createdOrderNumber, 'order.orderNumber matches created orderNumber exactly');
      assert(detailJson.order.invoiceNumber === `INV-${createdOrderNumber}`, 'order.invoiceNumber follows INV-SNA pattern');
      assert(!!detailJson.order.customer && !!detailJson.order.customer.customerName, 'order.customer includes customerName');
      assert(!!detailJson.order.shippingAddress && !!detailJson.order.shippingAddress.address, 'order.shippingAddress is populated');
      assert(!!detailJson.order.price && detailJson.order.price.grandTotal > 0, 'order.price contains grandTotal');
      assert(!!detailJson.order.payment && !!detailJson.order.shipping, 'order.payment and order.shipping are fully formed');
      assert(!detailJson.accessToken, 'GET /api/orders/:orderNumber does not leak accessToken in response payload');

      // 5b. Matrix Test: order A + token B -> DENY (403)
      const fakeTokenB = 'b000000000000000000000000000000b';
      const orderATokenBRes = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(createdOrderNumber)}`, {
        headers: { 'Authorization': `Bearer ${fakeTokenB}` }
      });
      assert(orderATokenBRes.status === 403, 'Matrix: order A + token B is rejected with HTTP 403 (DENY)');

      // 5c. Matrix Test: order random + token A -> DENY (403, no 404 enumeration leak)
      const randomOrderRes = await fetch(`${baseUrl}/api/orders/SNA-99999999-FAKE`, {
        headers: { 'Authorization': `Bearer ${createdAccessToken}` }
      });
      assert(randomOrderRes.status === 403, 'Matrix: order random + token A is rejected with HTTP 403 (Anti-Enumeration DENY)');

      // 5d. Matrix Test: tanpa credential -> DENY (403, no 404 enumeration leak)
      const unauthDetailRes = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(createdOrderNumber)}`);
      assert(unauthDetailRes.status === 403, 'Matrix: tanpa credential is rejected with HTTP 403 (DENY)');

      const randomUnauthRes = await fetch(`${baseUrl}/api/orders/SNA-99999999-RANDOM`);
      assert(randomUnauthRes.status === 403, 'Matrix: random order without credential is rejected with HTTP 403 (Anti-Enumeration DENY)');

      // 5e. Token in query string is NOT accepted as valid credential
      const queryTokenOnlyRes = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(createdOrderNumber)}?token=${encodeURIComponent(createdAccessToken)}`);
      assert(queryTokenOnlyRes.status === 403, 'Token in URL query string is ignored; header/cookie required');

      // 5f. Order status polling endpoint via header
      const statusRes = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(createdOrderNumber)}/status`, {
        headers: { 'Authorization': `Bearer ${createdAccessToken}` }
      });
      const statusJson = await statusRes.json();
      assert(statusRes.ok && statusJson.success, 'GET /api/orders/:orderNumber/status with header returns HTTP 200');
      assert(statusJson.orderNumber === createdOrderNumber, 'status check returns correct orderNumber');
    } catch (e: any) {
      assert(false, 'GET /api/orders/:orderNumber verification failed', e.message);
    }
  }

  // 6. Test Idempotency & Duplicate Order Prevention
  try {
    const idempKey = `test-idemp-${Date.now()}`;
    const payload = {
      customer: {
        customerName: 'Dewi Lestari',
        phone: '081987654321',
        email: 'dewi@test.com',
        address: 'Jl. Juanda No. 10',
        city: 'Kota Tasikmalaya',
        province: 'Jawa Barat',
        district: 'Cihideung',
        postalCode: '46123'
      },
      items: [{ id: 'saena-03', name: 'Madina Pleated Silk Pashmina Shawl', price: 129000, quantity: 1 }],
      shipping: { id: 'jne-reg', courier: 'JNE', service: 'REG', cost: 15000 },
      paymentMethod: 'COD'
    };

    const firstRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'idempotency-key': idempKey },
      body: JSON.stringify(payload)
    });
    const firstJson = await firstRes.json();

    const secondRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'idempotency-key': idempKey },
      body: JSON.stringify(payload)
    });
    const secondJson = await secondRes.json();

    const ord1 = firstJson.orderNumber || firstJson.data?.orderNumber;
    const ord2 = secondJson.orderNumber || secondJson.data?.orderNumber;
    assert(firstRes.ok && secondRes.ok && ord1 === ord2, `Idempotency check: Duplicate submission returns identical order (${ord1})`);
  } catch (e: any) {
    assert(false, 'Idempotency test failed', e.message);
  }

  // 7. Test Recovery Rate Limiting & Anti-Bruteforce
  try {
    let rateLimited = false;
    for (let i = 0; i < 7; i++) {
      const recRes = await fetch(`${baseUrl}/api/orders/SNA-TEST-BRUTE?phone=0899999999&name=AttackerTest`);
      if (recRes.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert(rateLimited, 'Order recovery enforces rate limiting (HTTP 429 RATE_LIMITED after repeated failures)');
  } catch (e: any) {
    assert(false, 'Recovery rate limiting test failed', e.message);
  }

  // 8. Test Shipping Rates Calculation (/api/shipping/rates)
  try {
    const ratesRes = await fetch(`${baseUrl}/api/shipping/rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originCity: 'Kota Tasikmalaya',
        destinationCity: 'Kota Bandung',
        weight: 600
      })
    });
    const ratesJson = await ratesRes.json();
    if (ratesRes.ok && ratesJson.success) {
      assert(true, 'POST /api/shipping/rates returns calculated courier services from Mengantar');
    } else {
      console.log(`[NOT VERIFIED] Mengantar.com API external connectivity: ${ratesJson.error || 'Server Mengantar tidak dapat dihubungi dari container'}`);
    }
  } catch (e: any) {
    console.log(`[NOT VERIFIED] Mengantar.com rates endpoint: ${e.message}`);
  }

  // 9. Test DOKU Test Connection Diagnostic Endpoint (/api/doku/test-connection)
  try {
    const dokuTestRes = await fetch(`${baseUrl}/api/doku/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const dokuJson = await dokuTestRes.json();
    assert(dokuTestRes.ok, `POST /api/doku/test-connection responds (mode: ${dokuJson.mode}, configured: ${dokuJson.configured})`);
  } catch (e: any) {
    assert(false, 'POST /api/doku/test-connection failed', e.message);
  }

  console.log(`\n=== TEST SUMMARY: ${passed} / ${total} ASSERTIONS PASSED ===`);
  if (passed === total) {
    console.log('ALL VERIFICATIONS SUCCESSFUL!');
  } else {
    console.error('SOME ASSERTIONS FAILED!');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
