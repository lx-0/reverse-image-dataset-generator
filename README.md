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
   - Images will be automatically processed using GPT-4 Vision
   - View real-time progress and AI-generated content
   - For each image, the system generates:
     - A detailed recognition description
     - An optimized text-to-image generation prompt
     - Relevant semantic tags for categorization
     - Visual preview with generated content

3. **Dataset Creation and Format**:
   - Review generated descriptions and tags
   - The tool creates a ZIP archive containing:
     - A `dataset.jsonl` file with prompts and metadata
     - An `images` directory with all original images
   
   The JSONL file format follows the standard text-to-image fine-tuning structure:
   ```jsonl
   {"task_type": "text_to_image", "instruction": "Generated prompt", "input_images": [], "output_image": "image_filename.jpg"}
   ```
   
   Each line in the JSONL file corresponds to one image and contains:
   - `task_type`: Always "text_to_image" for this dataset type
   - `instruction`: The AI-generated prompt describing the image
   - `output_image`: The filename of the corresponding image in the images directory

   This format is specifically designed for fine-tuning image generation models like OmniGen, ensuring compatibility with standard training pipelines.

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
