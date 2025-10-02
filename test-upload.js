// Simple test script to debug upload issues
// Run with: node test-upload.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🔍 Testing Supabase Upload Configuration...\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment Variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('❌ Missing required environment variables!');
  console.log('Please add these to your .env.local file:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Test connection and bucket
async function testConnection() {
  try {
    // Create admin client
    const adminClient = createClient(supabaseUrl, serviceKey);

    console.log('🔗 Testing connection to Supabase...');

    // List buckets
    const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return;
    }

    console.log('✅ Connected to Supabase Storage');
    console.log('📁 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Check if uploads bucket exists
    const uploadsExists = buckets.some(b => b.name === 'uploads');
    if (!uploadsExists) {
      console.log('\n❌ "uploads" bucket not found!');
      console.log('Please create an "uploads" bucket in your Supabase Dashboard → Storage');
    } else {
      console.log('\n✅ "uploads" bucket found!');
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();