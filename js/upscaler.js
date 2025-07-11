class SuperResolution {
    constructor() {
        this.upscaler = null;
        this.isReady = false;
    }

    async init() {
        log('Initializing UpscalerJS...');
        
        try {
            // Wait a bit for UpscalerJS to fully load
            let attempts = 0;
            const maxAttempts = 10;
            
            while (typeof Upscaler === 'undefined' && attempts < maxAttempts) {
                log(`Waiting for UpscalerJS... (attempt ${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            // Check if UpscalerJS is available
            if (typeof Upscaler === 'undefined') {
                log('UpscalerJS not available after waiting');
                this.isReady = false;
                return false;
            }
            
            // Check if we have all ESRGAN Thick models loaded
            const models = {
                '2x': typeof ESRGANThick2x !== 'undefined',
                '3x': typeof ESRGANThick3x !== 'undefined',
                '4x': typeof ESRGANThick4x !== 'undefined'
            };
            
            const availableModels = Object.keys(models).filter(key => models[key]);
            
            if (availableModels.length === 0) {
                log('No ESRGAN Thick models found');
                this.isReady = false;
                return false;
            }
            
            log(`ESRGAN Thick models loaded: ${availableModels.join(', ')}`);
            
            // We need at least one model to be functional
            if (availableModels.length > 0) {
                this.isReady = true;
                return true;
            } else {
                this.isReady = false;
                return false;
            }
            
        } catch (error) {
            logError('UpscalerJS initialization failed:', error);
            this.isReady = false;
            return false;
        }
    }

    calculateOptimalPasses(inputWidth, inputHeight, targetWidth, targetHeight) {
        // Calculate the scaling factor needed
        const scaleNeeded = Math.max(
            targetWidth / inputWidth,
            targetHeight / inputHeight
        );
        
        log(`Scale needed: ${scaleNeeded.toFixed(2)}x from ${inputWidth}x${inputHeight} to ${targetWidth}x${targetHeight}`);
        
        // If we already exceed the target, no scaling needed
        if (scaleNeeded <= 1.0) {
            return { passes: [], totalScale: 1.0 };
        }
        
        // Available scaling factors
        const availableScales = [];
        if (typeof ESRGANThick2x !== 'undefined') availableScales.push(2);
        if (typeof ESRGANThick3x !== 'undefined') availableScales.push(3);
        if (typeof ESRGANThick4x !== 'undefined') availableScales.push(4);
        
        if (availableScales.length === 0) {
            throw new Error('No ESRGAN models available');
        }
        
        // Generate all possible combinations up to 3 passes
        const combinations = [];
        
        // Single pass
        for (let scale of availableScales) {
            if (scale >= scaleNeeded) {
                combinations.push({ passes: [scale], totalScale: scale });
            }
        }
        
        // Two passes
        for (let scale1 of availableScales) {
            for (let scale2 of availableScales) {
                const totalScale = scale1 * scale2;
                if (totalScale >= scaleNeeded) {
                    combinations.push({ passes: [scale1, scale2], totalScale });
                }
            }
        }
        
        // Three passes (only if needed)
        if (combinations.length === 0) {
            for (let scale1 of availableScales) {
                for (let scale2 of availableScales) {
                    for (let scale3 of availableScales) {
                        const totalScale = scale1 * scale2 * scale3;
                        if (totalScale >= scaleNeeded) {
                            combinations.push({ passes: [scale1, scale2, scale3], totalScale });
                        }
                    }
                }
            }
        }
        
        if (combinations.length === 0) {
            throw new Error('Cannot reach target size with available models');
        }
        
        // Sort by:
        // 1. Fewest passes (efficiency)
        // 2. Smallest overshoot (quality)
        // 3. Largest individual scales first (quality)
        combinations.sort((a, b) => {
            // Prefer fewer passes
            if (a.passes.length !== b.passes.length) {
                return a.passes.length - b.passes.length;
            }
            
            // Prefer smaller overshoot
            const overshootA = a.totalScale / scaleNeeded;
            const overshootB = b.totalScale / scaleNeeded;
            if (Math.abs(overshootA - overshootB) > 0.1) {
                return overshootA - overshootB;
            }
            
            // Prefer larger scales first (better quality)
            const maxScaleA = Math.max(...a.passes);
            const maxScaleB = Math.max(...b.passes);
            return maxScaleB - maxScaleA;
        });
        
        const optimal = combinations[0];
        log(`Optimal scaling plan: ${optimal.passes.join(' → ')} = ${optimal.totalScale.toFixed(2)}x (${((optimal.totalScale / scaleNeeded - 1) * 100).toFixed(1)}% overshoot)`);
        
        return optimal;
    }

    getModelForScale(scale) {
        switch(scale) {
            case 2: return ESRGANThick2x;
            case 3: return ESRGANThick3x;
            case 4: return ESRGANThick4x;
            default: throw new Error(`No model available for ${scale}x scaling`);
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
        log('Starting multi-pass AI upscaling with UpscalerJS');
        
        if (!this.isReady || typeof Upscaler === 'undefined') {
            throw new Error('UpscalerJS not available or not properly initialized');
        }
        
        try {
            // Calculate optimal scaling passes
            const scalingPlan = this.calculateOptimalPasses(
                inputCanvas.width, 
                inputCanvas.height, 
                targetWidth, 
                targetHeight
            );
            
            // If no scaling needed, return original
            if (scalingPlan.passes.length === 0) {
                if (onProgress) onProgress(100);
                return inputCanvas;
            }
            
            let currentCanvas = inputCanvas;
            const totalPasses = scalingPlan.passes.length;
            
            // Execute each pass
            for (let i = 0; i < totalPasses; i++) {
                const scale = scalingPlan.passes[i];
                const passNumber = i + 1;
                
                log(`Pass ${passNumber}/${totalPasses}: Applying ${scale}x scaling`);
                
                // Calculate progress range for this pass
                const passStartProgress = (i / totalPasses) * 90; // 0-90% for all passes
                const passEndProgress = ((i + 1) / totalPasses) * 90;
                
                // Constrain input size for this pass
                const constrainedCanvas = this.constrainInputSize(currentCanvas);
                
                // Create upscaler instance for this scale
                const model = this.getModelForScale(scale);
                const upscaler = new Upscaler({ model });
                
                // Convert canvas to image element for UpscalerJS
                const img = new Image();
                img.src = constrainedCanvas.toDataURL();
                
                await new Promise(resolve => {
                    img.onload = resolve;
                });
                
                // Progress callback for this pass
                const passProgressCallback = (percent, slice, row, col) => {
                    if (onProgress) {
                        const mappedProgress = passStartProgress + (percent * (passEndProgress - passStartProgress));
                        onProgress(mappedProgress);
                    }
                };
                
                // Upscale with UpscalerJS
                const result = await upscaler.upscale(img, {
                    patch: true,
                    patchSize: 128,
                    padding: 2,
                    output: 'tensor',
                    progress: passProgressCallback
                });
                
                // Convert tensor result to canvas
                const outputCanvas = document.createElement('canvas');
                outputCanvas.width = result.shape[1]; // width
                outputCanvas.height = result.shape[0]; // height
                await tf.browser.toPixels(result.toInt(), outputCanvas);
                result.dispose();
                
                // Update current canvas for next pass
                currentCanvas = outputCanvas;
                
                log(`Pass ${passNumber} completed: ${currentCanvas.width}x${currentCanvas.height}`);
            }
            
            if (onProgress) onProgress(100);
            log(`Multi-pass AI upscaling completed: Final size ${currentCanvas.width}x${currentCanvas.height}`);
            return currentCanvas;
            
        } catch (error) {
            logError('Multi-pass AI upscaling failed:', error);
            throw error;
        }
    }

    
    constrainInputSize(inputCanvas) {
        // Limit input size to avoid WebGL issues (4x upscaling means 16x area growth)
        const maxInputSize = 4000; // This will result in ~16kx16k output (4x scale), which is near WebGL max
        let { width, height } = inputCanvas;
        
        // Scale down if too large
        const maxDimension = Math.max(width, height);
        if (maxDimension > maxInputSize) {
            const scale = maxInputSize / maxDimension;
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
            log(`Input image resized from ${inputCanvas.width}x${inputCanvas.height} to ${width}x${height} for processing`);
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(inputCanvas, 0, 0, width, height);
            return canvas;
        }
        
        return inputCanvas; // No constraint needed
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
            this.upscaler = null;
        }
        this.isReady = false;
        log('SuperResolution cleaned up');
    }
}