# Painting Photography Enhancement Tool
## Standard Operating Procedure & Technical Architecture

### **Project Overview**
A browser-based mobile-first application for enhancing iPhone Pro photographs of paintings for print-on-demand services. Processes images through a 7-step pipeline to produce print-ready files at 300 DPI up to 30×40 inches.

---

## **1. WORKFLOW PIPELINE**

### **Step 1: Image Upload**
- **Input**: iPhone Pro photograph (any format/resolution)
- **Process**: File validation and loading
- **Output**: Loaded image ready for processing
- **UI**: Drag-and-drop or file picker interface

### **Step 2: Lens Correction (Optional)**
- **Input**: Raw photograph
- **Process**: Barrel distortion correction using OpenCV.js
- **Implementation**: `cv.undistort()` with manually defined distortion coefficients
- **UI**: Slider for distortion intensity (-1.0 to +1.0)
- **Output**: Distortion-corrected image

### **Step 3: Perspective Correction**
- **Input**: Lens-corrected image
- **Process**: 
  - **Primary**: Automatic edge detection → contour detection → 4-corner identification
  - **Fallback**: Manual corner selection interface
- **Implementation**: 
  - Auto: Canny edge detection + `cv.findContours()` + `cv.approxPolyDP()`
  - Manual: Touch/click interface for corner selection
  - Transform: `cv.getPerspectiveTransform()` + `cv.warpPerspective()`
- **UI**: 
  - Automatic detection with override button
  - Manual corner adjustment handles
  - Preview with before/after toggle
- **Output**: Perspective-corrected rectangular painting

### **Step 4: Glare Removal (Optional)**
- **Input**: Perspective-corrected image
- **Process**: Global brightness/contrast adjustment
- **Implementation**: `cv.convertScaleAbs(src, dst, alpha, beta)`
- **UI**: 
  - Brightness slider (-100 to +100)
  - Contrast slider (0.5 to 2.0)
  - Before/after preview toggle
- **Output**: Glare-reduced image
- **Note**: Advanced lighting correction deferred to future version

### **Step 5: Auto Color Correction (Optional)**
- **Input**: Glare-corrected image
- **Process**: Basic color balance and contrast enhancement
- **Implementation**: 
  - Histogram equalization: `cv.equalizeHist()`
  - White balance adjustment
  - Contrast normalization
- **UI**: Toggle on/off with intensity slider
- **Output**: Color-corrected image

### **Step 6: Super Resolution**
- **Input**: Processed image + target dimensions
- **Process**: AI upscaling to print resolution
- **Implementation**: UpscalerJS (TensorFlow.js ESRGAN models)
- **Workflow**:
  1. Calculate optimal dimensions from aspect ratio
  2. Display size options (8×10 to 30×40 inches)
  3. Show file size estimates
  4. User confirms with "Generate High-Resolution" button
  5. Process with progress indicator
- **UI**:
  - Dropdown with print sizes and DPI info
  - File size warnings for large outputs
  - Progress bar during processing
  - Cancel option for long operations
- **Output**: High-resolution image at 300 DPI

### **Step 7: Download**
- **Input**: High-resolution processed image
- **Process**: Format conversion and optimization
- **Implementation**: Canvas to Blob conversion
- **Formats**:
  - **Default**: JPEG 95% quality (~20-30MB)
  - **Premium**: PNG lossless (~200-400MB)
- **UI**: 
  - Format selection dropdown
  - File size estimates
  - Download progress indicator
- **Output**: Print-ready file

---

## **2. TECHNICAL REQUIREMENTS**

### **Core Technologies**
- **OpenCV.js**: Image processing pipeline (steps 1-5)
- **UpscalerJS**: Super-resolution (step 6)
- **HTML5 Canvas**: Image rendering and manipulation
- **Vanilla JavaScript**: Core application logic
- **CSS3**: Mobile-first responsive design

### **Browser Support**
- **Primary**: Chrome/Safari on mobile devices
- **Secondary**: Desktop browsers
- **Requirements**:
  - WebAssembly support (for OpenCV.js)
  - Canvas 2D context
  - File API support
  - IndexedDB for temporary storage

