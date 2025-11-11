# Audio Transcription Setup Guide

## Problem
If you see the error "Audio recorded — transcription unavailable" or "Google API key not configured", it means the transcription service is not configured.

## Solution

To enable audio transcription, you need to configure at least one of the following services:

### Option 1: Google Cloud Speech-to-Text (Recommended)

1. **Get a Google Cloud API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Cloud Speech-to-Text API"
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

2. **Set the Environment Variable:**
   - Create a `.env` file in the root of your project (if it doesn't exist)
   - Add the following line:
     ```
     VITE_GOOGLE_SPEECH_API_KEY=your_api_key_here
     ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Option 2: Azure Speech Services (Fallback)

1. **Get Azure Speech Services Keys:**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Create a new "Speech Services" resource
   - Go to "Keys and Endpoint" in your resource
   - Copy your key and region (e.g., "eastus", "westus2")

2. **Set the Environment Variables:**
   - Add to your `.env` file:
     ```
     VITE_AZURE_SPEECH_KEY=your_azure_key_here
     VITE_AZURE_SPEECH_REGION=your_azure_region_here
     ```

3. **Restart your development server**

### Option 3: Both Services (Best for Reliability)

Configure both Google and Azure for automatic fallback if one service fails.

## Environment Variables Reference

Add these to your `.env` file:

```env
# Google Cloud Speech-to-Text (Primary)
VITE_GOOGLE_SPEECH_API_KEY=your_google_api_key_here
VITE_GOOGLE_PROJECT_ID=your_project_id_here  # Optional
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com  # Optional

# Azure Speech Services (Fallback)
VITE_AZURE_SPEECH_KEY=your_azure_key_here
VITE_AZURE_SPEECH_REGION=your_azure_region_here  # e.g., "eastus", "westus2"
```

## Supported Languages

The transcription service supports:
- English (en-IN)
- Hindi (hi-IN)
- Kannada (kn-IN)
- Tamil (ta-IN)
- Telugu (te-IN)
- Auto-detect (auto)

## Troubleshooting

1. **Check your console logs:**
   - Open browser DevTools (F12)
   - Look for error messages in the Console tab
   - The improved error messages will guide you on what's missing

2. **Verify your API key:**
   - Make sure there are no extra spaces in your `.env` file
   - Restart your dev server after adding environment variables
   - Check that the API key is valid and has the correct permissions

3. **Test the configuration:**
   - Record a short audio response
   - Check the browser console for any error messages
   - If transcription still fails, check the error message for specific guidance

## Notes

- The `.env` file should be in the root directory of your project
- Never commit your `.env` file to version control (it should be in `.gitignore`)
- Environment variables starting with `VITE_` are exposed to the browser, so be careful with sensitive keys
- For production, set these environment variables in your hosting platform (Vercel, Netlify, etc.)

