import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Ensure dotenv is loaded to get environment variables
dotenv.config();

// Test the configuration first
console.log('Cloudinary Configuration Check:', {
  cloud_name: process.env.CLOUD_NAME ? process.env.CLOUD_NAME : 'Missing',
  api_key: process.env.CLOUD_KEY ? 'Set' : 'Missing',
  api_secret: process.env.CLOUD_SECRET ? 'Set' : 'Missing'
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
  secure: true
});

// Test connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful');
  })
  .catch(err => {
    console.error('❌ Cloudinary connection failed:', err.message);
  });

export default cloudinary;
