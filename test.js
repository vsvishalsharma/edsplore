// test.js
const axios = require('axios');
const moment = require('moment-timezone');

const BASE_URL = 'http://localhost:3000';

// Sample test data
const testRequests = {
  checkAvailability: {
    timezone: 'America/New_York',
    startDate: moment().format(),
    endDate: moment().add(7, 'days').format()
  },
  saveBooking: {
    timezone: 'America/New_York',
    selectedDateTime: moment().add(1, 'day').startOf('hour').format()
  }
};

// Test check-availability endpoint
async function testCheckAvailability() {
  try {
    console.log('\nTesting /check-availability endpoint...');
    console.log('Request:', JSON.stringify(testRequests.checkAvailability, null, 2));
    
    const response = await axios.post(
      `${BASE_URL}/check-availability`,
      testRequests.checkAvailability
    );
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error testing check-availability:', 
      error.response?.data || error.message);
  }
}

// Test save-booking endpoint
async function testSaveBooking() {
  try {
    console.log('\nTesting /save-booking endpoint...');
    console.log('Request:', JSON.stringify(testRequests.saveBooking, null, 2));
    
    const response = await axios.post(
      `${BASE_URL}/save-booking`,
      testRequests.saveBooking
    );
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error testing save-booking:', 
      error.response?.data || error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting local tests...');
  
  // Test check-availability
  const availableSlots = await testCheckAvailability();
  
  // If we got available slots, use the first one for booking test
  if (availableSlots?.availableSlots?.length > 0) {
    testRequests.saveBooking.selectedDateTime = 
      availableSlots.availableSlots[0].dateTime;
    await testSaveBooking();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}