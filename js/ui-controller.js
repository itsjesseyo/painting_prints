class UIController {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.elements = {};
        this.beforeAfterState = {}; // Track before/after state for each step
    }

    init() {
        log('UI Controller initializing...');
        this.cacheElements();
        this.setupEventListeners();
        this.setupStepNavigation();
        this.updateUI();
        log('UI Controller initialized successfully');
    }

    cacheElements() {
        this.elements = {
            // Progress and navigation
            stepIndicator: document.getElementById('step-indicator'),
            progressFill: document.getElementById('progress-fill'),
            stepText: document.getElementById('step-text'),
            
            // Navigation buttons
            backBtn: document.getElementById('back-btn'),
            skipBtn: document.getElementById('skip-btn'),
            applyBtn: document.getElementById('apply-btn'),
            nextBtn: document.getElementById('next-btn'),
            
            // Main content
            mainContent: document.getElementById('main-content'),
            imageCanvas: document.getElementById('image-canvas'),
            
            // Step containers
            stepContainers: {},
            controlsContainers: {},
            
            // Upload elements
            uploadArea: document.getElementById('upload-area'),
            fileInput: document.getElementById('file-input'),
            
            // Controls
            optimizeGrid: document.getElementById('optimize-grid'),
            resetGrid: document.getElementById('reset-grid'),
            
            
            brightnessSlider: document.getElementById('brightness-slider'),
            brightnessValue: document.getElementById('brightness-value'),
            contrastSlider: document.getElementById('contrast-slider'),
            contrastValue: document.getElementById('contrast-value'),
            resetGlare: document.getElementById('reset-glare'),
            
            autoColor: document.getElementById('auto-color'),
            colorIntensitySlider: document.getElementById('color-intensity-slider'),
            colorIntensityValue: document.getElementById('color-intensity-value'),
            
            printSize: document.getElementById('print-size'),
            fileInfo: document.getElementById('file-info'),
            sizeWarning: document.getElementById('size-warning'),
            generateBtn: document.getElementById('generate-btn'),
            
            outputFormat: document.getElementById('output-format'),
            
            // Overlays and toasts
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingMessage: document.getElementById('loading-message'),
            loadingProgress: document.getElementById('loading-progress'),
            errorToast: document.getElementById('error-toast'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close'),
            successToast: document.getElementById('success-toast'),
            successMessage: document.getElementById('success-message'),
            successClose: document.getElementById('success-close')
        };
        
        // Cache step containers and controls
        for (let i = 1; i <= this.totalSteps; i++) {
            this.elements.stepContainers[i] = document.getElementById(`step-${i}`);
            this.elements.controlsContainers[i] = document.getElementById(`controls-${i}`);
        }
        
        // Cache before/after toggles
        for (let i = 2; i <= 5; i++) {
            this.elements[`beforeAfter${i}`] = document.getElementById(`before-after-${i}`);
        }
        
        // Debug: Check if critical elements were found
        log('UI elements cached');
        log('Navigation elements found:', {
            backBtn: !!this.elements.backBtn,
            skipBtn: !!this.elements.skipBtn,
            applyBtn: !!this.elements.applyBtn,
            nextBtn: !!this.elements.nextBtn
        });
    }

    setupEventListeners() {
        // Navigation
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => {
                log('Back button clicked');
                this.goToPreviousStep();
            });
        }
        
        if (this.elements.skipBtn) {
            this.elements.skipBtn.addEventListener('click', () => {
                log('Skip button clicked');
                this.skipCurrentStep();
            });
        }
        
        if (this.elements.applyBtn) {
            this.elements.applyBtn.addEventListener('click', () => {
                log('Apply button clicked');
                this.applyCurrentStep();
            });
        }
        
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => {
                log('Next button clicked');
                this.goToNextStep();
            });
        }
        
        // Upload
        this.elements.uploadArea?.addEventListener('click', () => this.elements.fileInput?.click());
        this.elements.uploadArea?.addEventListener('dragover', this.handleDragOver.bind(this));
        this.elements.uploadArea?.addEventListener('drop', this.handleDrop.bind(this));
        this.elements.fileInput?.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Step 2: Grid Correction
        this.elements.optimizeGrid?.addEventListener('click', () => this.handleOptimizeGrid());
        this.elements.resetGrid?.addEventListener('click', () => this.handleResetGrid());
        
        // Step 3: Glare Removal (was Step 4)
        
        this.elements.brightnessSlider?.addEventListener('input', this.handleBrightnessAdjustment.bind(this));
        this.elements.contrastSlider?.addEventListener('input', this.handleContrastAdjustment.bind(this));
        this.elements.resetGlare?.addEventListener('click', () => this.resetGlareSettings());
        
        // Step 4: Color Correction (was Step 5)
        this.elements.autoColor?.addEventListener('change', this.handleAutoColorToggle.bind(this));
        this.elements.colorIntensitySlider?.addEventListener('input', this.handleColorIntensityAdjustment.bind(this));
        
        // Step 5: Super Resolution (was Step 6)
        this.elements.printSize?.addEventListener('change', this.handlePrintSizeChange.bind(this));
        this.elements.generateBtn?.addEventListener('click', () => this.handleGenerateHighRes());
        
        // Step 6: Download (was Step 7)
        this.elements.outputFormat?.addEventListener('change', this.handleFormatChange.bind(this));
        
        // Before/After toggles
        for (let i = 2; i <= 5; i++) {
            this.elements[`beforeAfter${i}`]?.addEventListener('click', () => this.toggleBeforeAfter(i));
        }
        
        // Toast close buttons
        this.elements.errorClose?.addEventListener('click', () => this.hideError());
        this.elements.successClose?.addEventListener('click', () => this.hideSuccess());
        
        log('Event listeners setup complete');
    }

    setupStepNavigation() {
        // Initialize navigation state
        this.updateNavigationButtons();
    }

    setupCornerHandles() {
        const handles = document.querySelectorAll('.corner-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', this.startCornerDrag.bind(this));
            handle.addEventListener('touchstart', this.startCornerDrag.bind(this));
        });
    }

    // Navigation Methods
    goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.totalSteps) return;
        
        log(`Navigating to step ${stepNumber}`);
        
        // Hide current step
        this.elements.stepContainers[this.currentStep]?.classList.remove('active');
        this.elements.controlsContainers[this.currentStep]?.classList.remove('active');
        
        // Show new step
        this.currentStep = stepNumber;
        this.elements.stepContainers[this.currentStep]?.classList.add('active');
        this.elements.controlsContainers[this.currentStep]?.classList.add('active');
        
        // Handle step-specific state restoration
        this.handleStepTransition(stepNumber);
        
        this.updateUI();
    }

    handleStepTransition(stepNumber) {
        if (stepNumber === 1) {
            // Returning to step 1 - check if we need to show/hide upload area
            const hasFile = window.app?.state?.originalFile;
            const uploadArea = document.getElementById('upload-area');
            const canvas = this.elements.imageCanvas;
            
            if (hasFile && uploadArea && canvas) {
                // File exists - hide upload area, show canvas
                uploadArea.style.display = 'none';
                canvas.style.display = 'block';
                // Redisplay the current image
                if (window.app?.state?.currentCanvas) {
                    window.app.displayImage(window.app.state.currentCanvas);
                }
                log('Step 1: Restored image view');
            } else if (uploadArea) {
                // No file - show upload area
                uploadArea.style.display = 'flex';
                if (canvas) canvas.style.display = 'none';
                log('Step 1: Showing upload area');
            }
        } else {
            // For other steps, show the current image on the step canvas
            const hasFile = window.app?.state?.originalFile;
            if (hasFile && window.app?.state?.currentCanvas) {
                window.app.displayImage(window.app.state.currentCanvas);
                log(`Step ${stepNumber}: Displayed current image`);
                
                // For step 2, initialize grid
                if (stepNumber === 2) {
                    setTimeout(() => {
                        window.app.initializeGridStep();
                    }, 500); // Longer delay to ensure canvas is rendered
                }
            }
        }
    }

    goToNextStep() {
        if (this.currentStep === 6) {
            // Download on step 6
            window.app?.downloadImage();
        } else if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        }
    }

    goToPreviousStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }

    skipCurrentStep() {
        log(`Skipping step ${this.currentStep}`);
        this.goToNextStep();
    }

    applyCurrentStep() {
        log(`Applying step ${this.currentStep}`);
        // This will be handled by the main app controller
        window.app?.applyCurrentStep();
    }

    updateUI() {
        this.updateProgressBar();
        this.updateStepText();
        this.updateNavigationButtons();
    }

    updateProgressBar() {
        const progressPercent = (this.currentStep / this.totalSteps) * 100;
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progressPercent}%`;
        }
    }

    updateStepText() {
        const stepTexts = {
            1: 'Step 1 of 6: Upload Image',
            2: 'Step 2 of 6: Grid Correction',
            3: 'Step 3 of 6: Glare Removal',
            4: 'Step 4 of 6: Color Correction',
            5: 'Step 5 of 6: Super Resolution',
            6: 'Step 6 of 6: Download'
        };
        
        if (this.elements.stepText) {
            this.elements.stepText.textContent = stepTexts[this.currentStep] || '';
        }
    }

    updateNavigationButtons() {
        // Back button
        if (this.elements.backBtn) {
            this.elements.backBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        }
        
        // Skip button (hide on step 1 and 7)
        if (this.elements.skipBtn) {
            this.elements.skipBtn.style.display = (this.currentStep === 1 || this.currentStep === 7) ? 'none' : 'block';
        }
        
        // Apply button (show for steps 2-4)
        if (this.elements.applyBtn) {
            this.elements.applyBtn.style.display = (this.currentStep >= 2 && this.currentStep <= 4) ? 'block' : 'none';
        }
        
        // Next button
        if (this.elements.nextBtn) {
            if (this.currentStep === 6) {
                this.elements.nextBtn.textContent = '📥 Download';
                this.elements.nextBtn.disabled = false;
            } else if (this.currentStep === 6) {
                this.elements.nextBtn.textContent = 'Next';
                this.elements.nextBtn.disabled = true; // Enable after generation
            } else {
                this.elements.nextBtn.textContent = 'Next';
                // On step 1, only disable if no file has been uploaded
                if (this.currentStep === 1) {
                    const hasFile = window.app?.state?.originalFile;
                    if (!hasFile) {
                        this.elements.nextBtn.disabled = true;
                    }
                    // If file exists, keep button enabled (don't change current state)
                } else {
                    // For other steps, enable by default
                    this.elements.nextBtn.disabled = false;
                }
            }
            log('Next button state updated:', this.elements.nextBtn.disabled ? 'disabled' : 'enabled');
        }
    }

    // File Upload Handlers
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea?.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea?.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        log('File selected:', file.name, file.size);
        const validation = validateImageFile(file);
        
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }
        
        // Notify main app first
        window.app?.handleFileUpload(file);
        
        // Enable next button after successful upload
        this.enableNextButton();
        
        this.showSuccess('Image uploaded successfully!');
    }

    enableNextButton() {
        if (this.elements.nextBtn) {
            this.elements.nextBtn.disabled = false;
            log('Next button enabled');
        }
    }

    // Step 2: Lens Correction Handlers
    handleLensAdjustment(e) {
        const value = parseInt(e.target.value);
        if (this.elements.lensValue) {
            this.elements.lensValue.textContent = value;
        }
        log('Lens correction adjustment:', value);
        window.app?.updateLensCorrection(value);
    }

    resetLensCorrection() {
        if (this.elements.lensSlider) {
            this.elements.lensSlider.value = 0;
            this.elements.lensValue.textContent = '0';
        }
        log('Lens correction reset');
        window.app?.updateLensCorrection(0);
    }

    // Step 2: Camera Profile Handler
    handleCameraProfileChange(e) {
        const profile = e.target.value;
        log('Camera profile changed to:', profile);
        window.app?.setCameraProfile(profile);
    }

    // Step 2: Auto-Detect Lens Distortion Handler
    handleAutoDetectLens() {
        log('Auto-detecting lens distortion...');
        this.showProgress('Analyzing lens distortion...', 0);
        window.app?.autoDetectLensDistortion();
    }

    // Step 3: Perspective Handlers
    handleAutoDetect() {
        log('Auto-detecting perspective corners...');
        this.showProgress('Detecting corners...', 0);
        
        // Simulate detection process
        setTimeout(() => {
            this.hideProgress();
            this.showSuccess('Corners detected automatically!');
            window.app?.autoDetectPerspective();
        }, 1500);
    }

    toggleGrid(e) {
        const showGrid = e.target.checked;
        if (this.elements.gridOverlay) {
            this.elements.gridOverlay.style.display = showGrid ? 'block' : 'none';
        }
        log('Grid overlay:', showGrid ? 'shown' : 'hidden');
    }

    startCornerDrag(e) {
        e.preventDefault();
        const corner = e.target.dataset.corner;
        log('Corner drag started:', corner);
        
        // This would implement actual dragging logic
        window.app?.startCornerDrag(corner, e);
    }

    // Step 4: Glare Removal Handlers
    handleBrightnessAdjustment(e) {
        const value = parseInt(e.target.value);
        if (this.elements.brightnessValue) {
            this.elements.brightnessValue.textContent = value;
        }
        log('Brightness adjustment:', value);
        window.app?.updateBrightness(value);
    }

    handleContrastAdjustment(e) {
        const value = parseFloat(e.target.value);
        if (this.elements.contrastValue) {
            this.elements.contrastValue.textContent = value.toFixed(1);
        }
        log('Contrast adjustment:', value);
        window.app?.updateContrast(value);
    }

    resetGlareSettings() {
        if (this.elements.brightnessSlider) {
            this.elements.brightnessSlider.value = 0;
            this.elements.brightnessValue.textContent = '0';
        }
        if (this.elements.contrastSlider) {
            this.elements.contrastSlider.value = 1.0;
            this.elements.contrastValue.textContent = '1.0';
        }
        log('Glare settings reset');
        window.app?.resetGlareSettings();
    }

    // Step 5: Color Correction Handlers
    handleAutoColorToggle(e) {
        const enabled = e.target.checked;
        log('Auto color correction:', enabled ? 'enabled' : 'disabled');
        window.app?.toggleAutoColor(enabled);
    }

    handleColorIntensityAdjustment(e) {
        const value = parseInt(e.target.value);
        if (this.elements.colorIntensityValue) {
            this.elements.colorIntensityValue.textContent = value;
        }
        log('Color intensity adjustment:', value);
        window.app?.updateColorIntensity(value);
    }

    // Step 6: Super Resolution Handlers
    handlePrintSizeChange(e) {
        const size = e.target.value;
        log('Print size changed:', size);
        this.updateFileInfo(size);
        window.app?.updatePrintSize(size);
    }

    handleOptimizeGrid() {
        log('Optimize grid clicked');
        window.app?.optimizeGridSpacing();
    }
    
    handleResetGrid() {
        log('Reset grid clicked');
        window.app?.resetGrid();
    }
    
    updateFileInfo(size) {
        const sizeMap = {
            '8x10': { pixels: '2400×3000px', mb: 15 },
            '11x14': { pixels: '3300×4200px', mb: 25 },
            '16x20': { pixels: '4800×6000px', mb: 35 },
            '18x24': { pixels: '5400×7200px', mb: 45 },
            '24x30': { pixels: '7200×9000px', mb: 65 },
            '30x40': { pixels: '9000×12000px', mb: 85 }
        };
        
        const info = sizeMap[size];
        if (info && this.elements.fileInfo) {
            this.elements.fileInfo.innerHTML = `📊 Estimated size: ~${info.mb}MB JPEG`;
        }
        
        // Show warning for large files
        if (this.elements.sizeWarning) {
            this.elements.sizeWarning.style.display = info && info.mb > 50 ? 'block' : 'none';
        }
    }

    handleGenerateHighRes() {
        log('Generating high-resolution image...');
        this.elements.generateBtn.disabled = true;
        this.elements.generateBtn.textContent = 'Processing...';
        
        this.showProgress('Generating high-resolution image...', 0);
        
        // Simulate processing
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            this.updateProgress(progress);
            
            if (progress >= 100) {
                clearInterval(interval);
                this.hideProgress();
                this.elements.generateBtn.disabled = false;
                this.elements.generateBtn.textContent = '🚀 Generate High-Resolution';
                this.elements.nextBtn.disabled = false;
                this.showSuccess('High-resolution image generated!');
                window.app?.completeGeneration();
            }
        }, 500);
    }

    // Step 7: Download Handlers
    handleFormatChange(e) {
        const format = e.target.value;
        log('Output format changed:', format);
        window.app?.updateOutputFormat(format);
    }

    // Before/After Toggle
    toggleBeforeAfter(step) {
        const currentState = this.beforeAfterState[step] || false;
        this.beforeAfterState[step] = !currentState;
        
        const button = this.elements[`beforeAfter${step}`];
        if (button) {
            button.textContent = this.beforeAfterState[step] ? 'After' : 'Before';
            button.classList.toggle('active', this.beforeAfterState[step]);
        }
        
        log(`Step ${step} before/after toggled:`, this.beforeAfterState[step] ? 'after' : 'before');
        window.app?.toggleBeforeAfter(step, this.beforeAfterState[step]);
    }

    // Progress and Status Methods
    showProgress(message, percentage = 0) {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('hidden');
        }
        if (this.elements.loadingMessage) {
            this.elements.loadingMessage.textContent = message;
        }
        this.updateProgress(percentage);
    }

    updateProgress(percentage) {
        if (this.elements.loadingProgress) {
            this.elements.loadingProgress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    hideProgress() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    showError(message, canRetry = false) {
        logError('Error:', message);
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        if (this.elements.errorToast) {
            this.elements.errorToast.classList.remove('hidden');
            setTimeout(() => this.hideError(), 5000);
        }
    }

    hideError() {
        if (this.elements.errorToast) {
            this.elements.errorToast.classList.add('hidden');
        }
    }

    showSuccess(message) {
        log('Success:', message);
        if (this.elements.successMessage) {
            this.elements.successMessage.textContent = message;
        }
        if (this.elements.successToast) {
            this.elements.successToast.classList.remove('hidden');
            setTimeout(() => this.hideSuccess(), 3000);
        }
    }

    hideSuccess() {
        if (this.elements.successToast) {
            this.elements.successToast.classList.add('hidden');
        }
    }
}