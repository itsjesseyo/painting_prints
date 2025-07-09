class SuperResolution {
    constructor() {
        this.upscaler = null;
        this.isReady = false;
        this.webglFailed = false;
        this.models = {
            'esrgan-medium-x2': {
                name: 'ESRGAN Medium 2x',
                scale: 2,
                quality: 'balanced',
                path: 'models/esrgan-medium/x2/model.json'
            },
            'esrgan-medium-x3': {
                name: 'ESRGAN Medium 3x',
                scale: 3,
                quality: 'balanced',
                path: 'models/esrgan-medium/x3/model.json'
            },
            'esrgan-medium-x4': {
                name: 'ESRGAN Medium 4x',
                scale: 4,
                quality: 'balanced',
                path: 'models/esrgan-medium/x4/model.json'
            },
            'esrgan-medium-x8': {
                name: 'ESRGAN Medium 8x',
                scale: 8,
                quality: 'high',
                path: 'models/esrgan-medium/x8/model.json'
            }
        };
    }

    async init() {
        log('Initializing reliable canvas-based upscaler...');
        
        // Always ready since we're using simple canvas-based resizing
        // No WebGL models to load, no TensorFlow.js dependencies
        this.isReady = true;
        log('Canvas-based upscaler initialized successfully');
        return true;
    }

    async switchModel(modelId) {
        log('Switching to model:', modelId);
        
        if (!this.models[modelId]) {
            logError('Model not found:', modelId);
            return false;
        }

        try {
            this.currentModel = modelId;
            this.upscaler = new Upscaler({
                model: {
                    path: this.models[modelId].path,
                    scale: this.models[modelId].scale
                }
            });

            log('Successfully switched to model:', modelId);
            return true;
            
        } catch (error) {
            logError('Failed to switch model:', error);
            return false;
        }
    }

    selectOptimalModel(requiredScale) {
        // Find the best model for the required scale
        const availableScales = Object.keys(this.models)
            .map(key => ({ key, scale: this.models[key].scale }))
            .sort((a, b) => a.scale - b.scale);

        // Find the smallest scale that can handle the requirement
        let bestModel = availableScales[availableScales.length - 1]; // Default to largest
        
        for (const model of availableScales) {
            if (model.scale >= requiredScale) {
                bestModel = model;
                break;
            }
        }

        return bestModel.key;
    }

    calculateOptimalDimensions(inputWidth, inputHeight, targetSize) {
        const aspectRatio = inputWidth / inputHeight;
        
        const printSizes = {
            '8x10': { w: 2400, h: 3000 },
            '11x14': { w: 3300, h: 4200 },
            '16x20': { w: 4800, h: 6000 },
            '18x24': { w: 5400, h: 7200 },
            '24x30': { w: 7200, h: 9000 },
            '30x40': { w: 9000, h: 12000 }
        };
        
        const target = printSizes[targetSize];
        if (!target) {
            return { width: inputWidth, height: inputHeight };
        }
        
        // Calculate dimensions maintaining aspect ratio
        const targetRatio = target.w / target.h;
        
        let finalWidth, finalHeight;
        
        if (Math.abs(aspectRatio - targetRatio) < 0.1) {
            // Aspect ratios are close, use target dimensions
            finalWidth = target.w;
            finalHeight = target.h;
        } else if (aspectRatio > targetRatio) {
            // Input is wider, fit to width
            finalWidth = target.w;
            finalHeight = Math.round(target.w / aspectRatio);
        } else {
            // Input is taller, fit to height
            finalHeight = target.h;
            finalWidth = Math.round(target.h * aspectRatio);
        }
        
        // Check WebGL limits and constrain if necessary
        const dimensionCheck = this.canHandleDimensions(finalWidth, finalHeight);
        if (!dimensionCheck.canHandle) {
            log('Target dimensions exceed WebGL limits, constraining:', {
                original: `${finalWidth}x${finalHeight}`,
                constrained: `${dimensionCheck.suggestedWidth}x${dimensionCheck.suggestedHeight}`
            });
            
            // Maintain aspect ratio while constraining to limits
            const constrainedRatio = dimensionCheck.suggestedWidth / dimensionCheck.suggestedHeight;
            if (aspectRatio > constrainedRatio) {
                finalWidth = dimensionCheck.suggestedWidth;
                finalHeight = Math.round(finalWidth / aspectRatio);
            } else {
                finalHeight = dimensionCheck.suggestedHeight;
                finalWidth = Math.round(finalHeight * aspectRatio);
            }
        }
        
        return {
            width: finalWidth,
            height: finalHeight,
            originalAspectRatio: aspectRatio,
            targetAspectRatio: targetRatio,
            aspectRatioMatch: Math.abs(aspectRatio - targetRatio) < 0.1,
            wasConstrained: !dimensionCheck.canHandle,
            constrainedReason: dimensionCheck.reason
        };
    }

    estimateFileSize(width, height, format) {
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
        const mb = Math.round(bytes / (1024 * 1024));
        
        return {
            bytes: Math.round(bytes),
            mb: mb,
            formatted: mb > 1000 ? `${(mb/1000).toFixed(1)}GB` : `${mb}MB`
        };
    }

    async upscaleImage(inputCanvas, targetWidth, targetHeight, onProgress) {
        log('Using reliable high-quality canvas-based upscaling');
        
        // Always use the reliable canvas-based fallback method
        // This eliminates WebGL issues and provides consistent results
        return await this.fallbackResize(inputCanvas, targetWidth, targetHeight, onProgress);
    }

    simulateUpscaling(inputCanvas, targetWidth, targetHeight, onProgress) {
        return new Promise((resolve) => {
            log('Simulating super resolution upscaling...');
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20;
                if (onProgress) {
                    onProgress(progress);
                }
                
                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // Perform high-quality resize as fallback
                    this.fallbackResize(inputCanvas, targetWidth, targetHeight).then(result => {
                        resolve(result);
                    });
                }
            }, 300);
        });
    }

    async fallbackResize(inputCanvas, targetWidth, targetHeight, onProgress) {
        log('Performing fallback high-quality resize');
        
        if (onProgress) onProgress(10);
        
        // Allow UI to update before intensive operation
        await new Promise(r => setTimeout(r, 50));
        
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        
        // Use high-quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        if (onProgress) onProgress(30);
        
        // For large scale factors, use multi-step upscaling
        const scaleX = targetWidth / inputCanvas.width;
        const scaleY = targetHeight / inputCanvas.height;
        const maxScale = Math.max(scaleX, scaleY);
        
        if (maxScale > 2) {
            // Multi-step upscaling for better quality
            if (onProgress) onProgress(50);
            
            const result = await this.multiStepResizeAsync(inputCanvas, targetWidth, targetHeight, onProgress);
            if (onProgress) onProgress(100);
            return result;
        } else {
            // Single step resize
            if (onProgress) onProgress(70);
            
            // Allow UI to update before drawing
            await new Promise(r => setTimeout(r, 10));
            
            ctx.drawImage(inputCanvas, 0, 0, targetWidth, targetHeight);
            if (onProgress) onProgress(100);
            return canvas;
        }
    }

    async multiStepResizeAsync(inputCanvas, targetWidth, targetHeight, onProgress) {
        let currentCanvas = inputCanvas;
        let currentWidth = inputCanvas.width;
        let currentHeight = inputCanvas.height;
        
        let step = 0;
        const totalSteps = Math.ceil(Math.log2(Math.max(targetWidth / currentWidth, targetHeight / currentHeight)));
        
        // Calculate intermediate steps
        while (currentWidth < targetWidth || currentHeight < targetHeight) {
            const nextWidth = Math.min(currentWidth * 2, targetWidth);
            const nextHeight = Math.min(currentHeight * 2, targetHeight);
            
            // Allow UI to update between steps
            await new Promise(r => setTimeout(r, 10));
            
            const stepCanvas = document.createElement('canvas');
            stepCanvas.width = nextWidth;
            stepCanvas.height = nextHeight;
            
            const ctx = stepCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);
            
            // Clean up intermediate canvas (except original)
            if (currentCanvas !== inputCanvas) {
                currentCanvas = null;
            }
            
            currentCanvas = stepCanvas;
            currentWidth = nextWidth;
            currentHeight = nextHeight;
            
            // Update progress
            step++;
            if (onProgress) {
                const progress = 50 + Math.round((step / totalSteps) * 40); // 50-90%
                onProgress(progress);
            }
            
            if (nextWidth === targetWidth && nextHeight === targetHeight) {
                break;
            }
        }
        
        return currentCanvas;
    }
    
    // Comprehensive TensorFlow.js cleanup after WebGL failure
    async cleanupTensorFlowState() {
        try {
            log('Performing comprehensive TensorFlow.js cleanup');
            
            // Dispose of all variables
            if (tf && tf.disposeVariables) {
                tf.disposeVariables();
            }
            
            // Clear all tensors
            if (tf && tf.dispose) {
                tf.dispose();
            }
            
            // Reset the backend
            if (tf && tf.backend) {
                try {
                    tf.backend().dispose();
                } catch (e) {
                    log('Backend disposal failed:', e.message);
                }
            }
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Clear model cache
            this.modelCache.clear();
            
            // Reset upscaler instance
            this.upscaler = null;
            
            // Allow time for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
            
            log('TensorFlow.js cleanup completed');
            
        } catch (error) {
            logError('TensorFlow.js cleanup failed:', error);
        }
    }

    async processForPrint(inputCanvas, targetSize, format, onProgress) {
        log('Processing image for print:', targetSize, format);
        
        // Reset WebGL failure flag for new attempts (user can try again)
        // this.webglFailed = false;
        
        try {
            const inputWidth = inputCanvas.width;
            const inputHeight = inputCanvas.height;
            
            // Calculate optimal dimensions
            const dimensions = this.calculateOptimalDimensions(inputWidth, inputHeight, targetSize);
            
            // Estimate file size
            const sizeEstimate = this.estimateFileSize(dimensions.width, dimensions.height, format);
            
            log(`Target dimensions: ${dimensions.width}x${dimensions.height}`);
            log(`Estimated file size: ${sizeEstimate.formatted}`);
            
            // Allow UI to update before starting intensive upscaling
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Perform upscaling
            const upscaledCanvas = await this.upscaleImage(
                inputCanvas, 
                dimensions.width, 
                dimensions.height, 
                onProgress
            );
            
            return {
                canvas: upscaledCanvas,
                dimensions: dimensions,
                fileSize: sizeEstimate,
                success: true
            };
            
        } catch (error) {
            logError('Print processing failed:', error);
            return {
                canvas: null,
                dimensions: null,
                fileSize: null,
                success: false,
                error: error.message
            };
        }
    }

    // Get available print sizes with recommendations
    getAvailablePrintSizes(inputWidth, inputHeight) {
        const aspectRatio = inputWidth / inputHeight;
        
        const sizes = [
            { value: '8x10', name: '8×10 inches', w: 8, h: 10, pixels: '2400×3000' },
            { value: '11x14', name: '11×14 inches', w: 11, h: 14, pixels: '3300×4200' },
            { value: '16x20', name: '16×20 inches', w: 16, h: 20, pixels: '4800×6000' },
            { value: '18x24', name: '18×24 inches', w: 18, h: 24, pixels: '5400×7200' },
            { value: '24x30', name: '24×30 inches', w: 24, h: 30, pixels: '7200×9000' },
            { value: '30x40', name: '30×40 inches', w: 30, h: 40, pixels: '9000×12000' }
        ];
        
        return sizes.map(size => {
            const sizeRatio = size.w / size.h;
            const ratioMatch = Math.abs(aspectRatio - sizeRatio) < 0.1;
            const scaleRequired = Math.max(
                (size.w * 300) / inputWidth,
                (size.h * 300) / inputHeight
            );
            
            return {
                ...size,
                recommended: ratioMatch && scaleRequired <= 4,
                scaleRequired: scaleRequired.toFixed(1),
                aspectRatioMatch: ratioMatch
            };
        });
    }

    // Check system capabilities
    checkCapabilities() {
        const capabilities = {
            webGL: this.checkWebGL(),
            memoryEstimate: this.estimateMemory(),
            upscalerAvailable: typeof Upscaler !== 'undefined',
            tensorFlowAvailable: typeof tf !== 'undefined',
            tfVersion: typeof tf !== 'undefined' ? tf.version : null
        };
        
        log('Super Resolution capabilities:', capabilities);
        return capabilities;
    }

    canHandleDimensions(width, height) {
        const webGL = this.checkWebGL();
        if (!webGL.supported) {
            return { canHandle: false, reason: 'WebGL not supported' };
        }

        const maxDimension = Math.min(webGL.maxTextureSize, 16384); // Conservative limit
        const exceedsWidth = width > maxDimension;
        const exceedsHeight = height > maxDimension;

        if (exceedsWidth || exceedsHeight) {
            return {
                canHandle: false,
                reason: `Dimensions ${width}x${height} exceed WebGL limit ${maxDimension}x${maxDimension}`,
                maxDimension: maxDimension,
                suggestedWidth: Math.min(width, maxDimension),
                suggestedHeight: Math.min(height, maxDimension)
            };
        }

        return { canHandle: true };
    }

    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return { supported: false };
            
            // Get WebGL limits
            const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
            
            return {
                supported: true,
                maxTextureSize: maxTextureSize,
                maxRenderbufferSize: maxRenderbufferSize,
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER)
            };
        } catch (e) {
            return { supported: false, error: e.message };
        }
    }

    estimateMemory() {
        // Rough estimate of available memory for processing
        if (navigator.deviceMemory) {
            return `${navigator.deviceMemory}GB`;
        }
        return 'Unknown';
    }

    cleanup() {
        if (this.upscaler) {
            try {
                // Cleanup upscaler resources if method exists
                if (typeof this.upscaler.dispose === 'function') {
                    this.upscaler.dispose();
                }
            } catch (error) {
                logError('Error cleaning up upscaler:', error);
            }
            this.upscaler = null;
        }

        // TensorFlow.js memory cleanup
        this.cleanupMemory();
        
        this.isReady = false;
        log('SuperResolution cleaned up');
    }

    cleanupMemory() {
        try {
            if (typeof tf !== 'undefined') {
                // Dispose variables and clean up GPU memory
                tf.disposeVariables();
                
                // Log memory status
                const memory = tf.memory();
                log('Memory after cleanup:', memory);
                
                // Force garbage collection if available (Chrome with --expose-gc flag)
                if (window.gc) {
                    window.gc();
                    log('Forced garbage collection');
                }
            }
        } catch (error) {
            logError('Error during memory cleanup:', error);
        }
    }
}