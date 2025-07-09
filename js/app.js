class PaintingEnhancer {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.state = {
            originalFile: null,
            originalCanvas: null,
            processedCanvas: null,
            currentCanvas: null,
            previewMode: false,
            step3PreviewMode: false, // Add preview mode state for Step 3
            settings: {
                gridCorrection: null,
                lightingCorrectionStrength: 10, // 0-100%
                contrastBoost: 1.10, // 1.0 - 3.0
                saturationBoost: 1.24, // 1.0 - 3.0
                autoColor: true,
                colorIntensity: 75,
                targetSize: '24x30',
                outputFormat: 'jpeg-95'
            }
        };
        
        // Initialize modules
        this.ui = new UIController();
        this.processor = new ImageProcessor();
        this.upscaler = new SuperResolution();
        
        // Bind to window for global access
        window.app = this;
    }

    async init() {
        log('Initializing Painting Enhancer...');
        
        try {
            // Initialize UI first
            this.ui.init();
            
            // Initialize image processor
            const openCVReady = this.processor.init();
            if (!openCVReady) {
                log('OpenCV not available. Some features may be limited.');
            }
            
            // Initialize super resolution
            const upscalerReady = await this.upscaler.init();
            if (!upscalerReady) {
                log('Super resolution will use fallback methods');
            }
            
            // Set up memory monitoring
            this.setupMemoryMonitoring();
            
            log('Painting Enhancer initialized successfully');
            return true;
            
        } catch (error) {
            logError('Initialization failed:', error);
            throw error;
        }
    }

    // File Upload Handler
    async handleFileUpload(file) {
        log('Processing uploaded file:', file.name);
        
        try {
            this.ui.showProgress('Loading image...', 0);
            
            // Validate file
            const validation = validateImageFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            
            // Convert to canvas
            this.state.originalCanvas = await fileToCanvas(file);
            this.state.currentCanvas = this.cloneCanvas(this.state.originalCanvas);
            this.state.originalFile = file;
            
            // Hide upload area and show image
            this.hideUploadArea();
            this.displayImage(this.state.currentCanvas);
            
            this.ui.hideProgress();
            this.ui.enableNextButton();
            this.ui.updateNavigationButtons();
            
            log('File uploaded and processed successfully');
            
        } catch (error) {
            this.ui.hideProgress();
            this.ui.showError(`Upload failed: ${error.message}`);
            logError('File upload error:', error);
        }
    }

    // Step Processing Methods
    applyCurrentStep() {
        const currentStep = this.ui.currentStep;
        log(`Applying step ${currentStep}`);
        
        switch(currentStep) {
            case 2:
                this.applyGridCorrection();
                break;
            case 3:
                this.applyLightingCorrection();
                break;
            case 4:
                this.applyColorCorrection();
                break;
            default:
                log('No processing needed for current step');
        }
    }

    async applyGridCorrection() {
        log('applyGridCorrection called');
        log('Current canvas exists:', !!this.state.currentCanvas);
        log('Grid correction settings exist:', !!this.state.settings.gridCorrection);
        
        if (!this.state.currentCanvas || !this.state.settings.gridCorrection) {
            log('Skipping grid correction: no canvas or no grid settings');
            return;
        }
        
        try {
            this.ui.showProgress('Applying grid correction...', 10);
            
            const inputMat = this.processor.canvasToMat(this.state.originalCanvas);
            if (!inputMat) {
                throw new Error('Failed to convert canvas to Mat');
            }
            
            this.ui.updateProgress(30);
            const correctedMat = this.processor.applyGridDistortionCorrection(
                inputMat,
                this.state.settings.gridCorrection.gridPoints,
                this.state.settings.gridCorrection.outputWidth,
                this.state.settings.gridCorrection.outputHeight
            );
            
            this.ui.updateProgress(70);
            const outputCanvas = this.processor.matToCanvas(correctedMat);
            if (!outputCanvas) {
                throw new Error('Failed to convert Mat to canvas');
            }
            
            this.state.currentCanvas = outputCanvas;
            
            // Automatically turn on preview mode to show corrected image
            this.state.previewMode = true;
            this.showStepPreview();
            
            // Update the before/after button to show "Before" 
            const beforeAfterBtn = document.getElementById('before-after-2');
            if (beforeAfterBtn) {
                beforeAfterBtn.textContent = 'Hide Preview';
                beforeAfterBtn.classList.add('active');
            }
            
            // Cleanup
            cleanupMats(inputMat, correctedMat);
            
            this.ui.updateProgress(100);
            setTimeout(() => this.ui.hideProgress(), 500);
            
            log('Grid correction applied successfully');
            
        } catch (error) {
            this.ui.hideProgress();
            this.ui.showError('Grid correction failed: ' + error.message);
            logError('Grid correction error:', error);
        }
    }

    async applyLightingCorrection() {
        if (!this.state.currentCanvas) {
            log('Skipping glare removal: no canvas');
            return;
        }
        
        if (this.state.settings.lightingCorrectionStrength === 0 && this.state.settings.contrastBoost === 1.0 && this.state.settings.saturationBoost === 1.0) {
            log('Skipping lighting correction: no adjustments needed');
            return;
        }
        
        try {
            this.ui.showProgress('Applying glare removal...', 10);
            
            const inputMat = this.processor.canvasToMat(this.state.currentCanvas);
            if (!inputMat) {
                throw new Error('Failed to convert canvas to Mat');
            }
            
            this.ui.updateProgress(30);
            const adjustedMat = this.processor.applyLightingCorrection(
                inputMat,
                this.state.settings.lightingCorrectionStrength,
                this.state.settings.contrastBoost,
                this.state.settings.saturationBoost
            );
            
            this.ui.updateProgress(70);
            const outputCanvas = this.processor.matToCanvas(adjustedMat);
            if (!outputCanvas) {
                throw new Error('Failed to convert Mat to canvas');
            }
            
            this.state.currentCanvas = outputCanvas;
            this.displayImage(outputCanvas);
            
            // Cleanup
            cleanupMats(inputMat, adjustedMat);
            
            this.ui.updateProgress(100);
            setTimeout(() => this.ui.hideProgress(), 500);
            
            log('Lighting correction applied successfully');
            
        } catch (error) {
            this.ui.hideProgress();
            this.ui.showError('Lighting correction failed: ' + error.message);
            logError('Lighting correction error:', error);
        }
    }

    async applyColorCorrection() {
        if (!this.state.currentCanvas || !this.state.settings.autoColor) {
            log('Skipping color correction: no canvas or auto color disabled');
            return;
        }
        
        try {
            this.ui.showProgress('Applying color correction...', 10);
            
            const inputMat = this.processor.canvasToMat(this.state.currentCanvas);
            if (!inputMat) {
                throw new Error('Failed to convert canvas to Mat');
            }
            
            this.ui.updateProgress(30);
            const correctedMat = this.processor.autoColorCorrect(
                inputMat,
                this.state.settings.colorIntensity / 100
            );
            
            this.ui.updateProgress(70);
            const outputCanvas = this.processor.matToCanvas(correctedMat);
            if (!outputCanvas) {
                throw new Error('Failed to convert Mat to canvas');
            }
            
            this.state.currentCanvas = outputCanvas;
            this.displayImage(outputCanvas);
            
            // Cleanup
            cleanupMats(inputMat, correctedMat);
            
            this.ui.updateProgress(100);
            setTimeout(() => this.ui.hideProgress(), 500);
            
            log('Color correction applied successfully');
            
        } catch (error) {
            this.ui.hideProgress();
            this.ui.showError('Color correction failed: ' + error.message);
            logError('Color correction error:', error);
        }
    }

    // Settings Update Methods (called by UI)
    updateLensCorrection(value) {
        this.state.settings.lensCorrection = value;
        log('Lens correction updated:', value);
        
        // Real-time preview for lens correction (only if showing "after")
        if (this.ui.currentStep === 2) {
            const beforeAfterState = this.ui.beforeAfterState[2];
            if (!beforeAfterState) { // false or undefined means showing "after"
                this.debouncedPreviewUpdate();
            }
        }
    }

    setCameraProfile(profileKey) {
        this.processor.setCameraProfile(profileKey);
        log('Camera profile set to:', profileKey);
        
        // If lens correction is active, update the preview
        if (this.ui.currentStep === 2 && this.state.settings.lensCorrection !== 0) {
            const beforeAfterState = this.ui.beforeAfterState[2];
            if (!beforeAfterState) { // false or undefined means showing "after"
                this.debouncedPreviewUpdate();
            }
        }
    }

    async autoDetectLensDistortion() {
        if (!this.state.currentCanvas) {
            this.ui.showError('No image to analyze');
            return;
        }
        
        try {
            this.ui.showProgress('Analyzing lens distortion...', 10);
            
            const inputMat = this.processor.canvasToMat(this.state.currentCanvas);
            if (!inputMat) {
                throw new Error('Failed to convert canvas to Mat');
            }
            
            this.ui.updateProgress(50);
            const suggestedIntensity = await this.processor.detectLensDistortion(inputMat);
            
            if (suggestedIntensity > 0) {
                // Update the UI slider and settings
                this.state.settings.lensCorrection = suggestedIntensity;
                
                // Update UI elements
                const lensSlider = document.getElementById('lens-slider');
                const lensValue = document.getElementById('lens-value');
                
                if (lensSlider) lensSlider.value = suggestedIntensity;
                if (lensValue) lensValue.textContent = suggestedIntensity.toString();
                
                this.ui.updateProgress(100);
                
                setTimeout(() => {
                    this.ui.hideProgress();
                    this.ui.showSuccess(`Detected barrel distortion! Set correction to ${suggestedIntensity}%`);
                    
                    // Update preview if we're showing "after"
                    const beforeAfterState = this.ui.beforeAfterState[2];
                    if (!beforeAfterState) {
                        this.debouncedPreviewUpdate();
                    }
                }, 500);
                
                log('Auto-detection completed. Lens correction set to:', suggestedIntensity);
            } else {
                throw new Error('Could not detect significant lens distortion');
            }
            
            cleanupMat(inputMat);
            
        } catch (error) {
            this.ui.hideProgress();
            this.ui.showError('Auto-detection failed: ' + error.message);
            logError('Auto-detection error:', error);
        }
    }

    initializeGridStep() {
        log('Initializing 5x5 grid step');
        
        if (!this.state.currentCanvas) {
            log('No canvas available for grid initialization');
            return;
        }
        
        // Reset preview mode - always start with grid editing mode
        this.state.previewMode = false;
        
        // Initialize grid if not already set
        if (!this.state.settings.gridCorrection) {
            this.initializeGrid();
        }
        
        // Set up canvas event listeners
        this.setupGridEvents();
        
        // Render the grid
        this.renderGrid();
        
        // Reset the before/after button
        const beforeAfterBtn = document.getElementById('before-after-2');
        if (beforeAfterBtn) {
            beforeAfterBtn.textContent = 'Preview';
            beforeAfterBtn.classList.remove('active');
        }
    }
    
    initializeGrid() {
        const canvas = document.getElementById('canvas-step-2');
        if (!canvas || !this.state.currentCanvas) return;
        
        // Use actual image dimensions, not display canvas dimensions
        const imageWidth = this.state.currentCanvas.width;
        const imageHeight = this.state.currentCanvas.height;
        
        const cols = 5;
        const rows = 5;
        const gridPoints = [];
        
        // Create evenly spaced grid based on actual image dimensions
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = (imageWidth / (cols - 1)) * col;
                const y = (imageHeight / (rows - 1)) * row;
                
                gridPoints.push({
                    x: x,
                    y: y,
                    originalX: x,
                    originalY: y,
                    row: row,
                    col: col
                });
            }
        }
        
        this.state.settings.gridCorrection = {
            gridPoints: gridPoints,
            outputWidth: imageWidth,
            outputHeight: imageHeight
        };
        
        log('5x5 grid initialized with', gridPoints.length, 'points');
    }
    
    initializeStep3() {
        log('Initializing Step 3: Glare Removal with preview mode');
        
        // Set preview mode to ON by default
        this.state.step3PreviewMode = true;
        
        // Initialize the preview
        this.updatePreview();
        
        // Set the before/after button state
        const beforeAfterBtn = document.getElementById('before-after-3');
        if (beforeAfterBtn) {
            beforeAfterBtn.textContent = 'Show Original';
            beforeAfterBtn.classList.add('active');
        }
    }
    
    // Coordinate transformation helpers
    imageToCanvasCoords(imageX, imageY, canvas) {
        if (!this.state.currentCanvas) return { x: imageX, y: imageY };
        
        const scaleX = canvas.width / this.state.currentCanvas.width;
        const scaleY = canvas.height / this.state.currentCanvas.height;
        
        return {
            x: imageX * scaleX,
            y: imageY * scaleY
        };
    }
    
    canvasToImageCoords(canvasX, canvasY, canvas) {
        if (!this.state.currentCanvas) return { x: canvasX, y: canvasY };
        
        const scaleX = this.state.currentCanvas.width / canvas.width;
        const scaleY = this.state.currentCanvas.height / canvas.height;
        
        return {
            x: canvasX * scaleX,
            y: canvasY * scaleY
        };
    }

    setupGridEvents() {
        const canvas = document.getElementById('canvas-step-2');
        if (!canvas) {
            log('No canvas found for grid events');
            return;
        }
        
        // Remove any existing listeners
        canvas.removeEventListener('mousedown', this.gridMouseDownHandler);
        canvas.removeEventListener('mousemove', this.gridMouseMoveHandler);
        canvas.removeEventListener('mouseup', this.gridMouseUpHandler);
        
        // Bind handlers to this instance
        this.gridMouseDownHandler = this.handleGridMouseDown.bind(this);
        this.gridMouseMoveHandler = this.handleGridMouseMove.bind(this);
        this.gridMouseUpHandler = this.handleGridMouseUp.bind(this);
        
        // Add event listeners
        canvas.addEventListener('mousedown', this.gridMouseDownHandler);
        canvas.addEventListener('mousemove', this.gridMouseMoveHandler);
        canvas.addEventListener('mouseup', this.gridMouseUpHandler);
        
        // Touch events
        canvas.addEventListener('touchstart', this.gridMouseDownHandler);
        canvas.addEventListener('touchmove', this.gridMouseMoveHandler);
        canvas.addEventListener('touchend', this.gridMouseUpHandler);
        
        log('Grid events set up on canvas');
    }

    async autoDetectPerspective() {
        if (!this.state.currentCanvas) {
            this.ui.showError('No image to analyze');
            return;
        }
        
        try {
            this.ui.showProgress('Detecting painting edges...', 10);
            
            const inputMat = this.processor.canvasToMat(this.state.currentCanvas);
            if (!inputMat) {
                throw new Error('Failed to convert canvas to Mat');
            }
            
            this.ui.updateProgress(50);
            const corners = await this.processor.detectPaintingCorners(inputMat);
            
            if (corners && corners.length === 4) {
                // Calculate output dimensions maintaining aspect ratio
                const originalWidth = this.state.currentCanvas.width;
                const originalHeight = this.state.currentCanvas.height;
                
                this.state.settings.perspective = {
                    corners: corners,
                    width: originalWidth,
                    height: originalHeight
                };
                
                this.ui.updateProgress(100);
                
                setTimeout(() => {
                    this.ui.hideProgress();
                    this.updateCornerHandles(corners);
                    this.ui.showSuccess('Corners detected! Drag handles to adjust if needed.');
                }, 500);
                
                log('Perspective corners detected:', corners);
            } else {
                throw new Error('Could not detect 4 corners automatically');
            }
            
            cleanupMat(inputMat);
            
        } catch (error) {
            this.ui.hideProgress();
            this.ui.showError('Auto-detection failed: ' + error.message);
            logError('Auto-detection error:', error);
            
            // Provide default corners as fallback
            if (this.state.currentCanvas) {
                const defaultCorners = this.processor.getDefaultCorners({
                    cols: this.state.currentCanvas.width,
                    rows: this.state.currentCanvas.height
                });
                
                this.state.settings.perspective = {
                    corners: defaultCorners,
                    width: this.state.currentCanvas.width,
                    height: this.state.currentCanvas.height
                };
                
                setTimeout(() => {
                    this.updateCornerHandles(defaultCorners);
                    this.ui.showSuccess('Using default corners. Drag handles to adjust.');
                }, 100);
                log('Using default perspective corners');
            }
        }
    }

    startCornerDrag(corner, event) {
        log('Starting corner drag:', corner);
        
        const canvas = document.getElementById('canvas-step-3');
        const wrapper = document.getElementById('canvas-wrapper-3');
        
        if (!canvas || !wrapper || !this.state.settings.perspective) {
            log('Missing elements for corner drag');
            return;
        }
        
        event.preventDefault();
        
        const wrapperRect = wrapper.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const canvasWidth = canvas.offsetWidth;
        const canvasHeight = canvas.offsetHeight;
        const imageWidth = canvas.width;
        const imageHeight = canvas.height;
        
        const scaleX = canvasWidth / imageWidth;
        const scaleY = canvasHeight / imageHeight;
        
        // Calculate canvas offset within wrapper
        const canvasOffsetLeft = canvasRect.left - wrapperRect.left;
        const canvasOffsetTop = canvasRect.top - wrapperRect.top;
        
        let cornerIndex = 0;
        switch(corner) {
            case 'tl': cornerIndex = 0; break;
            case 'tr': cornerIndex = 1; break;
            case 'br': cornerIndex = 2; break;
            case 'bl': cornerIndex = 3; break;
        }
        
        log(`Dragging corner ${corner} (index ${cornerIndex})`);
        
        const handleDrag = (e) => {
            const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
            const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
            
            if (clientX === undefined || clientY === undefined) return;
            
            // Convert screen coordinates to wrapper coordinates
            const wrapperX = clientX - wrapperRect.left;
            const wrapperY = clientY - wrapperRect.top;
            
            // Convert to canvas coordinates (accounting for canvas offset within wrapper)
            const canvasX = wrapperX - canvasOffsetLeft;
            const canvasY = wrapperY - canvasOffsetTop;
            
            // Convert to image coordinates
            const imageX = canvasX / scaleX;
            const imageY = canvasY / scaleY;
            
            // Constrain to image bounds
            const clampedX = Math.max(0, Math.min(imageWidth, imageX));
            const clampedY = Math.max(0, Math.min(imageHeight, imageY));
            
            // Update corner position
            const updatedCorners = [...this.state.settings.perspective.corners];
            updatedCorners[cornerIndex] = { x: clampedX, y: clampedY };
            
            this.state.settings.perspective.corners = updatedCorners;
            this.updateCornerHandles(updatedCorners);
            
            log(`Corner ${corner} drag: wrapper(${wrapperX},${wrapperY}) -> canvas(${canvasX},${canvasY}) -> image(${clampedX},${clampedY})`);
        };
        
        const handleDragEnd = () => {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', handleDragEnd);
            
            log('Corner drag ended for:', corner);
        };
        
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDrag);
        document.addEventListener('touchend', handleDragEnd);
    }


    toggleAutoColor(enabled) {
        this.state.settings.autoColor = enabled;
        log('Auto color correction:', enabled ? 'enabled' : 'disabled');
    }

    updateColorIntensity(value) {
        this.state.settings.colorIntensity = value;
        log('Color intensity updated:', value);
        this.debouncedPreviewUpdate();
    }

    updatePrintSize(size) {
        this.state.settings.targetSize = size;
        log('Print size updated:', size);
        
        // Update file size estimate
        this.updateFileEstimate();
    }

    async handleGenerateHighRes() {
        if (!this.state.currentCanvas) {
            this.ui.showError('No image to process');
            return;
        }
        
        try {
            log('Starting super resolution processing...');
            log('Upscaler ready:', this.upscaler.isReady);
            
            const result = await this.upscaler.processForPrint(
                this.state.currentCanvas,
                this.state.settings.targetSize,
                this.state.settings.outputFormat,
                (progress) => {
                    this.ui.updateProgress(progress);
                    log(`Super resolution progress: ${progress}%`);
                }
            );
            
            if (result.success) {
                this.state.processedCanvas = result.canvas;
                this.displayImage(result.canvas);
                log('High-resolution generation completed:', {
                    originalSize: `${this.state.currentCanvas.width}x${this.state.currentCanvas.height}`,
                    processedSize: `${result.canvas.width}x${result.canvas.height}`,
                    targetSize: this.state.settings.targetSize
                });
            } else {
                throw new Error(result.error || 'Generation failed');
            }
            
        } catch (error) {
            this.ui.showError('High-resolution generation failed');
            logError('Generation error:', error);
        }
    }

    completeGeneration() {
        log('High-resolution generation completed');
        // This is called by UI when generation animation completes
    }

    updateOutputFormat(format) {
        this.state.settings.outputFormat = format;
        log('Output format updated:', format);
        this.updateFileEstimate();
    }

    // Preview Toggle for Steps 2 and 3
    toggleBeforeAfter(step, showAfter) {
        if (step === 2) {
            // Toggle preview mode for grid correction
            this.state.previewMode = !this.state.previewMode;
            
            const beforeAfterBtn = document.getElementById('before-after-2');
            if (this.state.previewMode) {
                // Show preview (corrected image without grid)
                this.showStepPreview();
                if (beforeAfterBtn) {
                    beforeAfterBtn.textContent = 'Show Grid';
                    beforeAfterBtn.classList.add('active');
                }
                log('Showing grid correction preview');
            } else {
                // Show original with grid for editing
                this.renderGrid();
                if (beforeAfterBtn) {
                    beforeAfterBtn.textContent = 'Preview';
                    beforeAfterBtn.classList.remove('active');
                }
                log('Showing grid for editing');
            }
        } else if (step === 3) {
            // Toggle preview mode for brightness/contrast
            this.state.step3PreviewMode = !this.state.step3PreviewMode;
            
            const beforeAfterBtn = document.getElementById('before-after-3');
            if (this.state.step3PreviewMode) {
                // Show preview (with brightness/contrast applied)
                this.updatePreview();
                if (beforeAfterBtn) {
                    beforeAfterBtn.textContent = 'Show Original';
                    beforeAfterBtn.classList.add('active');
                }
                log('Showing brightness/contrast preview');
            } else {
                // Show processed image from previous step (without brightness/contrast)
                if (this.state.currentCanvas) {
                    this.displayImage(this.state.currentCanvas);
                }
                if (beforeAfterBtn) {
                    beforeAfterBtn.textContent = 'Preview';
                    beforeAfterBtn.classList.remove('active');
                }
                log('Showing original for comparison');
            }
        } else {
            // Original behavior for other steps
            log(`Step ${step} toggled to:`, showAfter ? 'after' : 'before');
            
            if (showAfter) {
                if (step === 3 && (this.state.settings.lightingCorrectionStrength !== 0 || this.state.settings.contrastBoost !== 1.0 || this.state.settings.saturationBoost !== 1.0)) {
                    this.updatePreview();
                } else if (this.state.currentCanvas) {
                    this.displayImage(this.state.currentCanvas);
                }
            } else {
                if (this.state.originalCanvas) {
                    this.displayImage(this.state.originalCanvas);
                }
            }
        }
    }
    
    // Show preview without grid overlay
    showStepPreview() {
        const canvas = document.getElementById('canvas-step-2');
        if (canvas && this.state.currentCanvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(this.state.currentCanvas, 0, 0, canvas.width, canvas.height);
        }
    }

    // Utility Methods
    hideUploadArea() {
        // Hide the upload area in step 1
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }
        log('Upload area hidden');
    }

    displayImage(canvas) {
        if (!canvas) return;
        
        // Display on step 1 canvas
        if (this.ui.currentStep === 1) {
            const mainCanvas = this.ui.elements.imageCanvas;
            if (mainCanvas) {
                this.renderCanvasToCanvas(canvas, mainCanvas);
                mainCanvas.style.display = 'block';
            }
        }
        
        // Also display on current step canvas
        const stepCanvas = document.getElementById(`canvas-step-${this.ui.currentStep}`);
        if (stepCanvas) {
            this.renderCanvasToCanvas(canvas, stepCanvas);
            stepCanvas.style.display = 'block';
        }
        
        log('Image displayed on step', this.ui.currentStep, 'canvas:', canvas.width, 'x', canvas.height);
    }

    renderCanvasToCanvas(sourceCanvas, targetCanvas) {
        if (!sourceCanvas || !targetCanvas) return;
        
        // Get container dimensions
        const container = targetCanvas.parentElement;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        
        // Calculate scale to fit image in container
        const scale = Math.min(
            containerWidth / sourceCanvas.width,
            containerHeight / sourceCanvas.height,
            1 // Don't upscale beyond original size
        );
        
        // Set canvas size
        targetCanvas.width = sourceCanvas.width * scale;
        targetCanvas.height = sourceCanvas.height * scale;
        
        // Draw image
        const ctx = targetCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
    }

    cloneCanvas(originalCanvas) {
        const canvas = document.createElement('canvas');
        canvas.width = originalCanvas.width;
        canvas.height = originalCanvas.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalCanvas, 0, 0);
        
        return canvas;
    }

    renderGrid() {
        const canvas = document.getElementById('canvas-step-2');
        if (!canvas || !this.state.originalCanvas || !this.state.settings.gridCorrection) {
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Clear and draw ORIGINAL image with grid overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.state.originalCanvas, 0, 0, canvas.width, canvas.height);
        
        // Draw grid
        this.drawGridLines(ctx);
        this.drawGridPoints(ctx);
    }
    
    drawGridLines(ctx) {
        const gridPoints = this.state.settings.gridCorrection.gridPoints;
        const cols = 5, rows = 5;
        const canvas = ctx.canvas;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
        // Draw horizontal lines
        for (let row = 0; row < rows; row++) {
            ctx.beginPath();
            for (let col = 0; col < cols; col++) {
                const point = gridPoints[row * cols + col];
                const canvasCoords = this.imageToCanvasCoords(point.x, point.y, canvas);
                if (col === 0) {
                    ctx.moveTo(canvasCoords.x, canvasCoords.y);
                } else {
                    ctx.lineTo(canvasCoords.x, canvasCoords.y);
                }
            }
            ctx.stroke();
        }
        
        // Draw vertical lines
        for (let col = 0; col < cols; col++) {
            ctx.beginPath();
            for (let row = 0; row < rows; row++) {
                const point = gridPoints[row * cols + col];
                const canvasCoords = this.imageToCanvasCoords(point.x, point.y, canvas);
                if (row === 0) {
                    ctx.moveTo(canvasCoords.x, canvasCoords.y);
                } else {
                    ctx.lineTo(canvasCoords.x, canvasCoords.y);
                }
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawGridPoints(ctx) {
        const gridPoints = this.state.settings.gridCorrection.gridPoints;
        const canvas = ctx.canvas;
        
        ctx.save();
        
        // Draw all points
        gridPoints.forEach((point, index) => {
            // Corners are larger and red
            const isCorner = (point.row === 0 || point.row === 4) && (point.col === 0 || point.col === 4);
            const canvasCoords = this.imageToCanvasCoords(point.x, point.y, canvas);
            const isDragging = this.isDragging && this.draggedPoint === point;
            
            // Main handle - becomes ghost (semi-transparent) when dragging
            const handleOpacity = isDragging ? 0.3 : 0.9;
            ctx.fillStyle = isCorner ? `rgba(255, 50, 50, ${handleOpacity})` : `rgba(255, 100, 100, ${handleOpacity})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${handleOpacity})`;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(canvasCoords.x, canvasCoords.y, isCorner ? 8 : 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Precise indicator - small dot at exact coordinate
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.arc(canvasCoords.x, canvasCoords.y, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // When dragging, add crosshair for extra precision
            if (isDragging) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const crossSize = 6;
                ctx.moveTo(canvasCoords.x - crossSize, canvasCoords.y);
                ctx.lineTo(canvasCoords.x + crossSize, canvasCoords.y);
                ctx.moveTo(canvasCoords.x, canvasCoords.y - crossSize);
                ctx.lineTo(canvasCoords.x, canvasCoords.y + crossSize);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }

    handleGridMouseDown(e) {
        if (!this.state.settings.gridCorrection) return;
        
        const canvas = document.getElementById('canvas-step-2');
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX || e.touches[0]?.clientX) - rect.left;
        const mouseY = (e.clientY || e.touches[0]?.clientY) - rect.top;
        
        // Find nearest grid point in canvas coordinates
        const nearestPointResult = this.findNearestGridPoint(mouseX, mouseY, canvas);
        if (nearestPointResult && nearestPointResult.distance < 15) {
            // Find the actual grid point object in the array
            this.draggedPoint = this.state.settings.gridCorrection.gridPoints.find(p => 
                p.row === nearestPointResult.row && p.col === nearestPointResult.col
            );
            this.isDragging = true;
            canvas.classList.add('dragging'); // Add CSS class for cursor control
            canvas.style.cursor = 'none'; // Hide cursor during drag for precision
            log('Started dragging grid point at', nearestPointResult.row, nearestPointResult.col);
        }
    }
    
    handleGridMouseMove(e) {
        if (!this.state.settings.gridCorrection) return;
        
        const canvas = document.getElementById('canvas-step-2');
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX || e.touches[0]?.clientX) - rect.left;
        const mouseY = (e.clientY || e.touches[0]?.clientY) - rect.top;
        
        if (this.isDragging && this.draggedPoint) {
            // Convert canvas mouse coordinates to image coordinates
            const imageCoords = this.canvasToImageCoords(mouseX, mouseY, canvas);
            const imageWidth = this.state.currentCanvas.width;
            const imageHeight = this.state.currentCanvas.height;
            
            // Update dragged point position in image space
            this.draggedPoint.x = Math.max(0, Math.min(imageWidth, imageCoords.x));
            this.draggedPoint.y = Math.max(0, Math.min(imageHeight, imageCoords.y));
            this.renderGrid(); // Redraw with updated position
        } else {
            // Change cursor if hovering over a grid point
            const nearestPointResult = this.findNearestGridPoint(mouseX, mouseY, canvas);
            if (nearestPointResult && nearestPointResult.distance < 15) {
                canvas.style.cursor = 'grab';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        }
    }
    
    handleGridMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedPoint = null;
            const canvas = document.getElementById('canvas-step-2');
            canvas.classList.remove('dragging'); // Remove CSS class
            canvas.style.cursor = 'crosshair';
            log('Grid drag ended');
        }
    }
    
    findNearestGridPoint(canvasX, canvasY, canvas) {
        if (!this.state.settings.gridCorrection) return null;
        
        let nearestPoint = null;
        let minDistance = Infinity;
        
        this.state.settings.gridCorrection.gridPoints.forEach(point => {
            // Convert grid point from image space to canvas space for distance calculation
            const canvasCoords = this.imageToCanvasCoords(point.x, point.y, canvas);
            const distance = this.getDistance(canvasX, canvasY, canvasCoords.x, canvasCoords.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = point;
            }
        });
        
        return nearestPoint ? { ...nearestPoint, distance: minDistance } : null;
    }
    
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }
    
    optimizeGridSpacing() {
        if (!this.state.settings.gridCorrection) {
            log('No grid to optimize');
            return;
        }
        
        const gridPoints = [...this.state.settings.gridCorrection.gridPoints];
        const cols = 5, rows = 5;
        
        // Apply smoothing passes
        for (let pass = 0; pass < 3; pass++) {
            // Smooth interior points
            for (let row = 1; row < rows - 1; row++) {
                for (let col = 1; col < cols - 1; col++) {
                    const index = row * cols + col;
                    const neighbors = this.getGridNeighbors(gridPoints, row, col, cols, rows);
                    
                    if (neighbors.length > 0) {
                        const avgX = neighbors.reduce((sum, n) => sum + n.x, 0) / neighbors.length;
                        const avgY = neighbors.reduce((sum, n) => sum + n.y, 0) / neighbors.length;
                        
                        // Blend with current position
                        const blendFactor = 0.3;
                        gridPoints[index].x = gridPoints[index].x * (1 - blendFactor) + avgX * blendFactor;
                        gridPoints[index].y = gridPoints[index].y * (1 - blendFactor) + avgY * blendFactor;
                    }
                }
            }
        }
        
        // Apply regularization for even spacing
        this.regularizeGridSpacing(gridPoints, cols, rows);
        
        // Update the grid
        this.state.settings.gridCorrection.gridPoints = gridPoints;
        this.renderGrid();
        
        log('Grid spacing optimized');
    }
    
    getGridNeighbors(gridPoints, row, col, cols, rows) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                neighbors.push(gridPoints[newRow * cols + newCol]);
            }
        });
        
        return neighbors;
    }
    
    regularizeGridSpacing(gridPoints, cols, rows) {
        // Ensure even spacing within rows
        for (let row = 0; row < rows; row++) {
            const rowPoints = [];
            for (let col = 0; col < cols; col++) {
                rowPoints.push(gridPoints[row * cols + col]);
            }
            
            // Redistribute interior points
            for (let col = 1; col < cols - 1; col++) {
                const progress = col / (cols - 1);
                const index = row * cols + col;
                
                const idealX = rowPoints[0].x + progress * (rowPoints[cols-1].x - rowPoints[0].x);
                
                const blendFactor = 0.5;
                gridPoints[index].x = gridPoints[index].x * (1 - blendFactor) + idealX * blendFactor;
            }
        }
        
        // Ensure even spacing within columns
        for (let col = 0; col < cols; col++) {
            const colPoints = [];
            for (let row = 0; row < rows; row++) {
                colPoints.push(gridPoints[row * cols + col]);
            }
            
            for (let row = 1; row < rows - 1; row++) {
                const progress = row / (rows - 1);
                const index = row * cols + col;
                
                const idealY = colPoints[0].y + progress * (colPoints[rows-1].y - colPoints[0].y);
                
                const blendFactor = 0.5;
                gridPoints[index].y = gridPoints[index].y * (1 - blendFactor) + idealY * blendFactor;
            }
        }
    }
    
    resetGrid() {
        if (!this.state.settings.gridCorrection) return;
        
        // Reset all points to original positions
        this.state.settings.gridCorrection.gridPoints.forEach(point => {
            point.x = point.originalX;
            point.y = point.originalY;
        });
        
        this.renderGrid();
        log('Grid reset to original positions');
    }

    updateFileEstimate() {
        if (!this.state.currentCanvas) return;
        
        const dimensions = this.upscaler.calculateOptimalDimensions(
            this.state.currentCanvas.width,
            this.state.currentCanvas.height,
            this.state.settings.targetSize
        );
        
        const estimate = this.upscaler.estimateFileSize(
            dimensions.width,
            dimensions.height,
            this.state.settings.outputFormat
        );
        
        log('File size estimate updated:', estimate.formatted);
        
        // Update UI with estimate
        if (this.ui.elements.fileInfo) {
            this.ui.elements.fileInfo.innerHTML = `📊 Estimated size: ~${estimate.formatted}`;
        }
    }

    // Debounced preview update for real-time adjustments - optimized for mobile
    debouncedPreviewUpdate = debounce(() => {
        this.updatePreview();
    }, 300); // Faster response for better UX

    async updatePreview() {
        if (!this.state.originalCanvas) {
            return;
        }
        
        try {
            // Start with the appropriate base image for preview
            let currentCanvas;
            
            if (this.ui.currentStep === 3) {
                // For Step 3 (Glare Removal), start with processed image from Step 2 if available
                currentCanvas = this.state.currentCanvas ? 
                    this.cloneCanvas(this.state.currentCanvas) : 
                    this.cloneCanvas(this.state.originalCanvas);
                
                // Apply lighting correction preview
                const inputMat = this.processor.canvasToMat(currentCanvas);
                if (inputMat) {
                    const correctedMat = this.processor.applyLightingCorrection(
                        inputMat, 
                        this.state.settings.lightingCorrectionStrength,
                        this.state.settings.contrastBoost,
                        this.state.settings.saturationBoost
                    );
                    const outputCanvas = this.processor.matToCanvas(correctedMat);
                    if (outputCanvas) {
                        currentCanvas = outputCanvas;
                    }
                    cleanupMats(inputMat, correctedMat);
                }
            } else {
                // For other steps, start with original image
                currentCanvas = this.cloneCanvas(this.state.originalCanvas);
            }
            
            // Update display
            this.displayImage(currentCanvas);
            log('Preview updated for step', this.ui.currentStep);
            
        } catch (error) {
            logError('Preview update failed:', error);
        }
    }

    // Lighting Correction Settings Update Methods
    updateLightingCorrectionStrength(value) {
        log('🎯 updateLightingCorrectionStrength called with:', value);
        log('Current step:', this.ui.currentStep, 'Step3PreviewMode:', this.state.step3PreviewMode);
        this.state.settings.lightingCorrectionStrength = value;
        log('✅ Settings updated. New value:', this.state.settings.lightingCorrectionStrength);
        
        // Real-time preview for Step 3
        if (this.ui.currentStep === 3 && this.state.step3PreviewMode) {
            log('🔄 Triggering preview update...');
            this.debouncedPreviewUpdate();
        } else {
            log('⏸️ Preview update skipped - currentStep:', this.ui.currentStep, 'previewMode:', this.state.step3PreviewMode);
        }
    }

    updateContrastBoost(value) {
        log('🎯 updateContrastBoost called with:', value);
        this.state.settings.contrastBoost = value;
        log('✅ Settings updated. New value:', this.state.settings.contrastBoost);
        
        // Real-time preview for Step 3
        if (this.ui.currentStep === 3 && this.state.step3PreviewMode) {
            log('🔄 Triggering preview update...');
            this.debouncedPreviewUpdate();
        } else {
            log('⏸️ Preview update skipped - currentStep:', this.ui.currentStep, 'previewMode:', this.state.step3PreviewMode);
        }
    }

    updateSaturationBoost(value) {
        log('🎯 updateSaturationBoost called with:', value);
        this.state.settings.saturationBoost = value;
        log('✅ Settings updated. New value:', this.state.settings.saturationBoost);
        
        // Real-time preview for Step 3
        if (this.ui.currentStep === 3 && this.state.step3PreviewMode) {
            log('🔄 Triggering preview update...');
            this.debouncedPreviewUpdate();
        } else {
            log('⏸️ Preview update skipped - currentStep:', this.ui.currentStep, 'previewMode:', this.state.step3PreviewMode);
        }
    }

    resetLightingSettings() {
        this.state.settings.lightingCorrectionStrength = 10;
        this.state.settings.contrastBoost = 1.10;
        this.state.settings.saturationBoost = 1.24;
        log('Lighting settings reset to defaults');
        
        // Update UI elements
        const lightingSlider = document.getElementById('lighting-strength-slider');
        const lightingValue = document.getElementById('lighting-strength-value');
        const contrastSlider = document.getElementById('contrast-boost-slider');
        const contrastValue = document.getElementById('contrast-boost-value');
        const saturationSlider = document.getElementById('saturation-boost-slider');
        const saturationValue = document.getElementById('saturation-boost-value');
        
        if (lightingSlider) lightingSlider.value = 10;
        if (lightingValue) lightingValue.textContent = '10';
        if (contrastSlider) contrastSlider.value = 1.10;
        if (contrastValue) contrastValue.textContent = '1.10';
        if (saturationSlider) saturationSlider.value = 1.24;
        if (saturationValue) saturationValue.textContent = '1.24';
        
        // Update preview
        if (this.ui.currentStep === 3 && this.state.step3PreviewMode) {
            this.updatePreview();
        }
    }

    // Download functionality
    async downloadImage() {
        const canvas = this.state.processedCanvas || this.state.currentCanvas;
        if (!canvas) {
            this.ui.showError('No image to download');
            return;
        }
        
        // Debug: Log canvas dimensions and source
        log('Download canvas info:', {
            width: canvas.width,
            height: canvas.height,
            isProcessed: !!this.state.processedCanvas,
            sourceCanvas: this.state.processedCanvas ? 'processedCanvas' : 'currentCanvas'
        });
        
        try {
            this.ui.showProgress('Preparing download...', 0);
            
            let format = 'image/jpeg';
            let quality = 0.95;
            let extension = '.jpg';
            
            switch(this.state.settings.outputFormat) {
                case 'jpeg-95':
                    quality = 0.95;
                    break;
                case 'jpeg-85':
                    quality = 0.85;
                    break;
                case 'png':
                    format = 'image/png';
                    extension = '.png';
                    break;
            }
            
            const blob = await canvasToBlob(canvas, format, quality);
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `painting_enhanced_${Date.now()}${extension}`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.ui.hideProgress();
            this.ui.showSuccess('Image downloaded successfully!');
            
            log('Image downloaded:', link.download);
            
        } catch (error) {
            this.ui.hideProgress();
            this.ui.showError('Download failed');
            logError('Download error:', error);
        }
    }

    // Memory monitoring
    setupMemoryMonitoring() {
        // Monitor memory usage every 30 seconds
        setInterval(() => {
            if (typeof performance !== 'undefined' && performance.memory) {
                const memory = performance.memory;
                const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
                log(`Memory usage: ${used}MB / ${total}MB, Active Mats: ${getMatCount()}`);
                
                // Warn if memory usage is high
                if (used > 100) {
                    log('High memory usage detected, consider cleanup');
                }
            }
        }, 30000);
    }

    // Cleanup
    cleanup() {
        this.processor.cleanup();
        this.upscaler.cleanup();
        log('Application cleaned up');
    }
}

// Global error handler
window.addEventListener('error', function(event) {
    logError('Global error:', event.error);
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    log('DOM loaded, waiting for OpenCV...');
});

// This will be called by the onOpenCvReady callback in index.html