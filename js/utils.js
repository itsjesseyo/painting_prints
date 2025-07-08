// Utility functions and helpers

// Memory Management
let matCount = 0; // Track active Mat objects

function cleanupMat(mat) {
    if (mat && typeof mat.delete === 'function' && !mat.isDeleted()) {
        mat.delete();
        matCount--;
        if (matCount < 0) matCount = 0; // Safety check
        log('Mat cleaned up, active Mats:', matCount);
    }
}

function cleanupMats(...mats) {
    mats.forEach(cleanupMat);
}

function createMat(...args) {
    matCount++;
    log('Mat created, active Mats:', matCount);
    return new cv.Mat(...args);
}

function getMatCount() {
    return matCount;
}

function forceGarbageCollection() {
    if (window.gc) {
        window.gc();
        log('Forced garbage collection');
    } else {
        log('Garbage collection not available');
    }
}

// Image Conversion
function fileToCanvas(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Invalid file type'));
            return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

function canvasToBlob(canvas, format = 'image/jpeg', quality = 0.95) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, format, quality);
    });
}

// Validation
function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }
    
    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, HEIC, or WebP.' };
    }
    
    if (file.size > maxSize) {
        return { valid: false, error: 'File too large. Maximum size is 100MB.' };
    }
    
    return { valid: true };
}

// Geometry Utilities
function orderPoints(points) {
    // Order 4 points as: top-left, top-right, bottom-right, bottom-left
    if (points.length !== 4) return points;
    
    // Sort by y-coordinate to get top and bottom pairs
    const sorted = points.sort((a, b) => a.y - b.y);
    const topPair = sorted.slice(0, 2);
    const bottomPair = sorted.slice(2, 4);
    
    // Sort each pair by x-coordinate
    topPair.sort((a, b) => a.x - b.x);
    bottomPair.sort((a, b) => a.x - b.x);
    
    return [
        topPair[0],    // top-left
        topPair[1],    // top-right
        bottomPair[1], // bottom-right
        bottomPair[0]  // bottom-left
    ];
}

function calculateAspectRatio(width, height) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return {
        width: width / divisor,
        height: height / divisor,
        decimal: width / height
    };
}

// Touch/Mouse Event Helpers
function getTouchPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Performance Monitoring
function measurePerformance(name, fn) {
    console.time(name);
    const result = fn();
    console.timeEnd(name);
    return result;
}

// Canvas Size Validation
function validateCanvasSize(width, height) {
    const maxPixels = 16777216; // Safari limit
    const totalPixels = width * height;
    
    if (totalPixels > maxPixels) {
        const scale = Math.sqrt(maxPixels / totalPixels);
        return {
            width: Math.floor(width * scale),
            height: Math.floor(height * scale),
            scaled: true,
            originalWidth: width,
            originalHeight: height
        };
    }
    
    return { width, height, scaled: false };
}

// File Size Estimation
function estimateFileSize(width, height, format) {
    const pixels = width * height;
    let bytesPerPixel;
    
    switch(format) {
        case 'jpeg-95':
            bytesPerPixel = 0.4;
            break;
        case 'jpeg-85':
            bytesPerPixel = 0.2;
            break;
        case 'png':
            bytesPerPixel = 4;
            break;
        default:
            bytesPerPixel = 0.3;
    }
    
    const bytes = pixels * bytesPerPixel;
    const mb = bytes / (1024 * 1024);
    
    return {
        bytes: Math.round(bytes),
        mb: Math.round(mb),
        formatted: mb > 1000 ? `${(mb/1000).toFixed(1)}GB` : `${mb}MB`
    };
}

// Print Size Calculations
function calculatePrintSizes(aspectRatio) {
    const printSizes = [
        { name: "8×10 inches", w: 8, h: 10, dpi: 300 },
        { name: "11×14 inches", w: 11, h: 14, dpi: 300 },
        { name: "16×20 inches", w: 16, h: 20, dpi: 300 },
        { name: "18×24 inches", w: 18, h: 24, dpi: 300 },
        { name: "24×30 inches", w: 24, h: 30, dpi: 300 },
        { name: "30×40 inches", w: 30, h: 40, dpi: 300 }
    ];
    
    return printSizes.map(size => {
        const sizeRatio = size.w / size.h;
        const isGoodFit = Math.abs(aspectRatio - sizeRatio) < 0.2;
        
        return {
            ...size,
            pixelWidth: size.w * size.dpi,
            pixelHeight: size.h * size.dpi,
            aspectRatio: sizeRatio,
            isGoodFit,
            cropNeeded: !isGoodFit
        };
    });
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format file sizes
function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

// Console logging with timestamps
function log(...args) {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`[${timestamp}]`, ...args);
}

function logError(...args) {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.error(`[${timestamp}]`, ...args);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cleanupMat,
        cleanupMats,
        fileToCanvas,
        canvasToBlob,
        validateImageFile,
        orderPoints,
        calculateAspectRatio,
        getTouchPos,
        measurePerformance,
        validateCanvasSize,
        estimateFileSize,
        calculatePrintSizes,
        debounce,
        formatFileSize,
        log,
        logError
    };
}