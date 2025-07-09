# Painting Enhancement Tool

A mobile-first browser application for enhancing iPhone Pro painting photographs for print-on-demand services.

## Features

- **Step 1**: Image Upload with drag & drop support
- **Step 2**: 5x5 Grid Distortion Correction
- **Step 3**: Advanced Lighting Correction (glare removal, contrast & saturation boost)
- **Step 4**: Auto Color Correction
- **Step 5**: Super Resolution upscaling
- **Step 6**: Download in multiple formats

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Development Server

Start the development server with auto-reload:

```bash
npm run start:dev
```

This will:
- Start a Node.js server on http://localhost:8080
- Watch for changes in `.js`, `.html`, and `.css` files
- Automatically restart the server when files change
- Serve static files with proper MIME types

### Production Server

Start the production server:

```bash
npm start
```

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Image Processing**: OpenCV.js
- **Super Resolution**: UpscalerJS
- **Mobile Optimization**: Responsive design, touch events
- **Development**: Node.js + Express + Nodemon

## File Structure

```
├── css/
│   ├── styles.css      # Main styles
│   └── mobile.css      # Mobile-specific styles
├── js/
│   ├── app.js          # Main application logic
│   ├── image-processor.js  # OpenCV image processing
│   ├── ui-controller.js    # UI management
│   ├── upscaler.js     # Super resolution
│   └── utils.js        # Utility functions
├── opencv.js           # OpenCV.js library
├── index.html          # Main HTML file
├── server.js           # Development server
└── package.json        # npm configuration
```

## Usage

1. Upload an iPhone Pro painting photo
2. Adjust the 5x5 grid to correct lens distortion
3. Use lighting correction to remove glare and enhance contrast
4. Apply auto color correction if needed
5. Generate high-resolution output
6. Download the enhanced image

## Browser Support

- Chrome/Safari (recommended for iPhone compatibility)
- Modern browsers with WebAssembly support
- Mobile browsers (iOS Safari, Chrome Mobile)