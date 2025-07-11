# Paint2Print - AI Photo Enhancement

A Progressive Web App for enhancing painting photographs for print-on-demand services using advanced AI upscaling technology.

## ✨ Features

### 🎯 **5-Step Enhancement Pipeline**
- **Step 1**: Image Upload with drag & drop support
- **Step 2**: Grid-based distortion correction
- **Step 3**: Advanced color correction (lighting, contrast, saturation)
- **Step 4**: Multi-pass AI upscaling with optimal scale factor selection
- **Step 5**: Download in multiple formats for print

### 🤖 **Advanced AI Upscaling**
- **Multi-model support**: 2x, 3x, and 4x ESRGAN Thick models
- **Intelligent pass planning**: Automatically selects optimal scaling combinations
- **High-quality output**: Up to 30×40 inches at 300 DPI
- **WebGL optimization**: Handles large images without memory issues

### 📱 **Progressive Web App**
- **Desktop installation**: 1200×900 standalone app window
- **Offline capability**: Works without internet after first load
- **Auto-updates**: Automatic version detection and update prompts
- **Cross-platform**: Windows, Mac, Linux support via modern browsers

## 🚀 Installation & Usage

### Web Browser Access
1. Visit the application URL in your browser
2. Use directly in-browser with full functionality

### PWA Desktop Installation
1. Visit the site in Chrome, Edge, or other PWA-supporting browser
2. Click the "Install App" button in the purple banner
3. App installs as a 1200×900 desktop application
4. Launch from desktop/start menu like a native app

## 📋 How to Use

1. **Upload Photo**: Drag & drop or click to select your painting photograph
2. **Grid Correction**: Drag grid points to correct any lens distortion
3. **Color Enhancement**: Adjust lighting, contrast, and saturation with real-time preview
4. **AI Upscaling**: Select target print size and generate high-resolution output
5. **Download**: Choose format (JPEG/PNG) and download print-ready file

### Print Sizes Supported
- 8×10 inches (2400×3000px)
- 11×14 inches (3300×4200px)  
- 16×20 inches (4800×6000px)
- 18×24 inches (5400×7200px)
- 24×30 inches (7200×9000px)
- 30×40 inches (9000×12000px)

## ⚙️ Technical Details

### Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3
- **Image Processing**: OpenCV.js (WebAssembly)
- **AI Upscaling**: UpscalerJS + TensorFlow.js with ESRGAN Thick models
- **PWA**: Service Worker, Web App Manifest
- **Styling**: Mobile-first responsive design

### File Structure
```
paint2print/
├── css/
│   ├── styles.css          # Main application styles
│   └── mobile.css          # Mobile-responsive styles
├── js/
│   ├── app.js              # Core application logic
│   ├── image-processor.js   # OpenCV image processing
│   ├── upscaler.js         # Multi-pass AI upscaling
│   ├── ui-controller.js    # User interface management
│   ├── utils.js            # Utility functions
│   └── pwa-install.js      # PWA installation logic
├── assets/
│   ├── icon-192.svg        # PWA icons
│   ├── icon-512.svg
│   └── icon-1024.svg
├── index.html              # Main application
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for caching
└── opencv.js              # OpenCV.js library
```

## 🔧 Development

### Prerequisites
- Node.js (v14 or higher) - for local development server only
- Modern browser with WebAssembly support

### Local Development
```bash
# Install dependencies (optional - for development server)
npm install

# Start development server
npm run start:dev
# Serves on http://localhost:8080 with auto-reload

# Or use any static file server
python -m http.server 8000
# Serves on http://localhost:8000
```

### Deployment
Deploy static files to any web server. Works perfectly with:
- GitHub Pages
- Cloudflare Pages  
- Netlify
- Any static hosting service

## 🔄 Version Management (For Developers)

### Releasing Updates
When deploying a new version that should force cache updates:

1. **Update version** in `service-worker.js`:
   ```javascript
   const APP_VERSION = '1.1.0'; // Increment this number
   ```

2. **Deploy** to your hosting service (GitHub → Cloudflare Pages, etc.)

3. **Users get notified**: Installed PWAs automatically detect the update and show notification

### Testing Updates Locally
1. Make code changes
2. Update `APP_VERSION` in service-worker.js
3. Refresh browser (not PWA) to trigger update detection
4. Update notification should appear

## 🌐 Browser Support

### Recommended
- **Chrome 88+** (Full PWA support)
- **Edge 88+** (Full PWA support)
- **Safari 14+** (Limited PWA support)

### Requirements
- WebAssembly support (for OpenCV.js)
- ES6+ JavaScript support
- Canvas API
- Service Worker support (for PWA features)

### Mobile Support
- iOS Safari 14+
- Chrome Mobile 88+
- Modern Android browsers

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]

---

**Paint2Print** - Transform your painting photos into professional print-ready files with AI-powered enhancement.