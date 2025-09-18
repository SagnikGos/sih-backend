# Vercel Blob Setup Guide

Your backend has been updated to use Vercel Blob for file storage instead of local disk storage. This makes it compatible with serverless deployments like Vercel.

## What Changed

1. **Multer Configuration**: Changed from `diskStorage` to `memoryStorage` to handle files in memory
2. **File Upload**: Files are now uploaded to Vercel Blob instead of local `uploads/` directory
3. **URLs**: File URLs now point to Vercel Blob CDN instead of local paths

## Setup Steps

### 1. Install Vercel Blob (Already Done)
```bash
npm install @vercel/blob
```

### 2. Set up Vercel Blob in your Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database" and select "Blob"
4. Follow the setup wizard
5. Copy the `BLOB_READ_WRITE_TOKEN` from the generated environment variable

### 3. Add Environment Variable

Add this to your `.env` file (create one if it doesn't exist):

```env
# Your existing variables...
MONGODB_URI=your_mongodb_connection_string
PORT=6969
BASE_URL=http://localhost:6969

# Add this new variable
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

### 4. Deploy to Vercel

1. Make sure your `.env` variables are set in Vercel's environment variables section
2. Deploy your project
3. Test file uploads - they should now work on Vercel!

## Important: Serverless Export


```typescript
// ✅ Export the app for Vercel serverless deployment
export default connectDB().then(() => app);
```

This ensures:
- The database connection is established before handling requests
- Vercel can properly route requests to your Express app
- No `app.listen()` is called in production (Vercel handles this)

## Benefits

- ✅ Works with serverless deployments
- ✅ Files are served from a global CDN (faster loading)
- ✅ No need to manage local file storage
- ✅ Automatic scaling
- ✅ Generous free tier

## Testing

Your existing API endpoints work exactly the same way. The only difference is that the returned URLs will now point to Vercel Blob instead of local files.

Example response:
```json
{
  "id": "uuid",
  "title": "Test Issue",
  "images": [
    "https://xyz.vercel-storage.com/image1.jpg"
  ],
  "audio": "https://xyz.vercel-storage.com/audio1.mp3"
}
```
