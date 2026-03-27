const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function testPerformance() {
  console.log('🚀 Starting Performance Test...\n');

  const tests = [
    { name: 'Products List', url: `${API_URL}/products?limit=20` },
    {
      name: 'Products with Filters',
      url: `${API_URL}/products?categories=furniture&limit=20`,
    },
    { name: 'Single Product', url: `${API_URL}/products` },
    { name: 'Categories', url: `${API_URL}/categories` },
    { name: 'Styles', url: `${API_URL}/styles` },
    { name: 'Spaces', url: `${API_URL}/spaces` },
  ];

  for (const test of tests) {
    try {
      // First request (cold cache)
      const start1 = Date.now();
      await axios.get(test.url);
      const time1 = Date.now() - start1;

      // Second request (warm cache)
      const start2 = Date.now();
      await axios.get(test.url);
      const time2 = Date.now() - start2;

      // Third request (hot cache)
      const start3 = Date.now();
      await axios.get(test.url);
      const time3 = Date.now() - start3;

      console.log(`✅ ${test.name}`);
      console.log(`   Cold: ${time1}ms | Warm: ${time2}ms | Hot: ${time3}ms`);
      console.log(`   Speedup: ${(time1 / time3).toFixed(2)}x faster\n`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}\n`);
    }
  }

  // Test concurrent requests
  console.log('🔥 Testing Concurrent Requests (10 parallel)...');
  const concurrentStart = Date.now();
  await Promise.all(
    Array(10)
      .fill(null)
      .map(() => axios.get(`${API_URL}/products?limit=20`)),
  );
  const concurrentTime = Date.now() - concurrentStart;
  console.log(`   10 parallel requests: ${concurrentTime}ms\n`);

  console.log('✨ Performance test complete!');
}

testPerformance().catch(console.error);