### **Performance Constraints**
- **Target Platform**: iPhone Pro browsers
- **Canvas Limits**: 
  - Safari: 16.7M pixels maximum
  - Chrome: 268M pixels maximum
- **Memory Management**:
  - Explicit Mat cleanup: `mat.delete()`
  - Progressive processing for large images
  - Garbage collection triggers
- **File Size Limits**:
  - Input: No artificial limits (browser dependent)
  - Processing: Monitor memory usage
  - Output: Warn users about large files

### **Library Versions & CDNs**
```html
<!-- OpenCV.js -->
<script src="https://docs.opencv.org/4.x/opencv.js"></script>

<!-- UpscalerJS -->
<script src="https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js"></script>
```

---

## **3. USER INTERFACE SPECIFICATIONS**

### **Design Principles**
- **Mobile-First**: Optimized for vertical phone orientation
- **Progressive Enhancement**: Works on basic devices, enhanced on capable ones
- **Step-by-Step**: Clear workflow with progress indication
- **Non-Destructive**: All edits are optional and reversible

### **Screen Layout**
```
┌─────────────────────┐
│   Step Progress     │ ← 1/7, 2/7, etc.
├─────────────────────┤
│                     │
│   Image Preview     │ ← Main canvas area
│                     │
├─────────────────────┤
│   Controls Panel    │ ← Step-specific controls
├─────────────────────┤
│ [Skip] [Apply] [→]  │ ← Navigation buttons
└─────────────────────┘
```

### **Control Specifications**

#### **Step 2: Lens Correction**
- Distortion slider with live preview
- Reset button
- Before/after toggle button

#### **Step 3: Perspective Correction**
- Auto-detect with manual override
- Corner adjustment handles (draggable points)
- Grid overlay for alignment reference

#### **Step 4: Glare Removal**
- Brightness: Range slider (-100 to +100)
- Contrast: Range slider (0.5 to 2.0)
- Real-time preview updates

#### **Step 6: Super Resolution**
- Dropdown: Print size selection
- Display: Target pixel dimensions
- Display: Estimated file size
- Warning: Large file size alerts
- Button: "Generate High-Resolution" (prominent)

#### **Step 7: Download**
- Format selection: JPEG 95% (default) | PNG Lossless
- File size estimate display
- Download button with progress bar

### **Error Handling UI**
- Toast notifications for errors
- Graceful fallbacks for unsupported features
- "Try Again" options for failed operations
- Memory warning dialogs

---

## **4. TECHNICAL IMPLEMENTATION DETAILS**

### **Memory Management Strategy**
```javascript
// Explicit cleanup pattern
function processStep(inputMat) {
  let outputMat = new cv.Mat();
  try {
    // Processing logic
    cv.someOperation(inputMat, outputMat);
    return outputMat.clone();
  } finally {
    outputMat.delete();
  }
}
```

### **Canvas Size Validation**
```javascript
function validateCanvasSize(width, height) {
  const maxPixels = 16777216; // Safari limit
  const totalPixels = width * height;
  
  if (totalPixels > maxPixels) {
    const scale = Math.sqrt(maxPixels / totalPixels);
    return {
      width: Math.floor(width * scale),
      height: Math.floor(height * scale),
      scaled: true
    };
  }
  return { width, height, scaled: false };
}
```

### **Progressive Image Processing**
```javascript
// For large images, process in tiles
function processTiled(image, processFunction, tileSize = 1024) {
  // Split image into overlapping tiles
  // Process each tile independently
  // Stitch results back together
}
```

### **State Management**
```javascript
const AppState = {
  currentStep: 1,
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
```

---

## **5. ERROR HANDLING & EDGE CASES**

### **Common Failure Scenarios**
1. **Memory Exhaustion**: Large images exceed browser limits
2. **Processing Timeouts**: Super-resolution on large images
3. **Invalid Inputs**: Corrupted or unsupported image formats
4. **Canvas Limits**: Images too large for browser canvas
5. **Network Issues**: CDN failures for library loading

