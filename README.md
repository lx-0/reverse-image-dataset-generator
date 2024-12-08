# Reverse Image Dataset Generator

A specialized tool that automates the creation of text-to-image training datasets by performing reverse prompt generation on input images. Using GPT-4 Vision, it analyzes images and generates optimized text-to-image prompts, making it ideal for fine-tuning image generation models like OmniGen. The tool creates standardized datasets that include both the original images and their corresponding generated prompts, streamlining the process of creating high-quality training data.

## Features

- **Automated Prompt Generation**: Leverages GPT-4 Vision to analyze images and generate optimized text-to-image prompts
- **Reverse Engineering Descriptions**: Creates detailed image descriptions suitable for training image generation models
- **Context-Aware Analysis**: Incorporates user-provided context to generate more relevant and specific prompts
- **Batch Processing**: Efficiently handles multiple images simultaneously with real-time progress tracking
- **Smart Tagging System**: Automatically generates relevant tags to enhance dataset organization and searchability
- **Standardized Export**: Creates properly formatted datasets ready for model fine-tuning
- **Interactive Preview**: Visual interface for reviewing generated prompts, descriptions, and tags alongside images
- **JSONL Format**: Exports data in the standard JSONL format required for fine-tuning workflows

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
