# Reverse Image Dataset Generator 🖼️ → 📝

> Create high-quality training datasets for image generation models by automatically generating optimized prompts from your images using advanced GPT models.

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

<img src="docs/assets/preview.png" alt="Reverse Image Dataset Generator Preview" width="800px" />

</div>

## ✨ Features

- 🤖 **AI-Powered Analysis**: Automatically generate optimized prompts using GPT models
- 🎯 **Context-Aware**: Include custom context to guide prompt generation
- 📦 **Batch Processing**: Handle multiple images simultaneously
- 🏷️ **Smart Tagging**: Auto-generate relevant tags for better organization
- 📤 **Standard Format**: Export datasets in JSONL format ready for fine-tuning
- 👀 **Live Preview**: Real-time visualization of generated prompts and tags
- 🔄 **Progress Tracking**: Monitor batch processing with detailed progress updates

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or later)
- NPM (v8 or later)
- OpenAI API key

### Installation

1. Clone and install dependencies:

```bash
git clone https://github.com/yourusername/reverse-image-dataset-generator.git
cd reverse-image-dataset-generator
npm install
```

2. Set up your environment:

```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:

```env
OPENAI_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5000` to start using the application.

## 💡 Use Cases

### Fine-Tuning Image Generation Models

- Create custom training datasets for models like OmniGen
- Generate high-quality prompts from existing image collections
- Maintain consistency in prompt style across datasets

### Dataset Management

- Convert image libraries into structured training data
- Add context-aware descriptions to image collections
- Generate semantic tags for better organization

### Content Creation

- Generate optimized prompts for existing images
- Create consistent image-prompt pairs
- Build reference libraries for prompt engineering

## 📖 How It Works

1. **Upload Images**
   - Drag & drop or select multiple images
   - Add optional context for better descriptions
   - Preview selected images instantly

2. **AI Processing**
   - Images analyzed by GPT models
   - Context-aware prompt generation
   - Automatic tag extraction
   - Real-time progress tracking

3. **Dataset Creation**
   - JSONL file generation with prompts
   - Original images included
   - ZIP archive for easy download
   - Standard format for fine-tuning

Example output format:

```jsonl
{
  "task_type": "text_to_image",
  "instruction": "a serene landscape with snow-capped mountains reflecting in a crystal-clear lake at sunset",
  "input_images": [],
  "output_image": "mountain_lake.jpg"
}
```

## 🛠️ Technical Details

### Architecture

- **Frontend**: React + TypeScript + Shadcn UI
- **Backend**: Express.js + Multer
- **AI**: OpenAI GPT-4o series models
- **Storage**: File system with organized structure

### Available Models

- `gpt-4o-mini`: Fast, efficient processing
- `gpt-4o`: Balanced performance
- `gpt-4o-2024-11-20`: Latest model with enhanced capabilities

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Next Steps

- [ ] Add user authentication
- [ ] Implement dataset management UI
- [ ] Add advanced image processing options
- [ ] Optimize batch processing
- [ ] Add dataset search and filtering

## 🔗 Links

- [Documentation](docs/README.md)
- [API Reference](docs/api.md)
- [Contributing Guidelines](CONTRIBUTING.md)
