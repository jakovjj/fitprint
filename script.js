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
        
        // Paper setting inputs for real-time validation
        const paperWidth = document.getElementById('paperWidth');
        const paperHeight = document.getElementById('paperHeight');
        const outerMargin = document.getElementById('outerMargin');

        imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        generateBtn.addEventListener('click', () => this.generateLayout());
        exportBtn.addEventListener('click', () => this.exportToPDF());
        themeToggle.addEventListener('click', () => this.toggleTheme());
        paperSize.addEventListener('change', (e) => this.handlePaperSizeChange(e));
        
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
            
            // Trigger validation after changing paper size
            this.validateAllImages();
        }
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

    validateAllImages() {
        this.images.forEach(image => this.validateImageInRealTime(image));
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        const preview = document.getElementById('imagePreview');
        const imagesList = document.getElementById('imagesList');

        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
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
                            id: Date.now() + index,
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
            }
        });
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
        if (this.images.length === 0) {
            alert('Please upload some images first!');
            return;
        }

        const paperWidth = parseFloat(document.getElementById('paperWidth').value);
        const paperHeight = parseFloat(document.getElementById('paperHeight').value);
        const outerMargin = parseFloat(document.getElementById('outerMargin').value);
        const innerMargin = parseFloat(document.getElementById('innerMargin').value);

        // Calculate printable area
        const printableWidth = paperWidth - (2 * outerMargin);
        const printableHeight = paperHeight - (2 * outerMargin);

        // Validate that all images can fit on the paper
        const oversizedImages = this.validateImageSizes(printableWidth, printableHeight);
        if (oversizedImages.length > 0) {
            this.showOversizedWarning(oversizedImages, printableWidth, printableHeight);
            return;
        }

        // Expand images based on copies
        const allImages = [];
        this.images.forEach(img => {
            for (let i = 0; i < img.copies; i++) {
                allImages.push({
                    ...img,
                    copyIndex: i,
                    originalId: img.id
                });
            }
        });

        // Apply smart packing algorithm
        this.layout = this.packImages(allImages, printableWidth, printableHeight, innerMargin);
        
        this.renderLayoutPreview(paperWidth, paperHeight, outerMargin);
        this.updateLayoutStats();
        
        document.getElementById('exportPDF').disabled = false;
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

    packImages(images, pageWidth, pageHeight, margin) {
        // Sort images by area (largest first) for better packing efficiency
        const sortedImages = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        const pages = [];
        let currentPageIndex = 0;
        
        for (const image of sortedImages) {
            let placed = false;
            
            // Try to place on existing pages first
            for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                const placement = this.findBestPlacementOnPage(image, pages[pageIndex], pageWidth, pageHeight, margin);
                if (placement) {
                    pages[pageIndex].images.push({
                        ...image,
                        x: placement.x,
                        y: placement.y,
                        width: placement.width,
                        height: placement.height,
                        rotated: placement.rotated
                    });
                    placed = true;
                    break;
                }
            }
            
            // If not placed on existing pages, create a new page
            if (!placed) {
                const newPage = { images: [] };
                const placement = this.findBestPlacementOnPage(image, newPage, pageWidth, pageHeight, margin);
                
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
                } else {
                    console.error('Image too large to fit on page:', image);
                }
            }
        }
        
        return pages;
    }

    findBestPlacementOnPage(image, page, pageWidth, pageHeight, margin) {
        const placements = this.getAllPossiblePlacements(image, page, pageWidth, pageHeight, margin);
        
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

    getAllPossiblePlacements(image, page, pageWidth, pageHeight, margin) {
        const placements = [];
        const occupied = this.getOccupiedRectangles(page, margin);
        
        // Try both orientations
        const orientations = [
            { width: image.width, height: image.height, rotated: false },
            { width: image.height, height: image.width, rotated: true }
        ];
        
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
