import axios from 'axios';

async function testShipping() {
  try {
    console.log('--- Calling Backend Directly: http://localhost:5005/api/v1/shipping/provinces ---');
    const response = await axios.get('http://localhost:5005/api/v1/shipping/provinces');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Test Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testShipping();
