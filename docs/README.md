# Reverse Image Dataset Generator Documentation

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Reverse Image Dataset Generator is a tool for creating high-quality training datasets for image generation models. It uses advanced GPT models to analyze images and generate optimized prompts, making it ideal for fine-tuning image generation models.

## Installation

Detailed installation instructions can be found in the [Quick Start Guide](../README.md#-quick-start).

## Usage Guide

### Basic Usage

1. **Start the Application**

   ```bash
   npm run dev
   ```

2. **Upload Images**
   - Use drag & drop or click to upload
   - Supported formats: JPG, PNG, WebP
   - Maximum file size: 10MB per image

3. **Add Context (Optional)**
   - Provide additional context for better prompt generation
   - Example: "These are product photos for an e-commerce site"

4. **Process Images**
   - Click "Process" to start analysis
   - Monitor progress in real-time
   - Review generated prompts and tags

5. **Download Dataset**
   - Click "Download" to get the ZIP file
   - Contains JSONL file and original images
   - Ready for model fine-tuning

### Advanced Features

#### Context Templates

Use predefined context templates for common use cases:

```json
{
  "e-commerce": "Product photos for online store",
  "landscape": "Natural landscape photography",
  "portrait": "Professional portrait photography"
}
```

#### Custom Tags

Add custom tags to supplement auto-generated ones:

```json
{
  "style": ["minimal", "modern", "vintage"],
  "mood": ["happy", "serious", "relaxed"]
}
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| OPENAI_API_KEY | OpenAI API key | Yes | - |
| PORT | Server port | No | 5000 |
| MAX_FILE_SIZE | Max file size (MB) | No | 10 |
| BATCH_SIZE | Processing batch size | No | 5 |

### Model Configuration

Available models and their characteristics:

| Model | Speed | Quality | Use Case |
|-------|--------|----------|-----------|
| gpt-4o-mini | Fast | Good | Rapid prototyping |
| gpt-4o | Medium | Better | Production use |
| gpt-4o-2024-11-20 | Slow | Best | High-quality datasets |

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check file size limits
   - Verify file formats
   - Ensure stable internet connection

2. **Processing Errors**
   - Verify API key validity
   - Check rate limits
   - Ensure sufficient storage space

3. **Download Issues**
   - Clear browser cache
   - Check disk space
   - Try different browser
