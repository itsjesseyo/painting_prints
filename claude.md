# Painting Photography Enhancement Tool - Development Prompt

## PROJECT OVERVIEW
You are tasked with building a mobile-first browser-based application that enhances iPhone Pro photographs of paintings for print-on-demand services. The tool processes images through a 7-step pipeline to produce print-ready files at 300 DPI up to 30×40 inches.

## TECHNICAL STACK
- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Image Processing**: OpenCV.js (WASM version)
- **Super Resolution**: UpscalerJS (TensorFlow.js)
- **UI Framework**: None (vanilla implementation)
- **Target Platform**: Mobile browsers (Chrome/Safari priority)

## ARCHITECTURE REQUIREMENTS

### File Structure
```
painting-enhancer/
├── index.html
├── css/
│   ├── styles.css
│   └── mobile.css
├── js/
│   ├── app.js (main application)
│   ├── image-processor.js (OpenCV operations)
│   ├── upscaler.js (super-resolution)
│   ├── ui-controller.js (interface management)
│   └── utils.js (utilities and helpers)
├── assets/
│   └── icons/ (UI icons)
└── README.md
```

### Code Organization Principles
- **Modular Design**: Separate concerns into focused modules
- **Memory Management**: Explicit cleanup of OpenCV Mat objects
- **Error Handling**: Comprehensive try-catch with user feedback
- **Progressive Enhancement**: Core functionality first, enhancements second
- **Mobile Optimization**: Touch-friendly, performance-conscious

## DETAILED IMPLEMENTATION REQUIREMENTS

### 1. APPLICATION INITIALIZATION (app.js)
```javascript
class PaintingEnhancer {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 7;
    this.state = {
      originalImage: null,
      processedImage: null,
      settings: {
        lensCorrection: 0,
        perspective: null,
        brightness: 0,
        contrast: 1.0,
        targetSize: null,
        outputFormat: 'jpeg-95'
      }
    };
    this.ui = new UIController();
    this.processor = new ImageProcessor();
    this.upscaler = new SuperResolution();
  }

  async init() {
    // Wait for OpenCV.js to load
    // Initialize UI components
    // Set up event listeners
    // Show upload interface
  }
}
```

### 2. IMAGE PROCESSING MODULE (image-processor.js)
```javascript
class ImageProcessor {
  constructor() {
    this.isOpenCVReady = false;
  }

  // Step 2: Lens Correction
  correctLensDistortion(inputMat, intensity) {
    // Create camera matrix for iPhone Pro typical parameters
    // Define distortion coefficients based on intensity
    // Apply cv.undistort() with manual coefficients
    // Return corrected Mat
  }

  // Step 3: Perspective Correction
  async detectPaintingCorners(inputMat) {
    // Convert to grayscale
    // Apply Gaussian blur
    // Canny edge detection
    // Find contours with cv.findContours()
    // Filter for largest rectangular contour
    // Use cv.approxPolyDP() to get 4 corners
    // Return corner points or null if failed
  }

  applyPerspectiveCorrection(inputMat, corners, targetWidth, targetHeight) {
    // Order corners consistently (top-left, top-right, bottom-right, bottom-left)
    // Create destination points for rectangle
    // Calculate perspective transform with cv.getPerspectiveTransform()
    // Apply transform with cv.warpPerspective()
    // Return corrected Mat
  }

  // Step 4: Glare Removal
  adjustBrightnessContrast(inputMat, brightness, contrast) {
    // Use cv.convertScaleAbs(src, dst, alpha, beta)
    // alpha = contrast value (0.5 to 2.0)
    // beta = brightness value (-100 to +100)
    // Return adjusted Mat
  }

  // Step 5: Auto Color Correction
  autoColorCorrect(inputMat) {
    // Convert to different color spaces as needed
    // Apply histogram equalization
    // Basic white balance adjustment
    // Return color-corrected Mat
  }

  // Utility Functions
  validateCanvasSize(width, height) {
    const maxPixels = 16777216; // Safari limit
    // Return scaled dimensions if needed
  }

  matToCanvas(mat, canvasId) {
    // Convert OpenCV Mat to canvas for display
    // Handle memory cleanup
  }

  canvasToMat(canvasId) {
    // Convert canvas to OpenCV Mat
    // Return Mat object
  }
}
```

