# OmniGen Dataset Creation Tool

A powerful dataset creation tool for OmniGen fine-tuning, featuring LLM-powered image description generation. This tool helps you create high-quality datasets for image generation models by automatically generating detailed descriptions and tags for your images.

## Features

- **Intelligent Image Analysis**: Uses GPT-4 Vision to generate detailed descriptions and relevant tags for images
- **Context-Aware Processing**: Incorporates user-provided context to generate more relevant descriptions
- **Batch Processing**: Process multiple images simultaneously
- **Real-time Progress Tracking**: Visual feedback on processing status
- **Dataset Export**: Generates standardized datasets ready for fine-tuning
- **Preview Interface**: Visual preview of processed images with their descriptions and tags

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Express.js
- **Styling**: Tailwind CSS + Shadcn UI
- **Image Processing**: Multer for handling file uploads
- **AI Integration**: OpenAI GPT-4 Vision API
- **Build Tool**: Vite

## Prerequisites

Before running the application, make sure you have:
- Node.js (v18 or later)
- NPM (v8 or later)
- An OpenAI API key with GPT-4 Vision access

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
OPENAI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

1. **Upload Images**:
   - Click the upload area or drag and drop images
   - Select multiple images if needed
   - Provide optional context for better descriptions

2. **Processing**:
   - Images will be automatically processed
   - View real-time progress and generated descriptions
   - Each image gets:
     - Detailed description
     - Generation-ready prompt
     - Relevant tags

3. **Dataset Creation**:
   - Review generated descriptions and tags
   - Download the complete dataset as a ZIP file
   - The dataset includes:
     - Original images
     - JSONL file with prompts and metadata

## API Endpoints

### `POST /api/analyze`
Analyzes a single image and generates descriptions.

**Request Body**:
```json
{
  "image": "base64_encoded_image_or_data_url",
  "filename": "image_name.jpg",
  "context": "optional_context_string"
}
```

### `POST /api/process`
Processes multiple images and creates a dataset.

**Request Body**:
- `images`: Array of image files (multipart/form-data)
- `description`: Optional context string
- `analyses`: JSON string of previous analyses

### `GET /api/datasets/:id`
Downloads a processed dataset.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | Your OpenAI API key | Yes |
| PORT | Server port (default: 5000) | No |

## Development

The project follows a modern web application structure:
- `/client`: Frontend React application
- `/server`: Express.js backend
- `/uploads`: Temporary storage for uploads and datasets

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
