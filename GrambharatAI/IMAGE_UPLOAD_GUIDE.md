# Image Upload & Vision AI Feature

## Overview
GramBharat AI now supports image upload and analysis using the Qwen2-VL:2b vision model from Ollama.

## Setup

### 1. Install Qwen2-VL Model
```bash
ollama pull qwen2-vl:2b
```

### 2. Verify Installation
```bash
ollama list
```
You should see `qwen2-vl:2b` in the list.

## Features

### Web App
- Click the image icon (📷) in the chat input
- Select an image (JPEG, PNG, WebP, max 10MB)
- Preview appears above input
- Add optional text prompt or send image alone
- AI analyzes using vision model

### Mobile App
- Tap the image icon in the chat input
- Select from photo library
- Preview appears above input
- Add optional text prompt or send image alone
- AI analyzes using vision model

## How It Works

1. **Image Upload**: Images are uploaded to `/uploads` directory on server
2. **Vision Analysis**: When image is detected, server uses `qwen2-vl:2b` model
3. **Context Integration**: Vision model receives:
   - User's persona/personality
   - Local context (season, location, crop cycle, festival)
   - Saved memories
4. **Response**: AI provides detailed analysis based on image and context

## Use Cases for Rural India

- **Crop Disease Detection**: Upload photos of crops for disease identification
- **Soil Analysis**: Share soil images for quality assessment
- **Document Reading**: Upload government forms, bank documents for help
- **Product Identification**: Identify seeds, fertilizers, equipment
- **Weather Patterns**: Analyze sky/cloud images for weather prediction
- **Livestock Health**: Check animal health through photos

## Technical Details

- **Vision Model**: qwen2-vl:2b (2 billion parameters, optimized for speed)
- **Image Format**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Storage**: Local filesystem (`/uploads` directory)
- **Processing**: Base64 encoding for Ollama API
- **Streaming**: Token-by-token response for smooth UX

## API Endpoints

### Upload Image
```
POST /api/upload-image
Content-Type: multipart/form-data
Body: { image: File }
Response: { success, filename, url, base64 }
```

### Send Message with Image
```
POST /api/chats/:chatId/messages
Body: { message, model, personality, imageData }
```

## Notes

- Images are stored permanently in `/uploads` directory
- Vision model runs locally via Ollama
- No external API calls or data sharing
- Works offline once model is downloaded
