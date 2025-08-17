class FitPrint {
    constructor() {
        this.images = [];
        this.layout = [];
        this.initializeEventListeners();
        this.initializeTheme();
    }

    initializeEventListeners() {
        const imageInput = document.getElementById('imageInput');
        const generateBtn = document.getElementById('generateLayout');
        const exportBtn = document.getElementById('exportPDF');
        const themeToggle = document.getElementById('themeToggle');
        const paperSize = document.getElementById('paperSize');
        const paperOrientation = document.getElementById('paperOrientation');
        const fileUpload = document.querySelector('.file-upload');
        
        // Paper setting inputs for real-time validation
        const paperWidth = document.getElementById('paperWidth');
        const paperHeight = document.getElementById('paperHeight');
        const outerMargin = document.getElementById('outerMargin');

        imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        generateBtn.addEventListener('click', () => this.generateLayout());
        exportBtn.addEventListener('click', () => this.exportToPDF());
        themeToggle.addEventListener('click', () => this.toggleTheme());
        paperSize.addEventListener('change', (e) => this.handlePaperSizeChange(e));
        paperOrientation.addEventListener('change', (e) => this.handleOrientationChange(e));
        
        // Drag & Drop events
        fileUpload.addEventListener('dragover', (e) => this.handleDragOver(e));
        fileUpload.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        fileUpload.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        fileUpload.addEventListener('drop', (e) => this.handleDrop(e));
        fileUpload.addEventListener('click', () => imageInput.click());
        
        // Add real-time validation when paper settings change
        paperWidth.addEventListener('input', () => {
            this.validateAllImages();
            this.checkForCustomSize();
        });
        paperHeight.addEventListener('input', () => {
            this.validateAllImages();
            this.checkForCustomSize();
        });
        outerMargin.addEventListener('input', () => this.validateAllImages());
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('fitprint-theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('fitprint-theme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    handlePaperSizeChange(event) {
        const selectedSize = event.target.value;
        const paperSizes = {
            'a4': { width: 210, height: 297 },
            'a3': { width: 297, height: 420 },
            'a5': { width: 148, height: 210 },
            'letter': { width: 216, height: 279 },
            'legal': { width: 216, height: 356 },
            'tabloid': { width: 279, height: 432 },
            'photo4x6': { width: 102, height: 152 },
            'photo5x7': { width: 127, height: 178 },
            'photo8x10': { width: 203, height: 254 }
        };

        if (selectedSize !== 'custom' && paperSizes[selectedSize]) {
            const size = paperSizes[selectedSize];
            document.getElementById('paperWidth').value = size.width;
            document.getElementById('paperHeight').value = size.height;
            
            // Apply orientation if not auto
            this.applyOrientation();
            
            // Trigger validation after changing paper size
            this.validateAllImages();
        }
    }

    handleOrientationChange(event) {
        this.applyOrientation();
        this.validateAllImages();
    }

    applyOrientation() {
        const orientation = document.getElementById('paperOrientation').value;
        const widthInput = document.getElementById('paperWidth');
        const heightInput = document.getElementById('paperHeight');
        
        let width = parseFloat(widthInput.value);
        let height = parseFloat(heightInput.value);
        
        if (orientation === 'landscape' && width < height) {
            // Swap to landscape
            widthInput.value = height;
            heightInput.value = width;
        } else if (orientation === 'portrait' && width > height) {
            // Swap to portrait
            widthInput.value = height;
            heightInput.value = width;
        }
        // For 'auto', we'll determine the best orientation during layout generation
    }

    checkForCustomSize() {
        const currentWidth = parseFloat(document.getElementById('paperWidth').value);
        const currentHeight = parseFloat(document.getElementById('paperHeight').value);
        const paperSizeSelect = document.getElementById('paperSize');
        
        const paperSizes = {
            'a4': { width: 210, height: 297 },
            'a3': { width: 297, height: 420 },
            'a5': { width: 148, height: 210 },
            'letter': { width: 216, height: 279 },
            'legal': { width: 216, height: 356 },
            'tabloid': { width: 279, height: 432 },
            'photo4x6': { width: 102, height: 152 },
            'photo5x7': { width: 127, height: 178 },
            'photo8x10': { width: 203, height: 254 }
        };

        // Check if current dimensions match any preset
        let matchingSize = 'custom';
        for (const [sizeName, dimensions] of Object.entries(paperSizes)) {
            if (Math.abs(dimensions.width - currentWidth) < 0.1 && 
                Math.abs(dimensions.height - currentHeight) < 0.1) {
                matchingSize = sizeName;
                break;
            }
        }

        paperSizeSelect.value = matchingSize;
    }

    applyScaling(images, printableWidth, printableHeight, scaleMode, minSize, maxSize) {
        return images.map(img => {
            let newWidth = img.width;
            let newHeight = img.height;
            const aspectRatio = img.aspectRatio;
            
            // Calculate current size constraints
            const currentMaxDim = Math.max(newWidth, newHeight);
            const currentMinDim = Math.min(newWidth, newHeight);
            
            // Apply scaling based on mode
            switch (scaleMode) {
                case 'down':
                    // Scale down if too large
                    if (newWidth > printableWidth || newHeight > printableHeight) {
                        const scale = Math.min(printableWidth / newWidth, printableHeight / newHeight);
                        newWidth *= scale;
                        newHeight *= scale;
                    }
                    // Also respect max size limit
                    if (currentMaxDim > maxSize) {
                        const scale = maxSize / currentMaxDim;
                        newWidth *= scale;
                        newHeight *= scale;
                    }
                    break;
                    
                case 'up':
                    // Scale up if too small
                    if (currentMinDim < minSize) {
                        const scale = minSize / currentMinDim;
                        newWidth *= scale;
                        newHeight *= scale;
                    }
                    break;
                    
                case 'both':
                    // Scale to optimal size within constraints
                    let targetSize = Math.min(printableWidth, printableHeight) * 0.3; // 30% of printable area
                    targetSize = Math.max(minSize, Math.min(maxSize, targetSize));
                    
                    if (aspectRatio >= 1) { // Landscape or square
                        newWidth = targetSize;
                        newHeight = targetSize / aspectRatio;
                    } else { // Portrait
                        newHeight = targetSize;
                        newWidth = targetSize * aspectRatio;
                    }
                    break;
            }
            
            // Ensure minimum size
            if (Math.min(newWidth, newHeight) < minSize) {
                const scale = minSize / Math.min(newWidth, newHeight);
                newWidth *= scale;
                newHeight *= scale;
            }
            
            // Ensure maximum size
            if (Math.max(newWidth, newHeight) > maxSize) {
                const scale = maxSize / Math.max(newWidth, newHeight);
                newWidth *= scale;
                newHeight *= scale;
            }
            
            return {
                ...img,
                width: newWidth,
                height: newHeight
            };
        });
    }

    validateImageSizes(printableWidth, printableHeight, imagesToValidate = null) {
        const images = imagesToValidate || this.images;
        const oversizedImages = [];
        
        images.forEach(img => {
            const canFitNormal = img.width <= printableWidth && img.height <= printableHeight;
            const canFitRotated = img.height <= printableWidth && img.width <= printableHeight;
            
            if (!canFitNormal && !canFitRotated) {
                oversizedImages.push({
                    ...img,
                    maxWidth: Math.max(printableWidth, printableHeight),
                    maxHeight: Math.min(printableWidth, printableHeight)
                });
            }
        });
        
        return oversizedImages;
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    handleDragEnter(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Only remove drag-over class if we're actually leaving the drop zone
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            event.currentTarget.classList.remove('drag-over');
        }
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please drop image files only (JPG, PNG, GIF, WEBP)');
            return;
        }

        if (imageFiles.length !== files.length) {
            alert(`${files.length - imageFiles.length} non-image files were ignored. Only image files are supported.`);
        }

        const preview = document.getElementById('imagePreview');
        const imagesList = document.getElementById('imagesList');

        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Create an image element to get original dimensions
                const img = new Image();
                img.onload = () => {
                    // Calculate aspect ratio and set default size
                    const aspectRatio = img.width / img.height;
                    const defaultWidth = 50; // default width in mm
                    const defaultHeight = defaultWidth / aspectRatio;
                    
                    const imageData = {
                        id: Date.now() + index + Math.random(),
                        file: file,
                        dataUrl: e.target.result,
                        width: defaultWidth,
                        height: defaultHeight,
                        copies: 1,
                        name: file.name,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        aspectRatio: aspectRatio
                    };

                    this.images.push(imageData);
                    this.renderImagePreview(imageData);
                    this.renderImageConfig(imageData);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    validateAllImages() {
        this.images.forEach(image => this.validateImageInRealTime(image));
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
        
        // Clear the input so the same file can be selected again
        event.target.value = '';
    }

    renderImagePreview(imageData) {
        const preview = document.getElementById('imagePreview');
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${imageData.dataUrl}" alt="${imageData.name}">
            <button class="remove-btn" onclick="fitPrint.removeImage(${imageData.id})">×</button>
        `;
        preview.appendChild(item);
    }

    renderImageConfig(imageData) {
        const list = document.getElementById('imagesList');
        const config = document.createElement('div');
        config.className = 'image-config';
        config.dataset.id = imageData.id;
        config.innerHTML = `
            <img src="${imageData.dataUrl}" alt="${imageData.name}">
            <div class="config-inputs">
                <div>
                    <label>Width (mm):</label>
                    <input type="number" value="${imageData.width.toFixed(1)}" min="1" step="0.1" 
                           onchange="fitPrint.updateImageSize(${imageData.id}, 'width', this.value)">
                </div>
                <div>
                    <label>Height (mm):</label>
                    <input type="number" value="${imageData.height.toFixed(1)}" min="1" step="0.1" 
                           onchange="fitPrint.updateImageSize(${imageData.id}, 'height', this.value)">
                </div>
                <div>
                    <label>Copies:</label>
                    <input type="number" value="${imageData.copies}" min="1" 
                           onchange="fitPrint.updateImageSize(${imageData.id}, 'copies', this.value)">
                </div>
            </div>
            <button class="remove-btn" onclick="fitPrint.removeImage(${imageData.id})">Remove</button>
        `;
        list.appendChild(config);
    }

    updateImageSize(id, property, value) {
        const image = this.images.find(img => img.id === id);
        if (image) {
            const numValue = parseFloat(value);
            
            if (property === 'width') {
                image.width = numValue;
                // Maintain aspect ratio
                image.height = numValue / image.aspectRatio;
                // Update the height input field
                const config = document.querySelector(`[data-id="${id}"]`);
                const heightInput = config.querySelector('input[onchange*="height"]');
                heightInput.value = image.height.toFixed(1);
            } else if (property === 'height') {
                image.height = numValue;
                // Maintain aspect ratio
                image.width = numValue * image.aspectRatio;
                // Update the width input field
                const config = document.querySelector(`[data-id="${id}"]`);
                const widthInput = config.querySelector('input[onchange*="width"]');
                widthInput.value = image.width.toFixed(1);
            } else {
                image[property] = numValue;
            }
            
            // Real-time validation
            this.validateImageInRealTime(image);
        }
    }

    validateImageInRealTime(image) {
        const paperWidth = parseFloat(document.getElementById('paperWidth').value);
        const paperHeight = parseFloat(document.getElementById('paperHeight').value);
        const outerMargin = parseFloat(document.getElementById('outerMargin').value);
        
        const printableWidth = paperWidth - (2 * outerMargin);
        const printableHeight = paperHeight - (2 * outerMargin);
        
        const config = document.querySelector(`[data-id="${image.id}"]`);
        const existingWarning = config.querySelector('.size-warning');
        
        const canFitNormal = image.width <= printableWidth && image.height <= printableHeight;
        const canFitRotated = image.height <= printableWidth && image.width <= printableHeight;
        
        if (!canFitNormal && !canFitRotated) {
            // Add warning if not exists
            if (!existingWarning) {
                config.classList.add('oversized');
                const warning = document.createElement('div');
                warning.className = 'size-warning';
                warning.innerHTML = `⚠️ Too large for paper! Max: ${Math.max(printableWidth, printableHeight).toFixed(1)}×${Math.min(printableWidth, printableHeight).toFixed(1)}mm`;
                config.appendChild(warning);
            }
        } else {
            // Remove warning if exists
            if (existingWarning) {
                existingWarning.remove();
                config.classList.remove('oversized');
            }
        }
    }

    removeImage(id) {
        this.images = this.images.filter(img => img.id !== id);
        
        // Remove from preview
        const preview = document.getElementById('imagePreview');
        const list = document.getElementById('imagesList');
        
        preview.innerHTML = '';
        list.innerHTML = '';
        
        // Re-render remaining images
        this.images.forEach(img => {
            this.renderImagePreview(img);
            this.renderImageConfig(img);
        });
    }

    generateLayout() {
        console.log('Generate Layout clicked');
        console.log('Images array:', this.images);
        
        if (this.images.length === 0) {
            alert('Please upload some images first!');
            return;
        }

        const paperWidth = parseFloat(document.getElementById('paperWidth').value);
        const paperHeight = parseFloat(document.getElementById('paperHeight').value);
        const outerMargin = parseFloat(document.getElementById('outerMargin').value);
        const innerMargin = parseFloat(document.getElementById('innerMargin').value);
        const imageSpacing = parseFloat(document.getElementById('imageSpacing').value) || 0;
        const packingStrategy = document.getElementById('packingStrategy').value;
        const scaleToFit = document.getElementById('scaleToFit').value;
        const minImageSize = parseFloat(document.getElementById('minImageSize').value);
        const maxImageSize = parseFloat(document.getElementById('maxImageSize').value);
        const allowRotation = document.getElementById('rotateImages').checked;
        const orientation = document.getElementById('paperOrientation').value;

        console.log('Paper settings:', { paperWidth, paperHeight, outerMargin, innerMargin, imageSpacing, packingStrategy, scaleToFit, orientation });

        // Auto-orient paper if needed
        let finalWidth = paperWidth;
        let finalHeight = paperHeight;
        
        if (orientation === 'auto') {
            // Determine best orientation based on image aspect ratios
            const totalImageArea = this.images.reduce((sum, img) => sum + (img.width * img.height * img.copies), 0);
            const avgAspectRatio = Math.sqrt(totalImageArea / (paperWidth * paperHeight));
            
            if (avgAspectRatio > 1 && paperWidth < paperHeight) {
                // Images are wide, use landscape
                finalWidth = paperHeight;
                finalHeight = paperWidth;
            }
        }

        // Calculate printable area
        const printableWidth = finalWidth - (2 * outerMargin);
        const printableHeight = finalHeight - (2 * outerMargin);

        console.log('Printable area:', { printableWidth, printableHeight });

        // Apply scaling if requested
        let processedImages = [...this.images];
        if (scaleToFit !== 'none') {
            processedImages = this.applyScaling(processedImages, printableWidth, printableHeight, scaleToFit, minImageSize, maxImageSize);
        }

        // Validate that all images can fit on the paper
        const oversizedImages = this.validateImageSizes(printableWidth, printableHeight, processedImages);
        if (oversizedImages.length > 0) {
            console.log('Oversized images found:', oversizedImages);
            this.showOversizedWarning(oversizedImages, printableWidth, printableHeight);
            return;
        }

        // Expand images based on copies
        const allImages = [];
        processedImages.forEach(img => {
            for (let i = 0; i < img.copies; i++) {
                allImages.push({
                    ...img,
                    copyIndex: i,
                    originalId: img.id
                });
            }
        });

        console.log('All images for packing:', allImages);

        // Apply smart packing algorithm with new settings
        try {
            const effectiveMargin = innerMargin + imageSpacing;
            
            // Use the new ultra-efficient packing algorithm
            this.layout = this.packImagesUltraEfficient(allImages, printableWidth, printableHeight, effectiveMargin, allowRotation);
            
            console.log('Layout generated:', this.layout);
            console.log('Rotation allowed:', allowRotation);
            
            this.renderLayoutPreview(finalWidth, finalHeight, outerMargin);
            this.updateLayoutStats();
            
            document.getElementById('exportPDF').disabled = false;
            console.log('Layout generation completed successfully');
        } catch (error) {
            console.error('Error during layout generation:', error);
            alert('Error generating layout: ' + error.message);
        }
    }

    validateImageSizes(printableWidth, printableHeight) {
        const oversizedImages = [];
        
        this.images.forEach(img => {
            const canFitNormal = img.width <= printableWidth && img.height <= printableHeight;
            const canFitRotated = img.height <= printableWidth && img.width <= printableHeight;
            
            if (!canFitNormal && !canFitRotated) {
                oversizedImages.push({
                    ...img,
                    maxWidth: Math.max(printableWidth, printableHeight),
                    maxHeight: Math.min(printableWidth, printableHeight)
                });
            }
        });
        
        return oversizedImages;
    }

    showOversizedWarning(oversizedImages, printableWidth, printableHeight) {
        let warningMessage = `⚠️ WARNING: The following images are too large to fit on the paper:\n\n`;
        warningMessage += `Printable area: ${printableWidth.toFixed(1)}mm × ${printableHeight.toFixed(1)}mm\n\n`;
        
        oversizedImages.forEach(img => {
            warningMessage += `• ${img.name}: ${img.width.toFixed(1)}mm × ${img.height.toFixed(1)}mm\n`;
            warningMessage += `  Max size (any orientation): ${Math.max(printableWidth, printableHeight).toFixed(1)}mm × ${Math.min(printableWidth, printableHeight).toFixed(1)}mm\n\n`;
        });
        
        warningMessage += `Please reduce the size of these images or increase the paper size/reduce margins.`;
        
        alert(warningMessage);
        
        // Highlight oversized images in the UI
        this.highlightOversizedImages(oversizedImages);
    }

    highlightOversizedImages(oversizedImages) {
        // Remove existing warnings
        document.querySelectorAll('.size-warning').forEach(el => el.remove());
        document.querySelectorAll('.image-config').forEach(el => el.classList.remove('oversized'));
        
        oversizedImages.forEach(img => {
            const config = document.querySelector(`[data-id="${img.id}"]`);
            if (config) {
                config.classList.add('oversized');
                
                const warning = document.createElement('div');
                warning.className = 'size-warning';
                warning.innerHTML = `⚠️ Too large for paper! Max: ${img.maxWidth.toFixed(1)}×${img.maxHeight.toFixed(1)}mm`;
                config.appendChild(warning);
            }
        });
    }

    packImagesUltraEfficient(allImages, pageWidth, pageHeight, margin, allowRotation = false) {
        console.log('Ultra-efficient packing algorithm started with proper 2D bin packing');
        console.log('Page dimensions:', pageWidth, 'x', pageHeight, 'Margin:', margin);
        console.log('Images to pack:', allImages.length);
        
        if (!allImages.length) return [];
        
        const pages = [];
        const imagesToPack = [...allImages]; // Copy array to avoid mutating original
        
        while (imagesToPack.length > 0) {
            const pageImages = this.packPageWithMultipleHeuristics(imagesToPack, pageWidth, pageHeight, margin, allowRotation);
            
            if (pageImages.length === 0) {
                // If we can't fit even one image, something is wrong - break to avoid infinite loop
                console.warn('Could not place any images on page, stopping');
                break;
            } else {
                pages.push({ images: pageImages });
                // Remove packed images from the list
                for (const packedImage of pageImages) {
                    const index = imagesToPack.findIndex(img => img.id === packedImage.id);
                    if (index >= 0) imagesToPack.splice(index, 1);
                }
            }
        }
        
        console.log(`Ultra-efficient packing complete: ${pages.length} pages for ${allImages.length} images`);
        return pages;
    }
    
    packPageWithMultipleHeuristics(images, pageWidth, pageHeight, margin, allowRotation) {
        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin;
        
        console.log(`Packing ${images.length} images with multiple heuristics`);
        
        // Try multiple heuristics and keep the best result
        const strategies = [
            () => this.packWithMaxRects(images, availableWidth, availableHeight, margin, 'BSSF', allowRotation),
            () => this.packWithMaxRects(images, availableWidth, availableHeight, margin, 'BAF', allowRotation),
            () => this.packWithSkyline(images, availableWidth, availableHeight, margin, allowRotation)
        ];
        
        let bestLayout = [];
        let bestScore = -1;
        
        for (const strategy of strategies) {
            try {
                const layout = strategy();
                const score = layout.length; // Maximize items placed
                
                if (score > bestScore) {
                    bestScore = score;
                    bestLayout = layout;
                }
            } catch (error) {
                console.warn('Strategy failed:', error);
            }
        }
        
        // Try two-pass ordering strategy for better results
        if (bestLayout.length < images.length * 0.8) { // If we didn't place most items
            const twoPassLayout = this.packWithTwoPassOrdering(images, availableWidth, availableHeight, margin, allowRotation);
            if (twoPassLayout.length > bestLayout.length) {
                bestLayout = twoPassLayout;
            }
        }
        
        console.log(`Best strategy placed ${bestLayout.length} out of ${images.length} images`);
        return bestLayout;
    }
    
    packWithMaxRects(images, width, height, margin, heuristic, allowRotation) {
        const freeRects = [{ x: 0, y: 0, width: width, height: height }];
        const placedItems = [];
        const remaining = [...images];
        
        while (remaining.length > 0 && freeRects.length > 0) {
            let bestItem = null;
            let bestRect = null;
            let bestScore = -1;
            let bestRotated = false;
            
            // Find best item-rectangle combination
            for (const item of remaining) {
                const orientations = allowRotation ? 
                    [{ w: item.width, h: item.height, rotated: false },
                     { w: item.height, h: item.width, rotated: true }] :
                    [{ w: item.width, h: item.height, rotated: false }];
                
                for (const orientation of orientations) {
                    for (const rect of freeRects) {
                        if (orientation.w <= rect.width && orientation.h <= rect.height) {
                            let score;
                            
                            if (heuristic === 'BSSF') {
                                // Best Short Side Fit
                                const leftover1 = rect.width - orientation.w;
                                const leftover2 = rect.height - orientation.h;
                                score = -(Math.min(leftover1, leftover2) * 1000 + Math.max(leftover1, leftover2));
                            } else if (heuristic === 'BAF') {
                                // Best Area Fit
                                const waste = rect.width * rect.height - orientation.w * orientation.h;
                                score = -waste;
                            }
                            
                            if (score > bestScore) {
                                bestScore = score;
                                bestItem = item;
                                bestRect = rect;
                                bestRotated = orientation.rotated;
                            }
                        }
                    }
                }
            }
            
            if (!bestItem) break; // No more items can fit
            
            // Place the best item
            const finalWidth = bestRotated ? bestItem.height : bestItem.width;
            const finalHeight = bestRotated ? bestItem.width : bestItem.height;
            
            placedItems.push({
                ...bestItem,
                x: margin + bestRect.x,
                y: margin + bestRect.y,
                width: finalWidth,
                height: finalHeight,
                scale: 1,
                rotated: bestRotated
            });
            
            // Remove item from remaining
            const itemIndex = remaining.indexOf(bestItem);
            remaining.splice(itemIndex, 1);
            
            // Split the rectangle
            this.splitRectangle(freeRects, bestRect, finalWidth, finalHeight);
        }
        
        return placedItems;
    }
    
    splitRectangle(freeRects, usedRect, itemWidth, itemHeight) {
        const rectIndex = freeRects.indexOf(usedRect);
        freeRects.splice(rectIndex, 1);
        
        // Create new rectangles from the split
        const newRects = [];
        
        // Right remainder
        if (usedRect.x + itemWidth < usedRect.x + usedRect.width) {
            newRects.push({
                x: usedRect.x + itemWidth,
                y: usedRect.y,
                width: usedRect.width - itemWidth,
                height: usedRect.height
            });
        }
        
        // Bottom remainder
        if (usedRect.y + itemHeight < usedRect.y + usedRect.height) {
            newRects.push({
                x: usedRect.x,
                y: usedRect.y + itemHeight,
                width: usedRect.width,
                height: usedRect.height - itemHeight
            });
        }
        
        // Add new rectangles and remove any that are contained within others
        for (const newRect of newRects) {
            if (newRect.width > 0 && newRect.height > 0) {
                let isContained = false;
                for (const existingRect of freeRects) {
                    if (this.isRectContained(newRect, existingRect)) {
                        isContained = true;
                        break;
                    }
                }
                if (!isContained) {
                    freeRects.push(newRect);
                }
            }
        }
        
        // Remove rectangles that are now contained within new ones
        for (let i = freeRects.length - 1; i >= 0; i--) {
            for (const newRect of newRects) {
                if (this.isRectContained(freeRects[i], newRect)) {
                    freeRects.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    isRectContained(rect1, rect2) {
        return rect1.x >= rect2.x && rect1.y >= rect2.y &&
               rect1.x + rect1.width <= rect2.x + rect2.width &&
               rect1.y + rect1.height <= rect2.y + rect2.height;
    }
    
    packWithSkyline(images, width, height, margin, allowRotation) {
        const skyline = [{ x: 0, y: 0, width: width }];
        const placedItems = [];
        const remaining = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        for (const item of remaining) {
            let bestPosition = null;
            let bestY = height + 1;
            let bestRotated = false;
            
            const orientations = allowRotation ? 
                [{ w: item.width, h: item.height, rotated: false },
                 { w: item.height, h: item.width, rotated: true }] :
                [{ w: item.width, h: item.height, rotated: false }];
            
            for (const orientation of orientations) {
                for (let i = 0; i < skyline.length; i++) {
                    const segment = skyline[i];
                    
                    if (this.canFitOnSkyline(skyline, i, orientation.w, orientation.h, height)) {
                        const y = this.calculateYPosition(skyline, i, orientation.w);
                        
                        if (y < bestY) {
                            bestY = y;
                            bestPosition = { x: segment.x, y: y, width: orientation.w, height: orientation.h };
                            bestRotated = orientation.rotated;
                        }
                    }
                }
            }
            
            if (bestPosition) {
                placedItems.push({
                    ...item,
                    x: margin + bestPosition.x,
                    y: margin + bestPosition.y,
                    width: bestPosition.width,
                    height: bestPosition.height,
                    scale: 1,
                    rotated: bestRotated
                });
                
                this.updateSkyline(skyline, bestPosition.x, bestPosition.y + bestPosition.height, bestPosition.width);
            }
        }
        
        return placedItems;
    }
    
    canFitOnSkyline(skyline, startIndex, itemWidth, itemHeight, maxHeight) {
        let x = skyline[startIndex].x;
        let y = skyline[startIndex].y;
        let remainingWidth = itemWidth;
        
        for (let i = startIndex; i < skyline.length && remainingWidth > 0; i++) {
            const segment = skyline[i];
            y = Math.max(y, segment.y);
            
            if (y + itemHeight > maxHeight) return false;
            
            remainingWidth -= Math.min(remainingWidth, segment.width);
        }
        
        return remainingWidth <= 0;
    }
    
    calculateYPosition(skyline, startIndex, itemWidth) {
        let y = skyline[startIndex].y;
        let remainingWidth = itemWidth;
        
        for (let i = startIndex; i < skyline.length && remainingWidth > 0; i++) {
            const segment = skyline[i];
            y = Math.max(y, segment.y);
            remainingWidth -= Math.min(remainingWidth, segment.width);
        }
        
        return y;
    }
    
    updateSkyline(skyline, x, newY, width) {
        // Update skyline after placing an item
        const newSegments = [];
        let i = 0;
        
        // Add segments before the new item
        while (i < skyline.length && skyline[i].x + skyline[i].width <= x) {
            newSegments.push(skyline[i]);
            i++;
        }
        
        // Add the new segment
        newSegments.push({ x: x, y: newY, width: width });
        
        // Skip segments covered by the new item
        while (i < skyline.length && skyline[i].x < x + width) {
            i++;
        }
        
        // Add remaining segments
        while (i < skyline.length) {
            newSegments.push(skyline[i]);
            i++;
        }
        
        // Replace skyline
        skyline.length = 0;
        skyline.push(...newSegments);
    }
    
    packWithTwoPassOrdering(images, width, height, margin, allowRotation) {
        // Pass 1: Sort by area descending and pack
        const largeFirst = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        const pass1Result = this.packWithMaxRects(largeFirst, width, height, margin, 'BSSF', allowRotation);
        
        // Pass 2: Take leftovers, sort by area ascending, try to fill gaps
        const placed1Ids = new Set(pass1Result.map(item => item.id));
        const leftovers = images.filter(img => !placed1Ids.has(img.id));
        
        if (leftovers.length === 0) return pass1Result;
        
        const smallFirst = leftovers.sort((a, b) => (a.width * a.height) - (b.width * b.height));
        const pass2Result = this.packWithMaxRects(smallFirst, width, height, margin, 'BAF', allowRotation);
        
        // Combine results from both passes
        const combinedResult = [...pass1Result, ...pass2Result];
        
        return combinedResult.length > pass1Result.length ? combinedResult : pass1Result;
    }
    packImages(images, pageWidth, pageHeight, margin, strategy = 'efficient', allowRotation = true) {
        console.log('Packing with allowRotation:', allowRotation);
        
        // Adjust sorting based on strategy
        let sortedImages;
        switch (strategy) {
            case 'loose':
                // Sort by area but with more spacing consideration
                sortedImages = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height));
                break;
            case 'balanced':
                // Sort by area with some randomization for better visual balance
                sortedImages = [...images].sort((a, b) => {
                    const areaA = a.width * a.height;
                    const areaB = b.width * b.height;
                    const diff = areaB - areaA;
                    return Math.abs(diff) < 100 ? Math.random() - 0.5 : diff;
                });
                break;
            case 'efficient':
            default:
                // Sort by area (largest first) for maximum efficiency
                sortedImages = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        }
        
        const pages = [];
        
        for (const image of sortedImages) {
            let placed = false;
            
            // Try ALL existing pages, not just until first fit - find the best fit
            let bestPageIndex = -1;
            let bestPlacement = null;
            let bestScore = -1;
            
            for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                const placement = this.findBestPlacementOnPage(image, pages[pageIndex], pageWidth, pageHeight, margin, allowRotation);
                if (placement) {
                    // Score based on how efficiently this placement uses the page
                    const efficiency = this.calculatePageEfficiency(pages[pageIndex], placement, pageWidth, pageHeight);
                    const wastedSpace = placement.wastedSpace || 0;
                    const score = efficiency - (wastedSpace / (pageWidth * pageHeight));
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestPageIndex = pageIndex;
                        bestPlacement = placement;
                    }
                }
            }
            
            if (bestPlacement) {
                pages[bestPageIndex].images.push({
                    ...image,
                    x: bestPlacement.x,
                    y: bestPlacement.y,
                    width: bestPlacement.width,
                    height: bestPlacement.height,
                    rotated: bestPlacement.rotated
                });
                placed = true;
                console.log(`Placed ${image.name} on page ${bestPageIndex + 1} at (${bestPlacement.x}, ${bestPlacement.y}) rotated: ${bestPlacement.rotated}, score: ${bestScore.toFixed(3)}`);
            }
            
            // If not placed on existing pages, create a new page
            if (!placed) {
                const newPage = { images: [] };
                const placement = this.findBestPlacementOnPage(image, newPage, pageWidth, pageHeight, margin, allowRotation);
                
                if (placement) {
                    newPage.images.push({
                        ...image,
                        x: placement.x,
                        y: placement.y,
                        width: placement.width,
                        height: placement.height,
                        rotated: placement.rotated
                    });
                    pages.push(newPage);
                    console.log(`Created new page ${pages.length} for ${image.name} at (${placement.x}, ${placement.y}) rotated: ${placement.rotated}`);
                } else {
                    console.error('Image too large to fit on page:', image);
                }
            }
        }
        
        return pages;
    }

    packImagesOptimized(images, pageWidth, pageHeight, margin, allowRotation = true) {
        console.log('Using optimized packing strategy');
        
        // For optimized packing, sort by different criteria to maximize page utilization
        // Sort by the dimension that would benefit most from rotation
        const sortedImages = [...images].sort((a, b) => {
            if (allowRotation) {
                // Prioritize images that can fit better when rotated
                const aRotatedBenefit = this.calculateRotationBenefit(a, pageWidth, pageHeight);
                const bRotatedBenefit = this.calculateRotationBenefit(b, pageWidth, pageHeight);
                
                if (Math.abs(aRotatedBenefit - bRotatedBenefit) > 0.1) {
                    return bRotatedBenefit - aRotatedBenefit;
                }
            }
            
            // Fall back to area sorting
            return (b.width * b.height) - (a.width * a.height);
        });
        
        const pages = [];
        
        for (const image of sortedImages) {
            let placed = false;
            let bestPageIndex = -1;
            let bestPlacement = null;
            let bestEfficiency = -1;
            
            // Try all existing pages and find the one with best efficiency
            for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                const placement = this.findBestPlacementOnPage(image, pages[pageIndex], pageWidth, pageHeight, margin, allowRotation);
                if (placement) {
                    const efficiency = this.calculatePageEfficiency(pages[pageIndex], placement, pageWidth, pageHeight);
                    if (efficiency > bestEfficiency) {
                        bestEfficiency = efficiency;
                        bestPageIndex = pageIndex;
                        bestPlacement = placement;
                    }
                }
            }
            
            if (bestPlacement) {
                pages[bestPageIndex].images.push({
                    ...image,
                    x: bestPlacement.x,
                    y: bestPlacement.y,
                    width: bestPlacement.width,
                    height: bestPlacement.height,
                    rotated: bestPlacement.rotated
                });
                placed = true;
                console.log(`Optimized: Placed ${image.name} on page ${bestPageIndex + 1} with efficiency ${bestEfficiency.toFixed(2)}`);
            }
            
            // If not placed on existing pages, create a new page
            if (!placed) {
                const newPage = { images: [] };
                const placement = this.findBestPlacementOnPage(image, newPage, pageWidth, pageHeight, margin, allowRotation);
                
                if (placement) {
                    newPage.images.push({
                        ...image,
                        x: placement.x,
                        y: placement.y,
                        width: placement.width,
                        height: placement.height,
                        rotated: placement.rotated
                    });
                    pages.push(newPage);
                    console.log(`Optimized: Created new page ${pages.length} for ${image.name}`);
                } else {
                    console.error('Image too large to fit on page:', image);
                }
            }
        }
        
        return pages;
    }

    calculateRotationBenefit(image, pageWidth, pageHeight) {
        // Calculate how much benefit rotating the image would provide
        const normalFit = Math.min(pageWidth / image.width, pageHeight / image.height);
        const rotatedFit = Math.min(pageWidth / image.height, pageHeight / image.width);
        return rotatedFit - normalFit;
    }

    calculatePageEfficiency(page, newPlacement, pageWidth, pageHeight) {
        // Calculate how efficiently the page would be used after adding this placement
        let totalArea = 0;
        page.images.forEach(img => {
            totalArea += img.width * img.height;
        });
        totalArea += newPlacement.width * newPlacement.height;
        
        const pageArea = pageWidth * pageHeight;
        return totalArea / pageArea;
    }

    packImagesUniform(images, pageWidth, pageHeight, margin, allowRotation = true) {
        console.log('Using uniform packing strategy - trying to fit all in same orientation');
        
        if (!allowRotation || images.length === 0) {
            return this.packImages(images, pageWidth, pageHeight, margin, 'efficient', allowRotation);
        }
        
        // Try both orientations for all images and see which fits more on first page
        const orientationStrategies = [
            { name: 'all-normal', rotateAll: false },
            { name: 'all-rotated', rotateAll: true }
        ];
        
        let bestLayout = null;
        let maxOnFirstPage = 0;
        
        for (const strategy of orientationStrategies) {
            console.log(`Trying strategy: ${strategy.name}`);
            
            // Prepare images with uniform orientation
            const orientedImages = images.map(img => ({
                ...img,
                width: strategy.rotateAll ? img.height : img.width,
                height: strategy.rotateAll ? img.width : img.height,
                forceRotated: strategy.rotateAll
            }));
            
            // Try to pack them all on one page first
            const singlePageResult = this.tryPackOnSinglePage(orientedImages, pageWidth, pageHeight, margin);
            
            if (singlePageResult.fitsAll) {
                console.log(`${strategy.name}: All ${images.length} images fit on one page!`);
                return [{
                    images: singlePageResult.placed.map(img => ({
                        ...img,
                        rotated: strategy.rotateAll
                    }))
                }];
            }
            
            console.log(`${strategy.name}: Fit ${singlePageResult.placed.length} images on first page`);
            
            if (singlePageResult.placed.length > maxOnFirstPage) {
                maxOnFirstPage = singlePageResult.placed.length;
                // Continue with this orientation for remaining images
                const remainingImages = orientedImages.slice(singlePageResult.placed.length);
                const additionalPages = remainingImages.length > 0 ? 
                    this.packImages(remainingImages, pageWidth, pageHeight, margin, 'efficient', false) : [];
                
                bestLayout = [
                    {
                        images: singlePageResult.placed.map(img => ({
                            ...img,
                            rotated: strategy.rotateAll
                        }))
                    },
                    ...additionalPages.map(page => ({
                        images: page.images.map(img => ({
                            ...img,
                            rotated: strategy.rotateAll
                        }))
                    }))
                ];
            }
        }
        
        console.log(`Best uniform strategy fits ${maxOnFirstPage} images on first page`);
        return bestLayout || this.packImages(images, pageWidth, pageHeight, margin, 'efficient', allowRotation);
    }

    tryPackOnSinglePage(images, pageWidth, pageHeight, margin) {
        console.log(`Trying to pack ${images.length} images on single page`);
        
        // Sort by area for efficient packing
        const sortedImages = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        const page = { images: [] };
        const placed = [];
        const failed = [];
        
        for (const image of sortedImages) {
            // Try to place without rotation first (since we've already oriented them)
            const placement = this.findBestPlacementOnPage(image, page, pageWidth, pageHeight, margin, false);
            
            if (placement) {
                const placedImage = {
                    ...image,
                    x: placement.x,
                    y: placement.y,
                    width: placement.width,
                    height: placement.height,
                    rotated: placement.rotated || image.forceRotated || false
                };
                
                page.images.push(placedImage);
                placed.push(placedImage);
                console.log(`Placed ${image.name} at (${placement.x}, ${placement.y})`);
            } else {
                failed.push(image);
                console.log(`Failed to place ${image.name}`);
            }
        }
        
        return {
            fitsAll: failed.length === 0,
            placed: placed,
            failed: failed
        };
    }

    // Post-process to consolidate pages if possible
    consolidatePages(pages, pageWidth, pageHeight, margin, allowRotation = true) {
        if (pages.length <= 1) return pages;
        
        console.log(`Attempting to consolidate ${pages.length} pages...`);
        let consolidated = [...pages];
        let improved = true;
        
        while (improved) {
            improved = false;
            
            for (let i = consolidated.length - 1; i > 0; i--) {
                const sourcePage = consolidated[i];
                
                // Try to move all images from this page to earlier pages
                let allMoved = true;
                const movedImages = [];
                
                for (const image of sourcePage.images) {
                    let moved = false;
                    
                    for (let j = 0; j < i; j++) {
                        const targetPage = consolidated[j];
                        const placement = this.findBestPlacementOnPage(image, targetPage, pageWidth, pageHeight, margin, allowRotation);
                        
                        if (placement) {
                            targetPage.images.push({
                                ...image,
                                x: placement.x,
                                y: placement.y,
                                width: placement.width,
                                height: placement.height,
                                rotated: placement.rotated
                            });
                            movedImages.push({ targetPageIndex: j, image: image.name });
                            moved = true;
                            break;
                        }
                    }
                    
                    if (!moved) {
                        allMoved = false;
                        break;
                    }
                }
                
                if (allMoved) {
                    console.log(`Consolidated page ${i + 1} into earlier pages:`, movedImages);
                    consolidated.splice(i, 1);
                    improved = true;
                    break; // Start over to recheck all combinations
                } else {
                    // Restore any partial moves
                    for (const move of movedImages) {
                        const targetPage = consolidated[move.targetPageIndex];
                        targetPage.images = targetPage.images.filter(img => img.name !== move.image);
                    }
                }
            }
        }
        
        console.log(`Consolidation complete: ${pages.length} -> ${consolidated.length} pages`);
        return consolidated;
    }

    findBestPlacementOnPage(image, page, pageWidth, pageHeight, margin, allowRotation = true) {
        const placements = this.getAllPossiblePlacements(image, page, pageWidth, pageHeight, margin, allowRotation);
        const occupied = this.getOccupiedRectangles(page, margin);
        
        console.log(`Finding placement for image ${image.name} (${image.width}x${image.height}mm)`);
        console.log(`Page has ${page.images.length} existing images`);
        console.log(`Found ${placements.length} possible placements`);
        
        if (placements.length === 0) {
            return null;
        }
        
        // Sort placements by preference:
        // 1. Orientation that leaves more usable space for future items
        // 2. Bottom-left positioning (y first, then x)
        // 3. Least wasted space
        placements.sort((a, b) => {
            // Calculate remaining space efficiency for each placement
            const aRemainingSpace = this.calculateRemainingUsableSpace(a, pageWidth, pageHeight, occupied);
            const bRemainingSpace = this.calculateRemainingUsableSpace(b, pageWidth, pageHeight, occupied);
            
            // Strongly prefer placements that leave more usable space
            const spaceDiff = bRemainingSpace - aRemainingSpace;
            if (Math.abs(spaceDiff) > pageWidth * pageHeight * 0.05) { // 5% difference threshold
                return spaceDiff;
            }
            
            // If space efficiency is similar, prefer bottom-left positioning
            const aY = a.y;
            const bY = b.y;
            if (Math.abs(aY - bY) > 1) {
                return aY - bY; // Prefer lower y position
            }
            
            const aX = a.x;
            const bX = b.x;
            if (Math.abs(aX - bX) > 1) {
                return aX - bX; // Prefer left x position
            }

            return a.wastedSpace - b.wastedSpace;
        });        const bestPlacement = placements[0];
        console.log(`Best placement: (${bestPlacement.x}, ${bestPlacement.y}) ${bestPlacement.width}x${bestPlacement.height} rotated: ${bestPlacement.rotated}`);
        
        return bestPlacement;
    }

    getAllPossiblePlacements(image, page, pageWidth, pageHeight, margin, allowRotation = true) {
        const placements = [];
        const occupied = this.getOccupiedRectangles(page, margin);
        
        // Try both orientations if rotation is allowed
        const orientations = [
            { width: image.width, height: image.height, rotated: false }
        ];
        
        if (allowRotation && image.width !== image.height) {
            orientations.push({ width: image.height, height: image.width, rotated: true });
        }
        
        console.log(`Trying ${orientations.length} orientations for ${image.name}, rotation allowed: ${allowRotation}`);
        
        for (const orientation of orientations) {
            // Generate candidate positions
            const candidates = this.generateCandidatePositions(occupied, pageWidth, pageHeight, orientation.width, orientation.height);
            
            for (const pos of candidates) {
                if (this.canPlaceAt(pos.x, pos.y, orientation.width, orientation.height, occupied, pageWidth, pageHeight)) {
                    placements.push({
                        x: pos.x,
                        y: pos.y,
                        width: orientation.width,
                        height: orientation.height,
                        rotated: orientation.rotated,
                        wastedSpace: this.calculateWastedSpace(pos.x, pos.y, orientation.width, orientation.height, occupied, pageWidth, pageHeight)
                    });
                }
            }
        }
        
        console.log(`Found ${placements.length} possible placements for ${image.name}`);
        return placements;
    }

    getOccupiedRectangles(page, margin) {
        return page.images.map(img => ({
            x: img.x,
            y: img.y,
            width: img.width + margin, // Only add margin to the right and bottom
            height: img.height + margin
        }));
    }

    generateCandidatePositions(occupied, pageWidth, pageHeight, itemWidth, itemHeight) {
        const candidates = new Set();
        
        // Add corner positions
        candidates.add(`0,0`);
        
        // Add positions adjacent to existing items
        for (const rect of occupied) {
            // Right edge - this is key for horizontal placement
            const rightX = rect.x + rect.width;
            if (rightX + itemWidth <= pageWidth) {
                candidates.add(`${rightX},${rect.y}`);
                // Also try aligning with the bottom of the existing item
                const bottomAlignY = rect.y + rect.height - itemHeight;
                if (bottomAlignY >= 0) {
                    candidates.add(`${rightX},${bottomAlignY}`);
                }
            }
            
            // Bottom edge
            const bottomY = rect.y + rect.height;
            if (bottomY + itemHeight <= pageHeight) {
                candidates.add(`${rect.x},${bottomY}`);
                // Also try aligning with the right edge of the existing item
                const rightAlignX = rect.x + rect.width - itemWidth;
                if (rightAlignX >= 0) {
                    candidates.add(`${rightAlignX},${bottomY}`);
                }
            }
            
            // Top edge (for items that might fit above)
            const topY = rect.y - itemHeight;
            if (topY >= 0) {
                candidates.add(`${rect.x},${topY}`);
            }
            
            // Left edge (for items that might fit to the left)
            const leftX = rect.x - itemWidth;
            if (leftX >= 0) {
                candidates.add(`${leftX},${rect.y}`);
            }
        }
        
        // Add grid-based positions for better coverage (every 10mm)
        const gridStep = 10;
        for (let x = 0; x + itemWidth <= pageWidth; x += gridStep) {
            for (let y = 0; y + itemHeight <= pageHeight; y += gridStep) {
                candidates.add(`${x},${y}`);
            }
        }
        
        // Convert to array of position objects and filter valid positions
        return Array.from(candidates).map(pos => {
            const [x, y] = pos.split(',').map(Number);
            return { x, y };
        }).filter(pos => 
            pos.x >= 0 && pos.y >= 0 && 
            pos.x + itemWidth <= pageWidth && 
            pos.y + itemHeight <= pageHeight
        );
    }

    canPlaceAt(x, y, width, height, occupied, pageWidth, pageHeight) {
        // Check bounds
        if (x < 0 || y < 0 || x + width > pageWidth || y + height > pageHeight) {
            return false;
        }
        
        // Check overlap with existing items
        const newRect = { x, y, width, height };
        for (const rect of occupied) {
            if (this.rectanglesOverlap(newRect, rect)) {
                return false;
            }
        }
        
        return true;
    }

    rectanglesOverlap(rect1, rect2) {
        return !(rect1.x >= rect2.x + rect2.width ||
                rect2.x >= rect1.x + rect1.width ||
                rect1.y >= rect2.y + rect2.height ||
                rect2.y >= rect1.y + rect1.height);
    }

    calculateWastedSpace(x, y, width, height, occupied, pageWidth, pageHeight) {
        // Simple heuristic: calculate unused space around the placement
        const rightSpace = pageWidth - (x + width);
        const bottomSpace = pageHeight - (y + height);
        return rightSpace * bottomSpace;
    }

    calculateRemainingUsableSpace(placement, pageWidth, pageHeight, occupied) {
        // Create a temporary occupied list with this placement added
        const newOccupied = [...occupied, {
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height
        }];
        
        // Calculate the largest rectangular space that remains free
        let maxRemainingRect = 0;
        
        // Check right side
        const rightX = placement.x + placement.width;
        if (rightX < pageWidth) {
            const rightWidth = pageWidth - rightX;
            const rightHeight = Math.min(pageHeight - placement.y, placement.height);
            maxRemainingRect = Math.max(maxRemainingRect, rightWidth * rightHeight);
        }
        
        // Check bottom side
        const bottomY = placement.y + placement.height;
        if (bottomY < pageHeight) {
            const bottomHeight = pageHeight - bottomY;
            const bottomWidth = Math.min(pageWidth - placement.x, placement.width);
            maxRemainingRect = Math.max(maxRemainingRect, bottomWidth * bottomHeight);
        }
        
        // Check bottom-right corner
        if (rightX < pageWidth && bottomY < pageHeight) {
            const cornerWidth = pageWidth - rightX;
            const cornerHeight = pageHeight - bottomY;
            maxRemainingRect = Math.max(maxRemainingRect, cornerWidth * cornerHeight);
        }
        
        return maxRemainingRect;
    }

    renderLayoutPreview(paperWidth, paperHeight, outerMargin) {
        const preview = document.getElementById('layoutPreview');
        preview.innerHTML = '';

        this.layout.forEach((page, index) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-preview';
            
            const aspectRatio = paperWidth / paperHeight;
            const previewWidth = 400;
            const previewHeight = previewWidth / aspectRatio;
            const scale = previewWidth / paperWidth;

            pageDiv.innerHTML = `
                <div class="page-title">Page ${index + 1}</div>
                <div class="page-content" style="width: ${previewWidth}px; height: ${previewHeight}px;">
                </div>
            `;

            const pageContent = pageDiv.querySelector('.page-content');

            page.images.forEach(img => {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'placed-image';
                imgDiv.style.left = `${(outerMargin + img.x) * scale}px`;
                imgDiv.style.top = `${(outerMargin + img.y) * scale}px`;
                imgDiv.style.width = `${img.width * scale}px`;
                imgDiv.style.height = `${img.height * scale}px`;
                imgDiv.textContent = `${img.name}${img.rotated ? ' (R)' : ''}`;
                pageContent.appendChild(imgDiv);
            });

            preview.appendChild(pageDiv);
        });
    }

    updateLayoutStats() {
        const totalImages = this.images.reduce((sum, img) => sum + img.copies, 0);
        const totalPages = this.layout.length;
        const imagesPerPage = totalPages > 0 ? (totalImages / totalPages).toFixed(1) : 0;

        const stats = document.getElementById('layoutStats');
        stats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${totalImages}</div>
                    <div class="stat-label">Total Images</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalPages}</div>
                    <div class="stat-label">Pages Required</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${imagesPerPage}</div>
                    <div class="stat-label">Avg Images/Page</div>
                </div>
            </div>
        `;
    }

    async exportToPDF() {
        if (this.layout.length === 0) {
            alert('Please generate a layout first!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const paperWidth = parseFloat(document.getElementById('paperWidth').value);
        const paperHeight = parseFloat(document.getElementById('paperHeight').value);
        const outerMargin = parseFloat(document.getElementById('outerMargin').value);

        // Convert mm to points (1mm = 2.834645669 points)
        const mmToPt = 2.834645669;
        const pdf = new jsPDF({
            orientation: paperWidth > paperHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [paperWidth, paperHeight]
        });

        for (let pageIndex = 0; pageIndex < this.layout.length; pageIndex++) {
            if (pageIndex > 0) {
                pdf.addPage();
            }

            const page = this.layout[pageIndex];

            for (const img of page.images) {
                try {
                    // Load image and add to PDF
                    const imageData = await this.loadImageForPDF(img);
                    
                    pdf.addImage(
                        imageData,
                        'JPEG',
                        outerMargin + img.x,
                        outerMargin + img.y,
                        img.width,
                        img.height,
                        undefined,
                        'FAST'
                    );
                } catch (error) {
                    console.error('Error adding image to PDF:', error);
                }
            }
        }

        pdf.save('fitprint-layout.pdf');
    }

    loadImageForPDF(imgData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (imgData.rotated) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                }
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = imgData.dataUrl;
        });
    }
}

// Initialize the application
const fitPrint = new FitPrint();
