# API Reference

## Endpoints

### Image Analysis

#### `POST /api/analyze`

Analyzes a single image and generates optimized prompts.

**Request Body:**

```json
{
  "image": "base64_encoded_image_data",
  "filename": "example.jpg",
  "context": "Optional context string",
  "model": "gpt-4o"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "imageRecognitionDescription": "A detailed description of the image",
    "imageGenerationPrompt": "Optimized prompt for generation",
    "imageTags": ["tag1", "tag2", "tag3"]
  },
  "metadata": {
    "model": "gpt-4o",
    "prompt": "Original prompt used",
    "temperature": 0.7,
    "seed": 42
  }
}
```

### Batch Processing

#### `POST /api/process`

Processes multiple images and creates a dataset.

**Request Body (multipart/form-data):**
- `images[]`: Array of image files
- `context`: Optional context string
- `model`: Model name
- `analyses`: JSON string containing previous analyses

**Response:**

```json
{
  "success": true,
  "message": "Dataset processed successfully",
  "datasetId": "timestamp_based_id"
}
```

### Dataset Download

#### `GET /api/datasets/:id`

Downloads a processed dataset.

**Parameters:**
- `id`: Dataset ID (timestamp)

**Response:**
- ZIP file containing:
    - `dataset.jsonl`
    - Original images

## Error Handling

All endpoints return error responses in the following format:

```json
{
  "error": "Error type",
  "details": "Detailed error message"
}
```

Common HTTP status codes:
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per API key

## Examples

### cURL

```bash
# Analyze single image
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_image_data",
    "filename": "test.jpg",
    "context": "Product photo",
    "model": "gpt-4o"
  }'

# Process multiple images
curl -X POST http://localhost:5000/api/process \
  -F "images[]=@image1.jpg" \
  -F "images[]=@image2.jpg" \
  -F "context=Product photos" \
  -F "model=gpt-4o"

# Download dataset
curl -O http://localhost:5000/api/datasets/1234567890
```

### JavaScript

```typescript
// Analyze image
const analyzeImage = async (imageData: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageData,
      filename: 'example.jpg',
      context: 'Product photo',
      model: 'gpt-4o'
    })
  });
  return response.json();
};

// Process multiple images
const processImages = async (formData: FormData) => {
  const response = await fetch('/api/process', {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```
