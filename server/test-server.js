/**
 * Simple test script to verify the font service is working
 * Run with: node test-server.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testServer() {
  console.log('🧪 Testing Font Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: Get popular fonts
    console.log('\n2. Testing popular fonts endpoint...');
    const popularResponse = await axios.get(`${BASE_URL}/api/fonts/popular`);
    console.log('✅ Popular fonts:', popularResponse.data.data.slice(0, 5));

    // Test 3: Search fonts
    console.log('\n3. Testing font search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/fonts/search?q=roboto`);
    console.log('✅ Search results for "roboto":', searchResponse.data.count, 'fonts found');

    // Test 4: Font conversion
    console.log('\n4. Testing font conversion...');
    const conversionResponse = await axios.post(`${BASE_URL}/api/fonts/convert`, {
      text: 'Hello World™',
      fontFamily: 'Roboto',
      fontWeight: '400',
      fontSize: 48,
      color: '#333333'
    });

    if (conversionResponse.data.success) {
      console.log('✅ Font conversion successful');
      console.log('   SVG size:', conversionResponse.data.data.svg.length, 'characters');
      console.log('   Dimensions:', `${conversionResponse.data.data.width}x${conversionResponse.data.data.height}`);
      console.log('   Font metrics:', conversionResponse.data.data.metrics);
    }

    // Test 5: Font preview
    console.log('\n5. Testing font preview...');
    const previewResponse = await axios.post(`${BASE_URL}/api/fonts/preview`, {
      fontFamily: 'Open Sans',
      fontWeight: '600'
    });

    if (previewResponse.data.success) {
      console.log('✅ Font preview successful');
      console.log('   Preview dimensions:', `${previewResponse.data.data.width}x${previewResponse.data.data.height}`);
    }

    // Test 6: Font weights
    console.log('\n6. Testing font weights endpoint...');
    const weightsResponse = await axios.get(`${BASE_URL}/api/fonts/Montserrat/weights`);
    console.log('✅ Montserrat weights:', weightsResponse.data.data);

    console.log('\n🎉 All tests passed! Font service is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the server is running with: npm run dev');
    }
    
    process.exit(1);
  }
}

// Run tests
testServer();