### 3. SUPER RESOLUTION MODULE (upscaler.js)
```javascript
class SuperResolution {
  constructor() {
    this.upscaler = null;
  }

  async init() {
    // Initialize UpscalerJS with appropriate model
    this.upscaler = new Upscaler({
      model: 'esrgan-medium', // Balance quality vs speed
    });
  }

  calculateOptimalDimensions(aspectRatio) {
    const printSizes = [
      { name: "8×10 inches", w: 8, h: 10, dpi: 300 },
      { name: "11×14 inches", w: 11, h: 14, dpi: 300 },
      { name: "16×20 inches", w: 16, h: 20, dpi: 300 },
      { name: "18×24 inches", w: 18, h: 24, dpi: 300 },
      { name: "24×30 inches", w: 24, h: 30, dpi: 300 },
      { name: "30×40 inches", w: 30, h: 40, dpi: 300 }
    ];
    
    // Find best fit for aspect ratio
    // Return array of suitable sizes with pixel dimensions
  }

  estimateFileSize(width, height, format) {
    // Estimate output file size based on format
    // JPEG 95%: ~0.3 bytes per pixel
    // PNG: ~4 bytes per pixel
    // Return size in MB
  }

  async upscaleImage(canvas, targetWidth, targetHeight, onProgress) {
    // Use UpscalerJS to process image
    // Handle progress callbacks
    // Return high-resolution canvas
  }
}
```

### 4. UI CONTROLLER MODULE (ui-controller.js)
```javascript
class UIController {
  constructor() {
    this.currentStep = 1;
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupStepNavigation();
  }

  cacheElements() {
    // Cache frequently used DOM elements
    this.elements = {
      stepIndicator: document.getElementById('step-indicator'),
      imageCanvas: document.getElementById('image-canvas'),
      controlsPanel: document.getElementById('controls-panel'),
      nextButton: document.getElementById('next-btn'),
      skipButton: document.getElementById('skip-btn'),
      // ... other elements
    };
  }

  // Step-specific UI builders
  buildStep1UI() {
    // Upload interface with drag-and-drop
    // File validation and preview
  }

  buildStep2UI() {
    // Lens correction slider
    // Before/after toggle
    // Reset button
  }

  buildStep3UI() {
    // Auto-detect button
    // Manual corner adjustment handles
    // Grid overlay toggle
  }

  buildStep4UI() {
    // Brightness slider (-100 to +100)
    // Contrast slider (0.5 to 2.0)
    // Real-time preview
  }

  buildStep5UI() {
    // Auto color correction toggle
    // Intensity slider
  }

  buildStep6UI() {
    // Print size dropdown
    // Dimension display
    // File size estimate
    // Generate button with warning
  }

  buildStep7UI() {
    // Format selection
    // Download button
    // Progress indicator
  }

  // Navigation and State Management
  goToStep(stepNumber) {
    // Update UI for specific step
    // Show/hide appropriate controls
    // Update progress indicator
  }

  showProgress(message, percentage) {
    // Display progress bar and message
  }

  showError(message, canRetry = false) {
    // Display error toast with retry option
  }

  showSuccess(message) {
    // Display success notification
  }
}
```

