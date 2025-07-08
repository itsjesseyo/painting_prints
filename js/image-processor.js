class ImageProcessor {
    constructor() {
        this.isOpenCVReady = false;
        this.currentMat = null;
        this.originalMat = null;
        
        // iPhone Pro camera distortion profiles
        this.cameraProfiles = {
            'iphone12pro': {
                name: 'iPhone 12 Pro',
                focalRatio: 0.75,
                distortionCoeffs: { k1: -0.12, k2: 0.03, k3: -0.008, p1: 0.001, p2: 0.001 }
            },
            'iphone13pro': {
                name: 'iPhone 13 Pro',
                focalRatio: 0.78,
                distortionCoeffs: { k1: -0.13, k2: 0.04, k3: -0.009, p1: 0.0015, p2: 0.0015 }
            },
            'iphone14pro': {
                name: 'iPhone 14 Pro',
                focalRatio: 0.80,
                distortionCoeffs: { k1: -0.14, k2: 0.045, k3: -0.01, p1: 0.002, p2: 0.002 }
            },
            'iphone15pro': {
                name: 'iPhone 15 Pro',
                focalRatio: 0.82,
                distortionCoeffs: { k1: -0.15, k2: 0.05, k3: -0.01, p1: 0.002, p2: 0.002 }
            },
            'generic': {
                name: 'Generic iPhone Pro',
                focalRatio: 0.8,
                distortionCoeffs: { k1: -0.15, k2: 0.05, k3: -0.01, p1: 0.002, p2: 0.002 }
            }
        };
        
        this.currentProfile = 'generic';
    }

    init() {
        this.isOpenCVReady = typeof cv !== 'undefined' && cv.Mat;
        log('ImageProcessor initialized, OpenCV ready:', this.isOpenCVReady);
        
        if (this.isOpenCVReady) {
            log('OpenCV version:', cv.getBuildInformation().split('\n')[0]);
        }
        
        return this.isOpenCVReady;
    }

    // Step 2: Enhanced Lens Correction for iPhone Pro
    correctLensDistortion(inputMat, intensity) {
        if (!this.isOpenCVReady) {
            log('OpenCV not available, skipping lens correction');
            return inputMat.clone();
        }

        log('Applying enhanced lens correction with intensity:', intensity, 'using profile:', this.currentProfile);
        
        try {
            // Optimize for mobile if needed
            const processingMat = this.optimizeImageForProcessing(inputMat);
            const isOptimized = processingMat.cols !== inputMat.cols || processingMat.rows !== inputMat.rows;
            
            const width = processingMat.cols;
            const height = processingMat.rows;
            
            // Get current camera profile
            const profile = this.cameraProfiles[this.currentProfile];
            
            // iPhone Pro camera parameters using profile-specific values
            const focalLength = Math.max(width, height) * profile.focalRatio;
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Create camera matrix with iPhone Pro characteristics
            const cameraMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
                focalLength, 0, centerX,
                0, focalLength, centerY,
                0, 0, 1
            ]);

            // Enhanced distortion coefficients using iPhone Pro profile
            // Intensity range: -100 to +100
            const normalizedIntensity = intensity / 100.0;
            
            // Use profile-specific distortion coefficients
            const k1 = normalizedIntensity * profile.distortionCoeffs.k1;
            const k2 = normalizedIntensity * profile.distortionCoeffs.k2;
            const k3 = normalizedIntensity * profile.distortionCoeffs.k3;
            const p1 = normalizedIntensity * profile.distortionCoeffs.p1;
            const p2 = normalizedIntensity * profile.distortionCoeffs.p2;
            
            const distCoeffs = cv.matFromArray(1, 5, cv.CV_64FC1, [k1, k2, p1, p2, k3]);

            let processedMat = new cv.Mat();
            
            // Apply undistortion with optimal interpolation
            cv.undistort(processingMat, processedMat, cameraMatrix, distCoeffs);
            
            // If we optimized for mobile, scale back up to original size
            let outputMat;
            if (isOptimized) {
                outputMat = new cv.Mat();
                cv.resize(processedMat, outputMat, new cv.Size(inputMat.cols, inputMat.rows), 0, 0, cv.INTER_CUBIC);
                processedMat.delete();
                log('Result scaled back to original size for mobile optimization');
            } else {
                outputMat = processedMat;
            }
            
            // Cleanup
            cameraMatrix.delete();
            distCoeffs.delete();
            processingMat.delete();
            
            log('Lens correction applied successfully using', profile.name);
            return outputMat;
            
        } catch (error) {
            logError('Lens correction failed:', error);
            return inputMat.clone();
        }
    }

    // Set camera profile for lens correction
    setCameraProfile(profileKey) {
        if (this.cameraProfiles[profileKey]) {
            this.currentProfile = profileKey;
            log('Camera profile set to:', this.cameraProfiles[profileKey].name);
        } else {
            log('Invalid camera profile, using generic:', profileKey);
            this.currentProfile = 'generic';
        }
    }

    // Performance optimization for mobile devices
    shouldOptimizeForMobile() {
        // Check device capabilities and current memory usage
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
        const isLowPowerMode = navigator.getBattery && navigator.getBattery().then(battery => battery.charging === false);
        
        return isMobile || hasLimitedMemory;
    }

    // Optimize image size for processing if needed
    optimizeImageForProcessing(inputMat) {
        if (!this.shouldOptimizeForMobile()) {
            return inputMat.clone();
        }
        
        const maxDimension = 2048; // Maximum dimension for mobile processing
        const currentMax = Math.max(inputMat.cols, inputMat.rows);
        
        if (currentMax <= maxDimension) {
            return inputMat.clone();
        }
        
        const scaleFactor = maxDimension / currentMax;
        const newWidth = Math.floor(inputMat.cols * scaleFactor);
        const newHeight = Math.floor(inputMat.rows * scaleFactor);
        
        let optimizedMat = new cv.Mat();
        cv.resize(inputMat, optimizedMat, new cv.Size(newWidth, newHeight), 0, 0, cv.INTER_AREA);
        
        log('Image optimized for mobile processing:', newWidth, 'x', newHeight);
        return optimizedMat;
    }

    // Automatic lens distortion detection for iPhone Pro images
    async detectLensDistortion(inputMat) {
        if (!this.isOpenCVReady) {
            log('OpenCV not available, using default lens correction');
            return 0;
        }

        log('Detecting lens distortion automatically...');
        
        try {
            // Use optimized image for detection
            const processingMat = this.optimizeImageForProcessing(inputMat);
            
            let gray = new cv.Mat();
            let edges = new cv.Mat();
            let lines = new cv.Mat();
            
            // Convert to grayscale
            cv.cvtColor(processingMat, gray, cv.COLOR_RGBA2GRAY);
            
            // Edge detection
            cv.Canny(gray, edges, 50, 150, 3, false);
            
            // Detect straight lines using HoughLines
            cv.HoughLines(edges, lines, 1, Math.PI / 180, 50, 0, 0, 0, Math.PI);
            
            // Analyze line curvature to estimate barrel distortion
            let totalCurvature = 0;
            let lineCount = 0;
            const width = processingMat.cols;
            const height = processingMat.rows;
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Sample points along detected lines to measure curvature
            for (let i = 0; i < lines.rows; i++) {
                const line = lines.data32F.slice(i * 2, i * 2 + 2);
                const rho = line[0];
                const theta = line[1];
                
                // Skip near-vertical and near-horizontal lines (less affected by barrel distortion)
                if (Math.abs(Math.cos(theta)) < 0.3 || Math.abs(Math.sin(theta)) < 0.3) {
                    continue;
                }
                
                // Calculate expected vs actual line position
                const a = Math.cos(theta);
                const b = Math.sin(theta);
                const x0 = a * rho;
                const y0 = b * rho;
                
                // Measure distance from image center
                const distanceFromCenter = Math.sqrt((x0 - centerX) ** 2 + (y0 - centerY) ** 2);
                const normalizedDistance = distanceFromCenter / Math.max(width, height);
                
                // Barrel distortion increases with distance from center
                if (normalizedDistance > 0.3) {
                    totalCurvature += normalizedDistance;
                    lineCount++;
                }
            }
            
            // Calculate average curvature and convert to correction intensity
            let suggestedIntensity = 0;
            if (lineCount > 0) {
                const avgCurvature = totalCurvature / lineCount;
                // Map curvature to correction intensity (0-100)
                suggestedIntensity = Math.min(100, Math.floor(avgCurvature * 150));
                
                // Apply camera profile bias
                const profile = this.cameraProfiles[this.currentProfile];
                if (profile && this.currentProfile !== 'generic') {
                    // iPhone Pro cameras typically need 20-40% correction
                    suggestedIntensity = Math.max(20, Math.min(suggestedIntensity, 60));
                }
            }
            
            // Cleanup
            cleanupMats(processingMat, gray, edges, lines);
            
            log('Automatic lens distortion detection completed. Suggested intensity:', suggestedIntensity);
            return suggestedIntensity;
            
        } catch (error) {
            logError('Lens distortion detection failed:', error);
            return 0;
        }
    }

    // Step 3: Perspective Correction
    async detectPaintingCorners(inputMat) {
        if (!this.isOpenCVReady) {
            log('OpenCV not available, returning default corners');
            return this.getDefaultCorners(inputMat);
        }

        log('Detecting painting corners automatically');
        
        try {
            let gray = new cv.Mat();
            let blurred = new cv.Mat();
            let edges = new cv.Mat();
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(inputMat, gray, cv.COLOR_RGBA2GRAY);
            
            // Apply Gaussian blur
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
            
            // Canny edge detection
            cv.Canny(blurred, edges, 50, 150);
            
            // Find contours
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            let bestContour = null;
            let maxArea = 0;
            
            // Find largest contour
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > maxArea && area > 1000) {
                    maxArea = area;
                    bestContour = contour;
                }
            }
            
            let corners = null;
            
            if (bestContour) {
                // Approximate contour to polygon
                let approx = new cv.Mat();
                const epsilon = 0.02 * cv.arcLength(bestContour, true);
                cv.approxPolyDP(bestContour, approx, epsilon, true);
                
                if (approx.rows === 4) {
                    // Extract corner points
                    corners = [];
                    for (let i = 0; i < 4; i++) {
                        const point = approx.data32S;
                        corners.push({
                            x: point[i * 2],
                            y: point[i * 2 + 1]
                        });
                    }
                    corners = orderPoints(corners);
                }
                
                approx.delete();
            }
            
            // Cleanup
            cleanupMats(gray, blurred, edges, hierarchy);
            contours.delete();
            
            return corners || this.getDefaultCorners(inputMat);
            
        } catch (error) {
            logError('Corner detection failed:', error);
            return this.getDefaultCorners(inputMat);
        }
    }

    getDefaultCorners(mat) {
        const margin = 0.1;
        const w = mat.cols;
        const h = mat.rows;
        
        return [
            { x: w * margin, y: h * margin },           // top-left
            { x: w * (1 - margin), y: h * margin },     // top-right
            { x: w * (1 - margin), y: h * (1 - margin) }, // bottom-right
            { x: w * margin, y: h * (1 - margin) }      // bottom-left
        ];
    }

    applyGridDistortionCorrection(inputMat, gridPoints, outputWidth, outputHeight) {
        if (!this.isOpenCVReady) {
            log('OpenCV not available, skipping grid correction');
            return inputMat.clone();
        }

        log('Applying 5x5 grid distortion correction');
        
        try {
            // Generate remap tables from grid points using bilinear interpolation
            const { map1, map2 } = this.generateRemapMaps(gridPoints, outputWidth, outputHeight, inputMat.cols, inputMat.rows);
            
            // Apply remap transformation
            let outputMat = new cv.Mat();
            cv.remap(inputMat, outputMat, map1, map2, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0, 0));
            
            // Cleanup
            map1.delete();
            map2.delete();
            
            return outputMat;
            
        } catch (error) {
            logError('Grid distortion correction failed:', error);
            return inputMat.clone();
        }
    }

    // Generate remap tables for 5x5 grid distortion correction
    generateRemapMaps(gridPoints, outputWidth, outputHeight, inputWidth, inputHeight) {
        // Create map matrices
        let map1 = new cv.Mat(outputHeight, outputWidth, cv.CV_32FC1);
        let map2 = new cv.Mat(outputHeight, outputWidth, cv.CV_32FC1);
        
        // Grid dimensions
        const gridRows = 5;
        const gridCols = 5;
        
        // For each output pixel, calculate corresponding input pixel using bilinear interpolation
        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                // Normalize output coordinates to grid space
                const gridX = (x / (outputWidth - 1)) * (gridCols - 1);
                const gridY = (y / (outputHeight - 1)) * (gridRows - 1);
                
                // Find grid cell
                const gridXInt = Math.floor(gridX);
                const gridYInt = Math.floor(gridY);
                const gridXFrac = gridX - gridXInt;
                const gridYFrac = gridY - gridYInt;
                
                // Clamp to grid bounds
                const x1 = Math.min(gridXInt, gridCols - 1);
                const y1 = Math.min(gridYInt, gridRows - 1);
                const x2 = Math.min(x1 + 1, gridCols - 1);
                const y2 = Math.min(y1 + 1, gridRows - 1);
                
                // Get grid points
                const p1 = gridPoints[y1 * gridCols + x1]; // top-left
                const p2 = gridPoints[y1 * gridCols + x2]; // top-right
                const p3 = gridPoints[y2 * gridCols + x1]; // bottom-left
                const p4 = gridPoints[y2 * gridCols + x2]; // bottom-right
                
                // Bilinear interpolation
                const srcX = p1.x * (1 - gridXFrac) * (1 - gridYFrac) +
                            p2.x * gridXFrac * (1 - gridYFrac) +
                            p3.x * (1 - gridXFrac) * gridYFrac +
                            p4.x * gridXFrac * gridYFrac;
                            
                const srcY = p1.y * (1 - gridXFrac) * (1 - gridYFrac) +
                            p2.y * gridXFrac * (1 - gridYFrac) +
                            p3.y * (1 - gridXFrac) * gridYFrac +
                            p4.y * gridXFrac * gridYFrac;
                
                // Set map values
                map1.data32F[y * outputWidth + x] = srcX;
                map2.data32F[y * outputWidth + x] = srcY;
            }
        }
        
        return { map1, map2 };
    }

    // Step 4: Glare Removal
    adjustBrightnessContrast(inputMat, brightness, contrast) {
        if (!this.isOpenCVReady) {
            log('OpenCV not available, skipping brightness/contrast adjustment');
            return inputMat.clone();
        }

        log('Adjusting brightness:', brightness, 'contrast:', contrast);
        
        try {
            let outputMat = new cv.Mat();
            
            // Apply brightness and contrast
            // alpha = contrast (0.5 to 2.0)
            // beta = brightness (-100 to +100)
            cv.convertScaleAbs(inputMat, outputMat, contrast, brightness);
            
            return outputMat;
            
        } catch (error) {
            logError('Brightness/contrast adjustment failed:', error);
            return inputMat.clone();
        }
    }

    // Step 5: Auto Color Correction
    autoColorCorrect(inputMat, intensity = 1.0) {
        if (!this.isOpenCVReady) {
            log('OpenCV not available, skipping color correction');
            return inputMat.clone();
        }

        log('Applying auto color correction with intensity:', intensity);
        
        try {
            let lab = new cv.Mat();
            let channels = new cv.MatVector();
            let outputMat = new cv.Mat();
            
            // Convert to LAB color space
            cv.cvtColor(inputMat, lab, cv.COLOR_RGBA2Lab);
            
            // Split channels
            cv.split(lab, channels);
            
            // Apply histogram equalization to L channel
            let lChannel = channels.get(0);
            let equalizedL = new cv.Mat();
            cv.equalizeHist(lChannel, equalizedL);
            
            // Blend with original based on intensity
            if (intensity < 1.0) {
                cv.addWeighted(lChannel, 1 - intensity, equalizedL, intensity, 0, equalizedL);
            }
            
            // Replace L channel
            let newChannels = new cv.MatVector();
            newChannels.push_back(equalizedL);
            newChannels.push_back(channels.get(1));
            newChannels.push_back(channels.get(2));
            
            // Merge channels
            let enhancedLab = new cv.Mat();
            cv.merge(newChannels, enhancedLab);
            
            // Convert back to RGBA
            cv.cvtColor(enhancedLab, outputMat, cv.COLOR_Lab2RGBA);
            
            // Cleanup
            cleanupMats(lab, equalizedL, enhancedLab);
            channels.delete();
            newChannels.delete();
            
            return outputMat;
            
        } catch (error) {
            logError('Color correction failed:', error);
            return inputMat.clone();
        }
    }

    // Utility Functions
    validateCanvasSize(width, height) {
        const maxPixels = 16777216; // Safari limit
        const totalPixels = width * height;
        
        if (totalPixels > maxPixels) {
            const scale = Math.sqrt(maxPixels / totalPixels);
            return {
                width: Math.floor(width * scale),
                height: Math.floor(height * scale),
                scaled: true,
                scaleFactor: scale
            };
        }
        
        return { width, height, scaled: false, scaleFactor: 1 };
    }

    matToCanvas(mat, canvasElement) {
        if (!this.isOpenCVReady || !mat) {
            logError('Cannot convert Mat to canvas: OpenCV not ready or invalid Mat');
            return null;
        }

        try {
            let canvas;
            
            if (typeof canvasElement === 'string') {
                canvas = document.getElementById(canvasElement);
            } else if (canvasElement instanceof HTMLCanvasElement) {
                canvas = canvasElement;
            } else {
                // Create new canvas if none provided
                canvas = document.createElement('canvas');
            }
            
            if (!canvas) {
                logError('Canvas not found or created');
                return null;
            }
            
            // Validate and adjust canvas size if needed
            const { width, height, scaled } = this.validateCanvasSize(mat.cols, mat.rows);
            
            canvas.width = width;
            canvas.height = height;
            
            if (scaled) {
                // Scale the Mat if canvas size was adjusted
                let scaledMat = new cv.Mat();
                cv.resize(mat, scaledMat, new cv.Size(width, height));
                cv.imshow(canvas, scaledMat);
                scaledMat.delete();
                log('Mat displayed on canvas with scaling:', width, 'x', height);
            } else {
                cv.imshow(canvas, mat);
                log('Mat displayed on canvas:', width, 'x', height);
            }
            
            return canvas;
            
        } catch (error) {
            logError('Failed to display Mat on canvas:', error);
            return null;
        }
    }

    canvasToMat(canvasElement) {
        if (!this.isOpenCVReady) {
            logError('Cannot convert canvas to Mat: OpenCV not ready');
            return null;
        }

        try {
            let canvas;
            
            if (typeof canvasElement === 'string') {
                canvas = document.getElementById(canvasElement);
            } else if (canvasElement instanceof HTMLCanvasElement) {
                canvas = canvasElement;
            } else {
                logError('Invalid canvas element provided');
                return null;
            }
            
            if (!canvas) {
                logError('Canvas not found');
                return null;
            }
            
            if (canvas.width === 0 || canvas.height === 0) {
                logError('Canvas has invalid dimensions');
                return null;
            }
            
            const mat = cv.imread(canvas);
            log('Canvas converted to Mat:', mat.cols, 'x', mat.rows, 'channels:', mat.channels());
            return mat;
            
        } catch (error) {
            logError('Failed to convert canvas to Mat:', error);
            return null;
        }
    }

    // Memory cleanup
    cleanup() {
        if (this.currentMat) {
            cleanupMat(this.currentMat);
            this.currentMat = null;
        }
        if (this.originalMat) {
            cleanupMat(this.originalMat);
            this.originalMat = null;
        }
        log('ImageProcessor cleaned up');
    }

    // Process entire pipeline
    async processImage(file, settings) {
        log('Processing image with settings:', settings);
        
        try {
            // Convert file to canvas
            const canvas = await fileToCanvas(file);
            
            // Convert canvas to Mat
            const inputMat = this.canvasToMat(canvas);
            if (!inputMat) {
                throw new Error('Failed to convert image to processing format');
            }
            
            this.originalMat = inputMat.clone();
            let currentMat = inputMat.clone();
            
            // Step 2: Lens correction
            if (settings.lensCorrection !== 0) {
                const correctedMat = this.correctLensDistortion(currentMat, settings.lensCorrection);
                cleanupMat(currentMat);
                currentMat = correctedMat;
            }
            
            // Step 2: Grid distortion correction
            if (settings.gridCorrection && settings.gridCorrection.gridPoints) {
                const correctedMat = this.applyGridDistortionCorrection(
                    currentMat, 
                    settings.gridCorrection.gridPoints,
                    settings.gridCorrection.outputWidth,
                    settings.gridCorrection.outputHeight
                );
                cleanupMat(currentMat);
                currentMat = correctedMat;
            }
            
            // Step 4: Brightness/contrast
            if (settings.brightness !== 0 || settings.contrast !== 1.0) {
                const adjustedMat = this.adjustBrightnessContrast(
                    currentMat, 
                    settings.brightness, 
                    settings.contrast
                );
                cleanupMat(currentMat);
                currentMat = adjustedMat;
            }
            
            // Step 5: Color correction
            if (settings.autoColor) {
                const colorCorrectedMat = this.autoColorCorrect(
                    currentMat, 
                    settings.colorIntensity / 100
                );
                cleanupMat(currentMat);
                currentMat = colorCorrectedMat;
            }
            
            this.currentMat = currentMat;
            cleanupMat(inputMat);
            
            log('Image processing pipeline completed');
            return currentMat;
            
        } catch (error) {
            logError('Image processing failed:', error);
            throw error;
        }
    }
}