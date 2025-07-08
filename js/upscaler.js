class SuperResolution {
    constructor() {
        this.upscaler = null;
        this.isReady = false;
        this.models = {
            'esrgan-medium': {
                name: 'ESRGAN Medium',
                scale: 4,
                quality: 'balanced'
            },
            'esrgan-small': {
                name: 'ESRGAN Small',
                scale: 2,
                quality: 'fast'
            }
        };
    }

    async init() {
        log('Initializing Super Resolution...');
        
        try {
            // Check if UpscalerJS is available
            if (typeof Upscaler === 'undefined') {
                log('UpscalerJS not available, super resolution will be simulated');
                this.isReady = false;
                return false;
            }

            // Initialize UpscalerJS with appropriate model
            this.upscaler = new Upscaler({
                model: 'esrgan-medium',
                warmupSizes: [[256, 256]], // Warm up with small size
            });

            this.isReady = true;
            log('Super Resolution initialized successfully');
            return true;
            
        } catch (error) {
            logError('Failed to initialize Super Resolution:', error);
            this.isReady = false;
            return false;
        }
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
        
        return {
            width: finalWidth,
            height: finalHeight,
            originalAspectRatio: aspectRatio,
            targetAspectRatio: targetRatio,
            aspectRatioMatch: Math.abs(aspectRatio - targetRatio) < 0.1
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
        log('Starting super resolution upscaling...');
        
        try {
            if (!this.isReady) {
                return this.simulateUpscaling(inputCanvas, targetWidth, targetHeight, onProgress);
            }

            // Calculate scale factor needed
            const scaleX = targetWidth / inputCanvas.width;
            const scaleY = targetHeight / inputCanvas.height;
            const scale = Math.max(scaleX, scaleY);
            
            log(`Upscaling from ${inputCanvas.width}x${inputCanvas.height} to ${targetWidth}x${targetHeight} (${scale.toFixed(2)}x)`);
            
            // Progress callback wrapper
            const progressCallback = (progress) => {
                if (onProgress) {
                    onProgress(Math.round(progress * 100));
                }
            };
            
            // Perform upscaling
            const upscaledCanvas = await this.upscaler.upscale(inputCanvas, {
                output: 'canvas',
                progressCallback: progressCallback
            });
            
            // If the upscaled result doesn't match exact target dimensions,
            // resize to exact dimensions
            if (upscaledCanvas.width !== targetWidth || upscaledCanvas.height !== targetHeight) {
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = targetWidth;
                finalCanvas.height = targetHeight;
                
                const ctx = finalCanvas.getContext('2d');
                ctx.drawImage(upscaledCanvas, 0, 0, targetWidth, targetHeight);
                
                log('Upscaling completed with final resize');
                return finalCanvas;
            }
            
            log('Upscaling completed');
            return upscaledCanvas;
            
        } catch (error) {
            logError('Upscaling failed:', error);
            // Fallback to simple resize
            return this.fallbackResize(inputCanvas, targetWidth, targetHeight);
        }
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
                    const result = this.fallbackResize(inputCanvas, targetWidth, targetHeight);
                    resolve(result);
                }
            }, 300);
        });
    }

    fallbackResize(inputCanvas, targetWidth, targetHeight) {
        log('Performing fallback high-quality resize');
        
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        
        // Use high-quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // For large scale factors, use multi-step upscaling
        const scaleX = targetWidth / inputCanvas.width;
        const scaleY = targetHeight / inputCanvas.height;
        const maxScale = Math.max(scaleX, scaleY);
        
        if (maxScale > 2) {
            // Multi-step upscaling for better quality
            return this.multiStepResize(inputCanvas, targetWidth, targetHeight);
        } else {
            // Single step resize
            ctx.drawImage(inputCanvas, 0, 0, targetWidth, targetHeight);
            return canvas;
        }
    }

    multiStepResize(inputCanvas, targetWidth, targetHeight) {
        let currentCanvas = inputCanvas;
        let currentWidth = inputCanvas.width;
        let currentHeight = inputCanvas.height;
        
        // Calculate intermediate steps
        while (currentWidth < targetWidth || currentHeight < targetHeight) {
            const nextWidth = Math.min(currentWidth * 2, targetWidth);
            const nextHeight = Math.min(currentHeight * 2, targetHeight);
            
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
            
            if (nextWidth === targetWidth && nextHeight === targetHeight) {
                break;
            }
        }
        
        return currentCanvas;
    }

    async processForPrint(inputCanvas, targetSize, format, onProgress) {
        log('Processing image for print:', targetSize, format);
        
        try {
            const inputWidth = inputCanvas.width;
            const inputHeight = inputCanvas.height;
            
            // Calculate optimal dimensions
            const dimensions = this.calculateOptimalDimensions(inputWidth, inputHeight, targetSize);
            
            // Estimate file size
            const sizeEstimate = this.estimateFileSize(dimensions.width, dimensions.height, format);
            
            log(`Target dimensions: ${dimensions.width}x${dimensions.height}`);
            log(`Estimated file size: ${sizeEstimate.formatted}`);
            
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
            tensorFlowAvailable: typeof tf !== 'undefined'
        };
        
        log('Super Resolution capabilities:', capabilities);
        return capabilities;
    }

    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
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
        this.isReady = false;
        log('SuperResolution cleaned up');
    }
}