### 5. UTILITY FUNCTIONS (utils.js)
```javascript
// Memory Management
function cleanupMat(mat) {
  if (mat && !mat.isDeleted()) {
    mat.delete();
  }
}

function cleanupMats(...mats) {
  mats.forEach(cleanupMat);
}

// Image Conversion
function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    // Convert File object to canvas
  });
}

function canvasToBlob(canvas, format, quality) {
  return new Promise((resolve) => {
    // Convert canvas to downloadable blob
  });
}

// Validation
function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/heic'];
  const maxSize = 100 * 1024 * 1024; // 100MB
  // Return validation result
}

// Geometry Utilities
function orderPoints(points) {
  // Order 4 points as: top-left, top-right, bottom-right, bottom-left
  // Return ordered array
}

function calculateAspectRatio(width, height) {
  // Return simplified aspect ratio
}

// Touch/Mouse Event Helpers
function getTouchPos(canvas, e) {
  // Get touch position relative to canvas
  // Handle both touch and mouse events
}

// Performance Monitoring
function measurePerformance(name, fn) {
  // Wrapper for performance measurement
  console.time(name);
  const result = fn();
  console.timeEnd(name);
  return result;
}
```

### 6. HTML STRUCTURE (index.html)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painting Enhancer</title>
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/mobile.css">
</head>
<body>
    <!-- Step Progress Indicator -->
    <header id="step-indicator">
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <p class="step-text">Step 1 of 7: Upload Image</p>
    </header>

    <!-- Main Canvas Area -->
    <main id="main-content">
        <canvas id="image-canvas"></canvas>
        <div id="preview-controls">
            <button id="before-after-toggle">Before/After</button>
        </div>
    </main>

    <!-- Controls Panel -->
    <section id="controls-panel">
        <!-- Dynamic content based on current step -->
    </section>

    <!-- Navigation -->
    <footer id="navigation">
        <button id="skip-btn">Skip</button>
        <button id="apply-btn" class="primary">Apply</button>
        <button id="next-btn" class="primary">Next</button>
    </footer>

    <!-- Loading Overlay -->
    <div id="loading-overlay" class="hidden">
        <div class="spinner"></div>
        <p id="loading-message">Processing...</p>
    </div>

    <!-- Error Toast -->
    <div id="error-toast" class="hidden">
        <p id="error-message"></p>
        <button id="error-close">×</button>
    </div>

    <!-- Scripts -->
    <script src="https://docs.opencv.org/4.x/opencv.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/image-processor.js"></script>
    <script src="js/upscaler.js"></script>
    <script src="js/ui-controller.js"></script>
    <script src="js/app.js"></script>
    <script>
        // Initialize app when OpenCV is ready
        window.onOpenCvReady = function() {
            const app = new PaintingEnhancer();
            app.init();
        };
    </script>
</body>
</html>
```

### 7. CSS REQUIREMENTS (styles.css)

#### Mobile-First Responsive Design
```css
/* Base mobile styles */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

/* Step Progress */
#step-indicator {
    background: white;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.progress-bar {
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #007AFF;
    transition: width 0.3s ease;
}

/* Main Canvas Area */
#main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow: hidden;
}

#image-canvas {
    max-width: 100%;
    max-height: 70vh;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* Controls Panel */
#controls-panel {
    background: white;
    padding: 1rem;
    border-top: 1px solid #e0e0e0;
    min-height: 120px;
}

/* Touch-Friendly Controls */
input[type="range"] {
    width: 100%;
    height: 44px; /* iOS touch target */
    margin: 0.5rem 0;
}

button {
    min-height: 44px;
    padding: 0 1rem;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

button.primary {
    background: #007AFF;
    color: white;
}

button.primary:hover {
    background: #0056CC;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Navigation */
#navigation {
    background: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-top: 1px solid #e0e0e0;
}

#navigation button {
    flex: 1;
}

/* Loading and Error States */
#loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 1000;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255,255,255,0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

#error-toast {
    position: fixed;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    background: #FF3B30;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    z-index: 1001;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
}

.hidden {
    display: none !important;
}

