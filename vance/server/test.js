// test-retell-api.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000';

async function testCreateWebCall() {
  console.log('\n🧪 Testing Create Web Call endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/api/create-web-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });

    const data = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    console.log('\nResponse Body:', JSON.stringify(data, null, 2));

    // Validate response structure
    const requiredFields = ['access_token', 'agent_id', 'call_id', 'call_status'];
    const missingFields = requiredFields.filter(field => !(field in data));

    if (missingFields.length > 0) {
      console.error('\n❌ Missing required fields:', missingFields.join(', '));
    } else {
      console.log('\n✅ All required fields present');
    }

    // Test call status
    if (data.call_status === 'registered') {
      console.log('✅ Call status is correct');
    } else {
      console.error(`❌ Unexpected call status: ${data.call_status}`);
    }

    // If we got a call_id, test the GET endpoint
    if (data.call_id) {
      await testGetCall(data.call_id);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

async function testGetCall(callId) {
  console.log('\n🧪 Testing Get Call endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/api/call/${callId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('\n❌ Get Call test failed:', error.message);
  }
}

async function testHealthCheck() {
  console.log('\n🧪 Testing Health Check endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', data);

    if (data.status === 'ok') {
      console.log('✅ Health check passed');
    } else {
      console.error('❌ Unexpected health status');
    }

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API tests...');
  
  await testHealthCheck();
  await testCreateWebCall();
  
  console.log('\n✨ Tests completed\n');
}

runAllTests();