### **Mitigation Strategies**
1. **Graceful Degradation**: Reduce image size automatically
2. **Progress Monitoring**: Allow cancellation of long operations
3. **Input Validation**: Check file types and sizes upfront
4. **Fallback Paths**: Alternative processing methods
5. **Offline Capability**: Cache critical libraries

### **User Feedback Systems**
- Loading indicators for all processing steps
- Error messages with suggested solutions
- Progress bars for time-intensive operations
- Success confirmations with file details

---

## **6. PERFORMANCE OPTIMIZATION**

### **Processing Optimizations**
- **Lazy Loading**: Load libraries only when needed
- **Image Scaling**: Process at optimal resolution, scale up final output
- **Memory Pooling**: Reuse Mat objects where possible
- **Web Workers**: Offload heavy processing (where supported)

### **UI Optimizations**
- **Responsive Images**: Scale preview images for display
- **Debounced Updates**: Limit real-time preview updates
- **Progressive Enhancement**: Basic functionality first
- **Caching**: Store intermediate results

### **Mobile-Specific Optimizations**
- **Touch-Friendly Controls**: Large tap targets
- **Reduced Animations**: Preserve battery life
- **Memory Warnings**: Alert before large operations
- **Background Processing**: Prevent app termination

---

## **7. QUALITY ASSURANCE**

### **Testing Requirements**
1. **Cross-Browser**: Chrome, Safari (primary focus)
2. **Cross-Device**: iPhone 12+, iPad, Android tablets
3. **Image Formats**: JPEG, PNG, HEIC support
4. **Size Ranges**: Small (1MP) to large (50MP) inputs
5. **Edge Cases**: Corrupted files, extreme aspect ratios

### **Performance Benchmarks**
- **Load Time**: < 3 seconds for library initialization
- **Processing Time**: < 30 seconds per step on iPhone 14
- **Memory Usage**: < 1GB peak during super-resolution
- **File Generation**: < 60 seconds for 30×40 inch output

### **Quality Metrics**
- **Visual Quality**: No artifacts in print-ready outputs
- **Color Accuracy**: Preserve painting color fidelity
- **Resolution**: Sharp details at 300 DPI print resolution
- **File Size**: Reasonable download sizes for mobile

---

## **8. DEPLOYMENT CONSIDERATIONS**

### **Hosting Requirements**
- **Static Hosting**: No server-side processing required
- **CDN**: Fast delivery of large JavaScript libraries
- **HTTPS**: Required for camera access and modern APIs
- **Service Worker**: Optional for offline capability

### **Browser Compatibility**
- **WebAssembly**: Required for OpenCV.js
- **Modern JavaScript**: ES6+ features
- **Canvas API**: 2D context with large canvas support
- **File API**: Upload and download functionality

### **Security Considerations**
- **Client-Side Only**: No server uploads required
- **CORS Policy**: Handle cross-origin image loading
- **Memory Safety**: Prevent DoS through large images
- **Input Validation**: Sanitize all user inputs

---

## **9. FUTURE ENHANCEMENTS**

### **Phase 2 Features**
- **Advanced Lighting Correction**: Neural network APIs
- **Batch Processing**: Multiple images simultaneously
- **Cloud Storage**: Save/load projects
- **Print Service Integration**: Direct upload to POD services

### **Phase 3 Features**
- **Real-Time Preview**: Live camera correction
- **Template System**: Saved settings for different painting types
- **Advanced Color Management**: ICC profile support
- **Professional Tools**: Curves, levels, selective color

### **Technical Debt**
- **Library Updates**: Keep OpenCV.js and UpscalerJS current
- **Performance Monitoring**: Add analytics for optimization
- **Error Tracking**: Implement crash reporting
- **User Feedback**: In-app feedback system

---

This SOP serves as the comprehensive foundation for implementation, covering all technical requirements, user experience specifications, and quality standards for the painting photography enhancement tool.