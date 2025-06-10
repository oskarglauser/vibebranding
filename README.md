# GoLogotype - Professional Logo Generator

A modern, professional logo generator that creates true vector SVG files with outlined font paths. Perfect for startups, agencies, and creative professionals who need high-quality brand assets quickly and efficiently.

## Features

- **True Vector Output**: Export genuine vector SVG files with outlined font paths - not embedded text
- **Professional Quality**: High-resolution PNG files with transparent backgrounds
- **Multiple Formats**: PNG and SVG files with various background options
- **Google Fonts Integration**: Choose from premium Google Fonts
- **Brand Package Downloads**: Complete brand packages with guidelines
- **Trademark Support**: Add ™, ®, or © symbols with proper positioning
- **Real-time Preview**: Live font preview with adjustable spacing and weight
- **CMYK Color Conversion**: Automatic RGB to CMYK conversion for print specifications

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn/ui components
- **Font Processing**: OpenType.js for vector path generation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/oskarglauser/vibebranding.git

# Navigate to project directory
cd vibebranding

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
vibebranding/
├── src/
│   ├── components/ui/     # Reusable UI components
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── vector-api/           # Font-to-vector conversion API
├── server/               # Alternative server implementation
└── public/               # Static assets
```

## API Endpoints

The project includes multiple API implementations for font-to-vector conversion:

- `vector-api/api/convert.js` - Main conversion endpoint
- `gologotype-api/api/font-to-path.js` - Alternative implementation
- `server/` - Express.js server option

## Brand Package Contents

When users download a brand package, they receive:

- **PNG Files**: High-resolution raster graphics for presentations and documents
- **SVG Files**: Scalable vector graphics for web and print
- **Brand Info**: Simple text file with specifications and usage guidelines
- **Color Specifications**: RGB and CMYK color values for consistent branding

## Color Conversion

The application automatically converts RGB colors to CMYK for print specifications:

- **RGB**: Used for digital applications (web, mobile, digital displays)
- **CMYK**: Provided for print applications (business cards, brochures, signage)

Example conversion for a brand color `#3B82F6`:
- **RGB**: rgb(59, 130, 246)
- **CMYK**: C76 M47 Y0 K4

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch.

### Environment Setup

1. Connect your GitHub repository to Vercel
2. Configure custom domain (if applicable)
3. Set up environment variables if needed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Credits

**Created by [Glauser Creative](https://glauser.com)**

Professional branding and design services for startups and established companies. Visit [glauser.com](https://glauser.com) for custom branding solutions.