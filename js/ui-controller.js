class UIController {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
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
            
            
            lightingStrengthSlider: document.getElementById('lighting-strength-slider'),
            lightingStrengthValue: document.getElementById('lighting-strength-value'),
            lightingEnabled: document.getElementById('lighting-enabled'),
            contrastBoostSlider: document.getElementById('contrast-boost-slider'),
            contrastBoostValue: document.getElementById('contrast-boost-value'),
            contrastEnabled: document.getElementById('contrast-enabled'),
            saturationBoostSlider: document.getElementById('saturation-boost-slider'),
            saturationBoostValue: document.getElementById('saturation-boost-value'),
            saturationEnabled: document.getElementById('saturation-enabled'),
            resetLighting: document.getElementById('reset-lighting'),
            
            autoColor: document.getElementById('auto-color'),
            colorIntensitySlider: document.getElementById('color-intensity-slider'),
            colorIntensityValue: document.getElementById('color-intensity-value'),
            
            printSize: document.getElementById('print-size'),
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
        
        // Step 3: Color Correction (includes lighting, contrast, saturation, and auto color)
        this.elements.lightingStrengthSlider?.addEventListener('input', this.handleLightingStrengthAdjustment.bind(this));
        this.elements.lightingEnabled?.addEventListener('change', this.handleLightingToggle.bind(this));
        this.elements.contrastBoostSlider?.addEventListener('input', this.handleContrastBoostAdjustment.bind(this));
        this.elements.contrastEnabled?.addEventListener('change', this.handleContrastToggle.bind(this));
        this.elements.saturationBoostSlider?.addEventListener('input', this.handleSaturationBoostAdjustment.bind(this));
        this.elements.saturationEnabled?.addEventListener('change', this.handleSaturationToggle.bind(this));
        this.elements.autoColor?.addEventListener('change', this.handleAutoColorToggle.bind(this));
        this.elements.colorIntensitySlider?.addEventListener('input', this.handleColorIntensityAdjustment.bind(this));
        this.elements.resetLighting?.addEventListener('click', () => this.resetLightingSettings());
        
        // Debug: Log which Step 3 elements were found
        log('Step 3 elements found:', {
            lightingStrengthSlider: !!this.elements.lightingStrengthSlider,
            lightingStrengthValue: !!this.elements.lightingStrengthValue,
            contrastBoostSlider: !!this.elements.contrastBoostSlider,
            contrastBoostValue: !!this.elements.contrastBoostValue,
            saturationBoostSlider: !!this.elements.saturationBoostSlider,
            saturationBoostValue: !!this.elements.saturationBoostValue,
            resetLighting: !!this.elements.resetLighting
        });
        
        // Step 4: Super Resolution
        this.elements.printSize?.addEventListener('change', this.handlePrintSizeChange.bind(this));
        this.elements.generateBtn?.addEventListener('click', () => this.handleGenerateHighRes());
        
        // Step 5: Download
        this.elements.outputFormat?.addEventListener('change', this.handleFormatChange.bind(this));
        
        // Before/After toggles (Step 2 and 4 only)
        this.elements.beforeAfter2?.addEventListener('click', () => this.toggleBeforeAfter(2));
        this.elements.beforeAfter4?.addEventListener('click', () => this.toggleBeforeAfter(4));
        
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
                
                // For step 3, initialize with preview mode on
                if (stepNumber === 3) {
                    setTimeout(() => {
                        window.app.initializeStep3();
                    }, 100);
                }
            }
        }
    }

    goToNextStep() {
        if (this.currentStep === 5) {
            // Download on step 5
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
            1: 'Step 1 of 5: Upload Image',
            2: 'Step 2 of 5: Grid Correction',
            3: 'Step 3 of 5: Color Correction',
            4: 'Step 4 of 5: Super Resolution',
            5: 'Step 5 of 5: Download'
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
        
        // Skip button (hide on step 1 and 5)
        if (this.elements.skipBtn) {
            this.elements.skipBtn.style.display = (this.currentStep === 1 || this.currentStep === 5) ? 'none' : 'block';
        }
        
        // Apply button (show for step 2 and 4, but not 3 since it has real-time preview)
        if (this.elements.applyBtn) {
            this.elements.applyBtn.style.display = (this.currentStep === 2) ? 'block' : 'none';
        }
        
        // Next button
        if (this.elements.nextBtn) {
            if (this.currentStep === 5) {
                this.elements.nextBtn.textContent = '📥 Download';
                this.elements.nextBtn.disabled = false;
            } else if (this.currentStep === 4) {
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

    // Step 3: Lighting Correction Handlers
    handleLightingStrengthAdjustment(e) {
        const value = parseInt(e.target.value);
        log('🔧 handleLightingStrengthAdjustment called with value:', value);
        if (this.elements.lightingStrengthValue) {
            this.elements.lightingStrengthValue.textContent = value;
            log('✅ Updated UI value display to:', value);
        } else {
            log('❌ lightingStrengthValue element not found');
        }
        log('📞 Calling window.app?.updateLightingCorrectionStrength');
        window.app?.updateLightingCorrectionStrength(value);
    }

    handleContrastBoostAdjustment(e) {
        const value = parseFloat(e.target.value);
        log('🔧 handleContrastBoostAdjustment called with value:', value);
        if (this.elements.contrastBoostValue) {
            this.elements.contrastBoostValue.textContent = value.toFixed(2);
            log('✅ Updated UI value display to:', value.toFixed(2));
        } else {
            log('❌ contrastBoostValue element not found');
        }
        log('📞 Calling window.app?.updateContrastBoost');
        window.app?.updateContrastBoost(value);
    }

    handleSaturationBoostAdjustment(e) {
        const value = parseFloat(e.target.value);
        log('🔧 handleSaturationBoostAdjustment called with value:', value);
        if (this.elements.saturationBoostValue) {
            this.elements.saturationBoostValue.textContent = value.toFixed(2);
            log('✅ Updated UI value display to:', value.toFixed(2));
        } else {
            log('❌ saturationBoostValue element not found');
        }
        log('📞 Calling window.app?.updateSaturationBoost');
        window.app?.updateSaturationBoost(value);
    }

    handleLightingToggle(e) {
        const enabled = e.target.checked;
        log('🔧 handleLightingToggle called with enabled:', enabled);
        if (this.elements.lightingStrengthSlider) {
            this.elements.lightingStrengthSlider.disabled = !enabled;
        }
        window.app?.updateLightingEnabled(enabled);
    }

    handleContrastToggle(e) {
        const enabled = e.target.checked;
        log('🔧 handleContrastToggle called with enabled:', enabled);
        if (this.elements.contrastBoostSlider) {
            this.elements.contrastBoostSlider.disabled = !enabled;
        }
        window.app?.updateContrastEnabled(enabled);
    }

    handleSaturationToggle(e) {
        const enabled = e.target.checked;
        log('🔧 handleSaturationToggle called with enabled:', enabled);
        if (this.elements.saturationBoostSlider) {
            this.elements.saturationBoostSlider.disabled = !enabled;
        }
        window.app?.updateSaturationEnabled(enabled);
    }

    handleAutoColorToggle(e) {
        const enabled = e.target.checked;
        log('🔧 handleAutoColorToggle called with enabled:', enabled);
        if (this.elements.colorIntensitySlider) {
            this.elements.colorIntensitySlider.disabled = !enabled;
        }
        window.app?.updateAutoColorEnabled(enabled);
    }

    resetLightingSettings() {
        // Reset sliders and values
        if (this.elements.lightingStrengthSlider) {
            this.elements.lightingStrengthSlider.value = 10;
            this.elements.lightingStrengthValue.textContent = '10';
        }
        if (this.elements.contrastBoostSlider) {
            this.elements.contrastBoostSlider.value = 1.10;
            this.elements.contrastBoostValue.textContent = '1.10';
        }
        if (this.elements.saturationBoostSlider) {
            this.elements.saturationBoostSlider.value = 1.24;
            this.elements.saturationBoostValue.textContent = '1.24';
        }
        
        // Reset color intensity slider and value
        if (this.elements.colorIntensitySlider) {
            this.elements.colorIntensitySlider.value = 75;
            this.elements.colorIntensityValue.textContent = '75';
        }
        
        // Reset checkboxes to disabled (false) and disable sliders
        if (this.elements.lightingEnabled) {
            this.elements.lightingEnabled.checked = false;
            if (this.elements.lightingStrengthSlider) {
                this.elements.lightingStrengthSlider.disabled = true;
            }
        }
        if (this.elements.contrastEnabled) {
            this.elements.contrastEnabled.checked = false;
            if (this.elements.contrastBoostSlider) {
                this.elements.contrastBoostSlider.disabled = true;
            }
        }
        if (this.elements.saturationEnabled) {
            this.elements.saturationEnabled.checked = false;
            if (this.elements.saturationBoostSlider) {
                this.elements.saturationBoostSlider.disabled = true;
            }
        }
        if (this.elements.autoColor) {
            this.elements.autoColor.checked = false;
            if (this.elements.colorIntensitySlider) {
                this.elements.colorIntensitySlider.disabled = true;
            }
        }
        
        log('Lighting settings reset');
        window.app?.resetLightingSettings();
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
        // File size info is now displayed in the select options
        // No need to update separate elements
        log('Print size selected:', size);
    }

    async handleGenerateHighRes() {
        log('Generating high-resolution image...');
        this.elements.generateBtn.disabled = true;
        this.elements.generateBtn.textContent = 'Processing...';
        
        this.showProgress('Generating high-resolution image...', 0);
        
        try {
            // Call the actual super resolution processing
            await window.app?.handleGenerateHighRes();
            
            this.hideProgress();
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.textContent = '🚀 Generate High-Resolution';
            this.elements.nextBtn.disabled = false;
            this.showSuccess('High-resolution image generated!');
            
        } catch (error) {
            this.hideProgress();
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.textContent = '🚀 Generate High-Resolution';
            this.showError('High-resolution generation failed');
            logError('Generate high-res error:', error);
        }
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