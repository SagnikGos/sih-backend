// Simple test script to verify Vercel Blob setup
// Run with: node test_vercel_blob.js

import { put } from '@vercel/blob';

async function testVercelBlob() {
  try {
    console.log('🧪 Testing Vercel Blob connection...');
    
    // Test with a simple text file
    const testContent = 'Hello from Vercel Blob!';
    const blob = await put('test.txt', testContent, {
      access: 'public',
    });
    
    console.log('✅ Vercel Blob test successful!');
    console.log('📁 File URL:', blob.url);
    console.log('🔑 Token configured correctly');
    
  } catch (error) {
    console.error('❌ Vercel Blob test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      console.log('\n💡 Solution:');
      console.log('1. Set up Vercel Blob in your Vercel dashboard');
      console.log('2. Add BLOB_READ_WRITE_TOKEN to your .env file');
      console.log('3. Make sure the token is correct');
    }
  }
}

testVercelBlob();