/* Step-Specific Styles */
.upload-area {
    border: 2px dashed #007AFF;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.upload-area:hover {
    background: rgba(0, 122, 255, 0.1);
}

.corner-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    background: #007AFF;
    border: 2px solid white;
    border-radius: 50%;
    cursor: grab;
    transform: translate(-50%, -50%);
    z-index: 10;
}

.corner-handle:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.2);
}
```

## IMPLEMENTATION REQUIREMENTS

### Memory Management (Critical)
```javascript
// Always clean up OpenCV Mats
function processImage(inputMat) {
    let outputMat = new cv.Mat();
    let tempMat = new cv.Mat();
    
    try {
        // Processing logic here
        cv.someOperation(inputMat, tempMat);
        cv.anotherOperation(tempMat, outputMat);
        
        return outputMat.clone(); // Return a copy
    } finally {
        // Cleanup temporary matrices
        outputMat.delete();
        tempMat.delete();
    }
}
```

### Error Handling Pattern
```javascript
async function processStep(stepName, processingFunction) {
    try {
        ui.showProgress(`Processing ${stepName}...`, 0);
        
        const result = await processingFunction();
        
        ui.showProgress(`${stepName} complete`, 100);
        return result;
        
    } catch (error) {
        console.error(`Error in ${stepName}:`, error);
        ui.showError(`Failed to ${stepName.toLowerCase()}. Please try again.`, true);
        throw error;
    }
}
```

### Performance Considerations
- **Debounce slider updates** to prevent excessive processing
- **Use requestAnimationFrame** for smooth UI updates
- **Implement progressive image scaling** for large inputs
- **Add memory usage monitoring** and warnings
- **Cache intermediate results** when possible

### Browser Compatibility
- **Test WebAssembly support** before loading OpenCV.js
- **Provide fallbacks** for unsupported features
- **Handle touch and mouse events** for cross-device support
- **Validate File API** capabilities

## TESTING REQUIREMENTS

### Functional Testing
1. **Each step works independently** and can be skipped
2. **Navigation works** in both directions (back/forward)
3. **Memory cleanup** prevents browser crashes
4. **File upload/download** works correctly
5. **Error recovery** allows retry without restart

### Performance Testing
1. **Load time** under 5 seconds on mobile
2. **Processing time** reasonable for each step
3. **Memory usage** stays within browser limits
4. **UI responsiveness** during heavy processing

### Device Testing
1. **iPhone 12+ Safari** (primary target)
2. **Android Chrome** (secondary)
3. **iPad Safari** (secondary)
4. **Desktop browsers** (tertiary)

## DEPLOYMENT CHECKLIST

### Pre-deployment
- [ ] All libraries load from CDN
- [ ] HTTPS required for production
- [ ] Service worker for offline capability (optional)
- [ ] Error tracking implementation
- [ ] Performance monitoring

### Production Configuration
- [ ] Minify CSS and JavaScript
- [ ] Optimize images and assets
- [ ] Configure proper CORS headers
- [ ] Add analytics tracking
- [ ] Set up monitoring and alerts

## SUCCESS CRITERIA

### Functional Requirements
- [ ] Complete 7-step workflow functions end-to-end
- [ ] All image processing steps produce expected results
- [ ] Mobile interface is intuitive and responsive
- [ ] Error handling provides meaningful feedback
- [ ] Memory management prevents crashes

### Performance Requirements
- [ ] App loads in under 5 seconds on mobile
- [ ] Each processing step completes in under 30 seconds
- [ ] UI remains responsive during processing
- [ ] Generated files meet quality standards for printing
- [ ] File sizes are reasonable for mobile download

### Quality Requirements
- [ ] Output images suitable for 300 DPI printing
- [ ] Color accuracy preserved through processing
- [ ] No visual artifacts in final output
- [ ] Professional print quality achieved

Begin implementation with the core application structure (app.js) and basic UI, then implement each processing step incrementally. Focus on mobile performance and user experience throughout development.