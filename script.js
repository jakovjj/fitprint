class FitPrint {
    constructor() {
        this.images = [];
        this.layout = [];
        this.ratioLocked = true; // Default to locked ratio
        this.lastSelectedIndex = -1; // Track last selected index for shift-click selection
        this.initializeEventListeners();
        this.initializeTheme();
        this.initializeBulkEdit();
        this.initializeNavigation();
        this.initializeImageModal();
        
        // Initialize quick selection visibility
        this.updateQuickSelectionVisibility();
    }

    initializeBulkEdit() {
        // Start with bulk edit collapsed
        setTimeout(() => {
            const bulkControls = document.getElementById('bulkControls');
            const toggleIcon = document.getElementById('bulkToggleIcon');
            
            if (bulkControls && toggleIcon) {
                bulkControls.classList.add('collapsed');
                toggleIcon.classList.add('collapsed');
            }
        }, 100);
    }

    initializeNavigation() {
        const navToggle = document.getElementById('navToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const navLinks = document.querySelectorAll('.nav-link');

        // Toggle sidebar functionality
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const isDesktop = window.innerWidth >= 1400;
                
                if (isDesktop) {
                    // On desktop, toggle sidebar and body class for styling
                    sidebar.classList.toggle('desktop-hidden');
                    document.body.classList.toggle('sidebar-hidden');
                } else {
                    // On mobile/laptop, use overlay system
                    sidebar.classList.toggle('open');
                    sidebarOverlay.classList.toggle('active');
                }
            });
        }

        // Close sidebar when clicking overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            });
        }

        // Handle window resize to reset sidebar behavior
        window.addEventListener('resize', () => {
            const isDesktop = window.innerWidth >= 1400;
            
            if (isDesktop) {
                // Reset mobile classes on desktop
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            } else {
                // Reset desktop classes on mobile/laptop
                sidebar.classList.remove('desktop-hidden');
                document.body.classList.remove('sidebar-hidden');
            }
        });

        // Navigation link clicks
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Get target section
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    // Smooth scroll to section
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1200) {
                    sidebar.classList.remove('open');
                    sidebarOverlay.classList.remove('active');
                }
            });
        });

        // Highlight current section on scroll
        this.initializeScrollSpy();
    }

    initializeScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            },
            { threshold: 0.6 }
        );
        
        sections.forEach(section => observer.observe(section));
    }

    initializeImageModal() {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const modalImageName = document.getElementById('modalImageName');
        const modalImageSize = document.getElementById('modalImageSize');
        const modalClose = document.querySelector('.modal-close');
        const modalBackdrop = document.querySelector('.modal-backdrop');

        // Close modal function
        const closeModal = () => {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        };

        // Open modal function
        this.openImageModal = (imageSrc, imageName, imageData) => {
            modalImage.src = imageSrc;
            modalImageName.textContent = imageName;
            
            // Show image dimensions if available
            if (imageData) {
                modalImageSize.textContent = `${imageData.originalWidth} × ${imageData.originalHeight} pixels`;
            } else {
                modalImageSize.textContent = '';
            }
            
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        };

        // Event listeners
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeModal);
        }

        if (modalImage) {
            modalImage.addEventListener('click', closeModal);
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
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
        generateBtn.addEventListener('click', () => this.generateLayoutWithLoading());
        exportBtn.addEventListener('click', () => this.exportToPDFWithLoading());
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Event delegation for checkbox clicks to properly capture shift-click
        document.addEventListener('click', (e) => {
            console.log('🔍 Document click:', e.target.className, e.target.tagName);
            
            if (e.target.classList.contains('select-checkbox')) {
                console.log('🔍 Checkbox click detected:', { 
                    shiftKey: e.shiftKey, 
                    imageId: e.target.dataset.imageId,
                    currentChecked: e.target.checked
                });
                const imageId = e.target.dataset.imageId; // Keep as string to avoid precision issues
                
                // For shift-click, completely stop the event and handle everything manually
                if (e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log('🚀 SHIFT-CLICK DETECTED! Completely blocking default behavior');
                    console.log('🚀 Image ID:', imageId, 'Type:', typeof imageId);
                    
                    // Don't change the checkbox state here - let toggleImageSelection handle it
                    // The checkbox will be set to checked as part of the range selection
                    this.toggleImageSelection(imageId, true, e); // Always set to true for shift-click
                    return false; // Extra safety to prevent default
                } else {
                    // For normal clicks, use setTimeout to get the updated checked state after the click
                    setTimeout(() => {
                        console.log('📌 Normal click - final checked state:', e.target.checked);
                        this.toggleImageSelection(imageId, e.target.checked, e);
                    }, 0);
                }
            }
        }, true); // Use capture phase to ensure we get the event first
        
        // Bulk edit listeners
        const selectAllBtn = document.getElementById('selectAll');
        const selectNoneBtn = document.getElementById('selectNone');
        const removeSelectedBtn = document.getElementById('removeSelected');
        const applyBulkBtn = document.getElementById('applyBulkChanges');
        const lockRatioBtn = document.getElementById('lockRatio');
        const bulkWidth = document.getElementById('bulkWidth');
        const bulkHeight = document.getElementById('bulkHeight');
        
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllImages());
        if (selectNoneBtn) selectNoneBtn.addEventListener('click', () => this.selectNoImages());
        if (removeSelectedBtn) removeSelectedBtn.addEventListener('click', () => this.removeSelectedImages());
        if (applyBulkBtn) applyBulkBtn.addEventListener('click', () => this.applyBulkChanges());
        if (lockRatioBtn) lockRatioBtn.addEventListener('click', () => this.toggleRatioLock());
        if (bulkWidth) bulkWidth.addEventListener('input', () => this.handleBulkWidthChange());
        if (bulkHeight) bulkHeight.addEventListener('input', () => this.handleBulkHeightChange());
        
        // Quick selection controls
        const quickSelectAllBtn = document.getElementById('quickSelectAll');
        const quickSelectNoneBtn = document.getElementById('quickSelectNone');
        
        if (quickSelectAllBtn) quickSelectAllBtn.addEventListener('click', () => this.selectAllImages());
        if (quickSelectNoneBtn) quickSelectNoneBtn.addEventListener('click', () => this.selectNoImages());
        
        paperSize.addEventListener('change', (e) => {
            this.handlePaperSizeChange(e);
            this.handleSettingsChange();
        });
        paperOrientation.addEventListener('change', (e) => {
            this.handleOrientationChange(e);
            this.handleSettingsChange();
        });
        
        // Drag & Drop events
        fileUpload.addEventListener('dragover', (e) => this.handleDragOver(e));
        fileUpload.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        fileUpload.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        fileUpload.addEventListener('drop', (e) => this.handleDrop(e));
        fileUpload.addEventListener('click', () => imageInput.click());
        
        // Clipboard paste events
        document.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Make file upload area focusable for better paste experience
        fileUpload.setAttribute('tabindex', '0');
        fileUpload.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                // Let the paste event handle this
                e.preventDefault();
            }
        });
        
        // Add real-time validation when paper settings change
        paperWidth.addEventListener('input', () => {
            this.validateAllImages();
            this.checkForCustomSize();
            this.handleSettingsChange();
        });
        paperHeight.addEventListener('input', () => {
            this.validateAllImages();
            this.checkForCustomSize();
            this.handleSettingsChange();
        });
        outerMargin.addEventListener('input', () => {
            this.validateAllImages();
            this.handleSettingsChange();
        });
        
        // Add keyboard event listeners for shift detection visual feedback
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                document.body.classList.add('shift-selecting');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                document.body.classList.remove('shift-selecting');
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('fitprint-theme') || 'light';
        this.setTheme(savedTheme);
    }

    // Show/hide loading overlay
    showLoading(message = 'Processing images...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = overlay.querySelector('p');
        messageElement.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
    }

    // Handle settings changes with regeneration
    async handleSettingsChange() {
        if (this.images.length > 0) {
            // Debounce rapid changes
            clearTimeout(this.settingsTimeout);
            this.settingsTimeout = setTimeout(() => {
                this.generateLayoutWithLoading();
            }, 500);
        }
    }

    // Generate layout with loading screen
    async generateLayoutWithLoading() {
        // Reset export button states
        document.getElementById('exportPDF').classList.remove('ready');
        
        this.showLoading('Generating optimal layout...');
        
        // Small delay to ensure loading screen shows
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            await this.generateLayout();
        } finally {
            this.hideLoading();
        }
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

    // Removed applyScaling function - scaling functionality removed for simplicity

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

    handlePaste(event) {
        console.log('📋 Paste event detected');
        
        // Only handle paste if no input field is focused
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            console.log('📋 Ignoring paste - input field is focused');
            return;
        }
        
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) {
            console.log('📋 No clipboard data available');
            return;
        }
        
        const items = Array.from(clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length === 0) {
            console.log('📋 No image data found in clipboard');
            return;
        }
        
        event.preventDefault();
        console.log(`📋 Found ${imageItems.length} image(s) in clipboard`);
        
        // Show visual feedback
        this.showPasteProgress();
        
        const promises = imageItems.map((item, index) => this.processClipboardImage(item, index));
        
        Promise.all(promises).then(() => {
            this.hidePasteProgress();
            console.log('📋 All clipboard images processed successfully');
        }).catch(error => {
            this.hidePasteProgress();
            console.error('📋 Error processing clipboard images:', error);
            alert('Error processing clipboard images: ' + error.message);
        });
    }

    async processClipboardImage(item, index) {
        return new Promise((resolve, reject) => {
            const blob = item.getAsFile();
            if (!blob) {
                reject(new Error('Could not get image data from clipboard'));
                return;
            }
            
            // Generate a filename based on timestamp and index
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const extension = blob.type.split('/')[1] || 'png';
            const filename = `clipboard-image-${timestamp}-${index + 1}.${extension}`;
            
            // Create a File object with the blob data
            const file = new File([blob], filename, { type: blob.type });
            
            const reader = new FileReader();
            reader.onload = (e) => {
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
                        name: filename,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        aspectRatio: aspectRatio
                    };

                    this.images.push(imageData);
                    this.renderImageConfig(imageData);
                    resolve();
                };
                img.onerror = () => reject(new Error('Failed to load image from clipboard'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read clipboard image data'));
            reader.readAsDataURL(blob);
        });
    }

    showPasteProgress() {
        const fileUpload = document.querySelector('.file-upload');
        if (fileUpload) {
            fileUpload.classList.add('pasting');
            
            // Add temporary visual feedback
            const pasteIndicator = document.createElement('div');
            pasteIndicator.className = 'paste-indicator';
            pasteIndicator.innerHTML = '📋 Processing clipboard images...';
            fileUpload.appendChild(pasteIndicator);
        }
    }

    hidePasteProgress() {
        const fileUpload = document.querySelector('.file-upload');
        if (fileUpload) {
            fileUpload.classList.remove('pasting');
            
            const pasteIndicator = fileUpload.querySelector('.paste-indicator');
            if (pasteIndicator) {
                pasteIndicator.remove();
            }
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

    // Add test images for debugging
    // Removed addTestImages function - no longer needed

    renderImageConfig(imageData) {
        const list = document.getElementById('imagesList');
        const config = document.createElement('div');
        config.className = 'image-config';
        config.dataset.id = imageData.id;
        config.innerHTML = `
            <input type="checkbox" class="select-checkbox" data-image-id="${imageData.id}">
            <img src="${imageData.dataUrl}" alt="${imageData.name}" data-image-id="${imageData.id}">
            <div class="config-inputs">
                <div>
                    <label>Width (mm):</label>
                    <div class="input-with-lock">
                        <input type="number" value="${imageData.width.toFixed(1)}" min="1" step="0.1" 
                               onchange="fitPrint.updateImageSize(${imageData.id}, 'width', this.value)"
                               data-type="width">
                        <button class="ratio-lock-btn ${this.ratioLocked ? 'active' : ''}" 
                                onclick="fitPrint.toggleImageRatioLock(${imageData.id})" 
                                title="Lock aspect ratio">🔒</button>
                    </div>
                </div>
                <div>
                    <label>Height (mm):</label>
                    <input type="number" value="${imageData.height.toFixed(1)}" min="1" step="0.1" 
                           onchange="fitPrint.updateImageSize(${imageData.id}, 'height', this.value)"
                           data-type="height">
                </div>
                <div>
                    <label>Copies:</label>
                    <input type="number" value="${imageData.copies}" min="1" 
                           onchange="fitPrint.updateImageSize(${imageData.id}, 'copies', this.value)">
                </div>
            </div>
            <button class="remove-btn" data-id="${imageData.id}">✕ Remove</button>
        `;
        
        // Add click listener to the image
        const img = config.querySelector('img');
        img.addEventListener('click', () => {
            this.openImageModal(imageData.dataUrl, imageData.name, {
                originalWidth: imageData.originalWidth,
                originalHeight: imageData.originalHeight
            });
        });
        
        // Add click listener to the remove button
        const removeBtn = config.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            this.removeImage(imageData.id);
        });
        
        list.appendChild(config);
        
        // Update quick selection controls visibility
        this.updateQuickSelectionVisibility();
    }

    updateImageSize(id, property, value) {
        const image = this.images.find(img => img.id === id);
        if (image) {
            const numValue = parseFloat(value);
            const config = document.querySelector(`[data-id="${id}"]`);
            const ratioBtn = config.querySelector('.ratio-lock-btn');
            const isRatioLocked = ratioBtn && ratioBtn.classList.contains('active');
            
            if (property === 'width') {
                image.width = numValue;
                if (isRatioLocked) {
                    // Maintain aspect ratio
                    image.height = numValue / image.aspectRatio;
                    // Update the height input field
                    const heightInput = config.querySelector('input[data-type="height"]');
                    heightInput.value = image.height.toFixed(1);
                }
            } else if (property === 'height') {
                image.height = numValue;
                if (isRatioLocked) {
                    // Maintain aspect ratio
                    image.width = numValue * image.aspectRatio;
                    // Update the width input field
                    const widthInput = config.querySelector('input[data-type="width"]');
                    widthInput.value = image.width.toFixed(1);
                }
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
        console.log('🗑️ Removing image with id:', id);
        
        // Store current selection state before removal
        const selectedIds = Array.from(document.querySelectorAll('.image-config.selected'))
            .map(config => config.dataset.id)
            .filter(selectedId => selectedId != id); // Exclude the one being removed
        
        console.log('💾 Preserved selection state:', selectedIds);
        
        // Remove from images array
        this.images = this.images.filter(img => img.id != id);
        
        // Remove the config element
        const configToRemove = document.querySelector(`[data-id="${id}"]`);
        
        if (configToRemove) {
            configToRemove.remove();
            console.log('🗑️ Removed config element');
        }
        
        // Restore selection state for remaining images
        setTimeout(() => {
            selectedIds.forEach(selectedId => {
                const config = document.querySelector(`[data-id="${selectedId}"]`);
                const checkbox = config?.querySelector('.select-checkbox');
                if (config && checkbox) {
                    checkbox.checked = true;
                    config.classList.add('selected');
                    console.log('✅ Restored selection for id:', selectedId);
                }
            });
            
            // Update selection count and reset lastSelectedIndex if needed
            this.updateSelectionCount();
            
            // Reset lastSelectedIndex if the removed item was the anchor
            const allConfigs = Array.from(document.querySelectorAll('.image-config'));
            if (this.lastSelectedIndex >= allConfigs.length) {
                this.lastSelectedIndex = allConfigs.length - 1;
            }
            
            console.log('🔄 Updated lastSelectedIndex to:', this.lastSelectedIndex);
        }, 10);
    }

    // Bulk edit functions
    toggleImageSelection(id, checked, event = null) {
        console.log('📝 toggleImageSelection called:', { 
            id, 
            checked, 
            hasEvent: !!event, 
            shiftKey: event?.shiftKey,
            lastSelectedIndex: this.lastSelectedIndex 
        });
        
        // Try to find config by data-id first, then fallback to finding by checkbox data-image-id
        let config = document.querySelector(`[data-id="${id}"]`);
        
        if (!config) {
            // Fallback: find by checkbox data-image-id
            const checkbox = document.querySelector(`[data-image-id="${id}"]`);
            if (checkbox) {
                config = checkbox.closest('.image-config');
                console.log('💡 Found config via checkbox fallback method');
            }
        }
        
        if (!config) {
            console.warn('❌ Config not found for id:', id);
            console.log('Available configs:', Array.from(document.querySelectorAll('.image-config')).map(c => ({
                dataId: c.dataset.id, 
                checkboxImageId: c.querySelector('.select-checkbox')?.dataset.imageId
            })));
            return;
        }

        // Get all image configs to determine indices
        const allConfigs = Array.from(document.querySelectorAll('.image-config'));
        const currentIndex = allConfigs.indexOf(config);
        
        console.log('📍 Current index:', currentIndex, 'Total configs:', allConfigs.length);

        // Handle shift-click for range selection
        if (event && event.shiftKey && this.lastSelectedIndex !== -1) {
            console.log('🎯 SHIFT-CLICK RANGE SELECTION TRIGGERED!');
            
            // Ensure the clicked checkbox is set to checked (it should always be selected in shift-click)
            const clickedCheckbox = config.querySelector('.select-checkbox');
            if (clickedCheckbox) {
                clickedCheckbox.checked = true;
            }
            
            // If clicking the same item, just select it
            if (this.lastSelectedIndex === currentIndex) {
                console.log('🎯 Shift-clicking same item, just ensuring it\'s selected');
                config.classList.add('selected');
                this.updateSelectionCount();
                return;
            }
            
            const startIndex = Math.min(this.lastSelectedIndex, currentIndex);
            const endIndex = Math.max(this.lastSelectedIndex, currentIndex);
            
            console.log(`🔄 Selecting range from index ${startIndex} to ${endIndex} (INCLUSIVE of both endpoints)`);
            console.log(`📍 Previous anchor: ${this.lastSelectedIndex}, New clicked: ${currentIndex}`);
            
            // First, let's see what checkboxes we're working with
            console.log('🔍 Checkboxes in range:');
            for (let i = startIndex; i <= endIndex; i++) {
                const configToCheck = allConfigs[i];
                const checkboxToCheck = configToCheck?.querySelector('.select-checkbox');
                console.log(`  Index ${i}: config exists: ${!!configToCheck}, checkbox exists: ${!!checkboxToCheck}, current checked: ${checkboxToCheck?.checked}`);
            }
            
            // Select all items in the range (INCLUSIVE of both start and end)
            // Use setTimeout to ensure this happens after any default browser behavior
            setTimeout(() => {
                for (let i = startIndex; i <= endIndex; i++) {
                    const configToSelect = allConfigs[i];
                    const checkbox = configToSelect.querySelector('.select-checkbox');
                    if (configToSelect && checkbox) {
                        console.log(`🔧 Before setting - checkbox ${i} checked: ${checkbox.checked}`);
                        
                        // FORCE the checkbox to be checked - this is the key fix
                        checkbox.checked = true;
                        
                        // Double-check it was set
                        console.log(`🔧 After setting - checkbox ${i} checked: ${checkbox.checked}`);
                        
                        // Set the visual state
                        configToSelect.classList.add('selected');
                        
                        // Enhanced visual feedback for range selection
                        configToSelect.style.transition = 'all 0.3s ease';
                        configToSelect.style.transform = 'scale(1.03)';
                        configToSelect.style.backgroundColor = 'var(--primary-color-light, #e3f2fd)';
                        configToSelect.style.borderColor = '#3b82f6';
                        configToSelect.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)';
                        
                        // Reset styles after animation
                        setTimeout(() => {
                            configToSelect.style.transform = '';
                            configToSelect.style.backgroundColor = '';
                            configToSelect.style.borderColor = '';
                            configToSelect.style.boxShadow = '';
                        }, 300);
                        
                        console.log(`✅ Range-selected item at index ${i} (id: ${configToSelect.dataset.id}) - final checkbox.checked: ${checkbox.checked}`);
                    }
                }
                
                // Update selection count after all checkboxes are set
                this.updateSelectionCount();
            }, 10); // Small delay to ensure this runs after default behavior
            
            // IMPORTANT: Update lastSelectedIndex to the NEWLY CLICKED item for future range selections
            // This means the next shift-click will be from this newly clicked position
            this.lastSelectedIndex = currentIndex;
            console.log('🎯 Range selection completed! NEW anchor point set to:', this.lastSelectedIndex, '(the newly clicked item)');
        } else {
            // Normal single selection or shift-click without previous selection
            console.log('📌 Normal single selection - checked state:', checked);
            
            const checkbox = config.querySelector('.select-checkbox');
            if (checkbox) {
                // Ensure checkbox state matches the expected state
                checkbox.checked = checked;
            }
            
            if (checked) {
                config.classList.add('selected');
                // Visual feedback for selection
                config.style.transition = 'all 0.2s ease';
                config.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    config.style.transform = '';
                }, 200);
                
                // Update last selected index for future range selections
                this.lastSelectedIndex = currentIndex;
                console.log('✅ Updated lastSelectedIndex to:', this.lastSelectedIndex);
            } else {
                config.classList.remove('selected');
                // If unchecking the last selected item, reset the last selected index
                if (currentIndex === this.lastSelectedIndex) {
                    this.lastSelectedIndex = -1;
                    console.log('🔄 Reset lastSelectedIndex due to unchecking last selected item');
                }
            }
        }
        
        // Update selection count for UI feedback
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const selectedCount = document.querySelectorAll('.image-config.selected').length;
        console.log(`📊 Current selection count: ${selectedCount}`);
        
        // Update any UI elements that show selection count - with safety checks
        const bulkControls = document.getElementById('bulkControls');
        if (bulkControls) {
            // Try to find existing selection count element
            let countElement = document.querySelector('.selection-count');
            
            if (!countElement) {
                // The h3 is actually the previous sibling of bulkControls
                const h3Element = bulkControls.previousElementSibling;
                if (h3Element && h3Element.tagName === 'H3') {
                    countElement = document.createElement('span');
                    countElement.className = 'selection-count';
                    countElement.style.cssText = 'margin-left: 10px; font-weight: bold; color: #3b82f6;';
                    h3Element.appendChild(countElement);
                    console.log('📊 Created selection count element in h3');
                } else {
                    console.log('📊 Could not find h3 element for selection count');
                }
            }
            
            // Update the count text if we have an element
            if (countElement) {
                countElement.textContent = selectedCount > 0 ? ` (${selectedCount} selected)` : '';
            } else {
                console.log('📊 Selection count updated:', selectedCount, '(no UI element to display in)');
            }
        }
        
        // Update quick selection controls visibility
        this.updateQuickSelectionVisibility();
    }

    updateQuickSelectionVisibility() {
        const quickSelectionControls = document.getElementById('quickSelectionControls');
        const totalImages = this.images.length;
        
        if (quickSelectionControls) {
            if (totalImages > 0) {
                quickSelectionControls.classList.remove('hidden');
            } else {
                quickSelectionControls.classList.add('hidden');
            }
        }
    }

    selectAllImages() {
        const checkboxes = document.querySelectorAll('.select-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const config = checkbox.closest('.image-config');
            const id = config.dataset.id; // Keep as string
            this.toggleImageSelection(id, true);
        });
        // Set last selected index to the last item after selecting all
        const allConfigs = Array.from(document.querySelectorAll('.image-config'));
        this.lastSelectedIndex = allConfigs.length - 1;
    }

    selectNoImages() {
        const checkboxes = document.querySelectorAll('.select-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const config = checkbox.closest('.image-config');
            const id = config.dataset.id; // Keep as string
            this.toggleImageSelection(id, false);
        });
        // Reset last selected index after deselecting all
        this.lastSelectedIndex = -1;
    }

    removeSelectedImages() {
        const selectedConfigs = document.querySelectorAll('.image-config.selected');
        
        if (selectedConfigs.length === 0) {
            alert('Please select at least one image to remove.');
            return;
        }
        
        const selectedCount = selectedConfigs.length;
        const confirmMessage = `Are you sure you want to remove ${selectedCount} selected image${selectedCount > 1 ? 's' : ''}?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        console.log(`🗑️ Removing ${selectedCount} selected images`);
        
        // Get IDs of selected images
        const selectedIds = Array.from(selectedConfigs).map(config => config.dataset.id);
        
        // Remove from images array
        this.images = this.images.filter(img => !selectedIds.includes(img.id.toString()));
        
        // Remove DOM elements
        selectedConfigs.forEach(config => {
            const id = config.dataset.id;
            // Remove preview element
            const previewToRemove = document.querySelector(`.preview-item img[src*="${id}"]`)?.parentElement;
            if (previewToRemove) {
                previewToRemove.remove();
            }
            // Remove config element
            config.remove();
        });
        
        // Reset selection state
        this.lastSelectedIndex = -1;
        this.updateSelectionCount();
        
        console.log(`✅ Removed ${selectedCount} images successfully`);
    }

    toggleRatioLock() {
        this.ratioLocked = !this.ratioLocked;
        const lockBtn = document.getElementById('lockRatio');
        if (lockBtn) {
            if (this.ratioLocked) {
                lockBtn.classList.add('active');
            } else {
                lockBtn.classList.remove('active');
            }
        }
    }

    toggleImageRatioLock(id) {
        const config = document.querySelector(`[data-id="${id}"]`);
        const lockBtn = config.querySelector('.ratio-lock-btn');
        if (lockBtn) {
            lockBtn.classList.toggle('active');
        }
    }

    handleBulkWidthChange() {
        if (!this.ratioLocked) return;
        
        const widthInput = document.getElementById('bulkWidth');
        const heightInput = document.getElementById('bulkHeight');
        const width = parseFloat(widthInput.value);
        
        if (width && this.lastAspectRatio) {
            const height = width / this.lastAspectRatio;
            heightInput.value = height.toFixed(1);
        }
    }

    handleBulkHeightChange() {
        if (!this.ratioLocked) return;
        
        const widthInput = document.getElementById('bulkWidth');
        const heightInput = document.getElementById('bulkHeight');
        const height = parseFloat(heightInput.value);
        
        if (height && this.lastAspectRatio) {
            const width = height * this.lastAspectRatio;
            widthInput.value = width.toFixed(1);
        }
    }

    applyBulkChanges() {
        const selectedConfigs = document.querySelectorAll('.image-config.selected');
        const bulkWidth = document.getElementById('bulkWidth').value;
        const bulkHeight = document.getElementById('bulkHeight').value;
        const bulkCopies = document.getElementById('bulkCopies').value;
        
        if (selectedConfigs.length === 0) {
            alert('Please select at least one image to modify.');
            return;
        }
        
        selectedConfigs.forEach(config => {
            const id = config.dataset.id; // Keep as string
            const image = this.images.find(img => img.id == id); // Use == for loose comparison
            
            if (image) {
                const lockBtn = document.getElementById('lockRatio');
                const isRatioLocked = lockBtn && lockBtn.classList.contains('active');
                
                if (bulkWidth) {
                    image.width = parseFloat(bulkWidth);
                    if (isRatioLocked) {
                        // If ratio is locked, adjust height automatically
                        image.height = image.width / image.aspectRatio;
                    }
                }
                
                if (bulkHeight) {
                    image.height = parseFloat(bulkHeight);
                    if (isRatioLocked) {
                        // If ratio is locked, adjust width automatically
                        image.width = image.height * image.aspectRatio;
                    }
                }
                
                if (bulkCopies) {
                    image.copies = parseInt(bulkCopies);
                }
                
                // Update the UI
                const widthInput = config.querySelector('input[data-type="width"]');
                const heightInput = config.querySelector('input[data-type="height"]');
                const copiesInput = config.querySelector('input[onchange*="copies"]');
                
                if (widthInput) widthInput.value = image.width.toFixed(1);
                if (heightInput) heightInput.value = image.height.toFixed(1);
                if (copiesInput && bulkCopies) copiesInput.value = image.copies;
                
                // Validate the image
                this.validateImageInRealTime(image);
            }
        });
        
        // Clear bulk inputs
        document.getElementById('bulkWidth').value = '';
        document.getElementById('bulkHeight').value = '';
        document.getElementById('bulkCopies').value = '';
        
        console.log(`Applied bulk changes to ${selectedConfigs.length} images`);
    }

    toggleBulkEdit() {
        const bulkControls = document.getElementById('bulkControls');
        const toggleIcon = document.getElementById('bulkToggleIcon');
        
        if (bulkControls && toggleIcon) {
            const isCollapsed = bulkControls.classList.contains('collapsed');
            
            if (isCollapsed) {
                bulkControls.classList.remove('collapsed');
                toggleIcon.classList.remove('collapsed');
            } else {
                bulkControls.classList.add('collapsed');
                toggleIcon.classList.add('collapsed');
            }
        }
    }

    async generateLayout() {
        console.log('Generate Layout clicked');
        console.log('Images array:', this.images);
        
        if (this.images.length === 0) {
            alert('Please upload some images first!');
            return;
        }

        // Small delay for loading screen visibility
        await new Promise(resolve => setTimeout(resolve, 50));

        const paperWidth = parseFloat(document.getElementById('paperWidth').value);
        const paperHeight = parseFloat(document.getElementById('paperHeight').value);
        const outerMargin = parseFloat(document.getElementById('outerMargin').value);
        const innerMargin = parseFloat(document.getElementById('innerMargin').value);
        const packingStrategy = document.getElementById('packingStrategy').value;
        const allowRotation = document.getElementById('rotateImages').checked;
        const orientation = document.getElementById('paperOrientation').value;

        console.log('Paper settings:', { paperWidth, paperHeight, outerMargin, innerMargin, packingStrategy, orientation });
        
        console.log('=== SIMPLIFIED MARGIN SYSTEM ===');
        console.log('• Outer Margin:', outerMargin + 'mm - space from page edge to content area');
        console.log('• Image Spacing (Inner Margin):', innerMargin + 'mm - space between images');
        console.log('==================================');

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

        // Validate that all images can fit on the paper (no scaling)
        const oversizedImages = this.validateImageSizes(printableWidth, printableHeight, this.images);
        if (oversizedImages.length > 0) {
            console.log('Oversized images found:', oversizedImages);
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

        console.log('All images for packing:', allImages);

        // Apply smart packing algorithm with simplified settings
        try {
            console.log('=== SIMPLIFIED PACKING ===');
            console.log('• Using innerMargin (' + innerMargin + 'mm) as image spacing');
            console.log('==========================');
            
            // Use the new ultra-efficient packing algorithm
            this.layout = this.packImagesUltraEfficient(allImages, printableWidth, printableHeight, innerMargin, allowRotation);
            
            console.log('Layout generated:', this.layout);
            console.log('Rotation allowed:', allowRotation);
            
            this.renderLayoutPreview(finalWidth, finalHeight, outerMargin);
            this.updateLayoutStats();
            
            // Mark export buttons as ready
            document.getElementById('exportPDF').classList.add('ready');
            
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
        console.log('=== ULTRA-EFFICIENT 2D BIN PACKING STARTED ===');
        console.log('Page dimensions:', pageWidth, 'x', pageHeight, 'Margin:', margin);
        console.log('Images to pack:', allImages.length);
        console.log('Rotation allowed:', allowRotation);
        
        if (!allImages.length) return [];
        
        const pages = [];
        const imagesToPack = [...allImages]; // Copy array to avoid mutating original
        
        // Sort images by area (largest first) for better packing efficiency
        imagesToPack.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        while (imagesToPack.length > 0) {
            console.log(`\n--- Starting new page, ${imagesToPack.length} images remaining ---`);
            const pageImages = this.packPageOptimal(imagesToPack, pageWidth, pageHeight, margin, allowRotation);
            
            if (pageImages.length === 0) {
                console.warn('Could not place any images on page, stopping to avoid infinite loop');
                break;
            } else {
                pages.push({ images: pageImages });
                console.log(`Page ${pages.length} completed with ${pageImages.length} images`);
                
                // Remove packed images from the list
                for (const packedImage of pageImages) {
                    const index = imagesToPack.findIndex(img => img.id === packedImage.id && img.copyIndex === packedImage.copyIndex);
                    if (index >= 0) {
                        imagesToPack.splice(index, 1);
                    }
                }
            }
        }
        
        console.log(`=== PACKING COMPLETE: ${pages.length} pages for ${allImages.length} images ===`);
        return pages;
    }
    
    packPageOptimal(images, pageWidth, pageHeight, imageSpacing, allowRotation) {
        console.log(`\n🎯 OPTIMAL PAGE PACKING: ${images.length} images`);
        console.log(`Available space: ${pageWidth} x ${pageHeight}mm`);
        
        if (!images.length) return [];
        
        // Use Bottom-Left-Fill heuristic with rotation support
        const packedImages = this.bottomLeftFillPacking(images, pageWidth, pageHeight, imageSpacing, allowRotation);
        
        console.log(`✅ Packed ${packedImages.length} images using Bottom-Left-Fill`);
        return packedImages;
    }

    bottomLeftFillPacking(images, pageWidth, pageHeight, imageSpacing, allowRotation) {
        console.log(`\n🔄 BOTTOM-LEFT-FILL PACKING`);
        console.log(`Page: ${pageWidth}x${pageHeight}mm, Image Spacing: ${imageSpacing}mm`);
        
        const usableWidth = pageWidth;
        const usableHeight = pageHeight;
        const placed = [];
        const remaining = [...images];
        
        console.log(`Image spacing: ${imageSpacing}mm`);
        
        // Sort by area (largest first) for better packing
        remaining.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        while (remaining.length > 0) {
            let bestPlacement = null;
            let bestImageIndex = -1;
            
            // Try to place each remaining image
            for (let i = 0; i < remaining.length; i++) {
                const image = remaining[i];
                const placement = this.findOptimalPosition(image, placed, usableWidth, usableHeight, imageSpacing, allowRotation);
                
                if (placement) {
                    // "2048-style" alignment: Prefer placements that align with existing items
                    let score = -(placement.y * 1000 + placement.x); // Original bottom-left preference
                    
                    // Bonus for aligning with existing item edges (creates natural grid)
                    for (const placedItem of placed) {
                        // Vertical alignment bonus
                        if (Math.abs(placement.x - placedItem.x) < 1) {
                            score += 5000; // Left edges align
                        }
                        if (Math.abs((placement.x + placement.width) - (placedItem.x + placedItem.width)) < 1) {
                            score += 5000; // Right edges align
                        }
                        
                        // Horizontal alignment bonus
                        if (Math.abs(placement.y - placedItem.y) < 1) {
                            score += 5000; // Top edges align
                        }
                        if (Math.abs((placement.y + placement.height) - (placedItem.y + placedItem.height)) < 1) {
                            score += 5000; // Bottom edges align
                        }
                        
                        // Extra bonus for perfect grid alignment (both x and y edges align)
                        const xAlign = Math.abs(placement.x - placedItem.x) < 1 || 
                                      Math.abs((placement.x + placement.width) - (placedItem.x + placedItem.width)) < 1;
                        const yAlign = Math.abs(placement.y - placedItem.y) < 1 || 
                                      Math.abs((placement.y + placement.height) - (placedItem.y + placedItem.height)) < 1;
                        
                        if (xAlign && yAlign) {
                            score += 10000; // Perfect grid alignment
                        }
                    }
                    
                    if (!bestPlacement || score > bestPlacement.score) {
                        bestPlacement = { ...placement, score, imageIndex: i };
                        bestImageIndex = i;
                    }
                }
            }
            
            if (!bestPlacement) {
                console.log(`❌ No more images can fit. Placed ${placed.length}/${images.length}`);
                break;
            }
            
            // Place the best image
            const image = remaining[bestImageIndex];
            placed.push({
                ...image,
                x: bestPlacement.x,
                y: bestPlacement.y,
                width: bestPlacement.width,
                height: bestPlacement.height,
                rotated: bestPlacement.rotated || false
            });
            
            console.log(`✓ Placed ${image.name} at (${bestPlacement.x}, ${bestPlacement.y}) size=${bestPlacement.width}x${bestPlacement.height} rotated=${bestPlacement.rotated}`);
            
            // Remove from remaining
            remaining.splice(bestImageIndex, 1);
        }
        
        console.log(`📊 Final: ${placed.length} placed, ${remaining.length} remaining`);
        return placed;
    }

    findOptimalPosition(image, placedImages, usableWidth, usableHeight, spacing, allowRotation) {
        const orientations = [
            { width: image.width, height: image.height, rotated: false }
        ];
        
        if (allowRotation && image.width !== image.height) {
            orientations.push({ width: image.height, height: image.width, rotated: true });
        }
        
        let bestPosition = null;
        
        for (const orientation of orientations) {
            // Generate a comprehensive grid of possible positions
            const candidates = this.generateAllValidPositions(placedImages, usableWidth, usableHeight, orientation.width, orientation.height, spacing);
            
            for (const candidate of candidates) {
                if (this.isPositionValid(candidate.x, candidate.y, orientation.width, orientation.height, placedImages, spacing, usableWidth, usableHeight)) {
                    // Score: prefer lower positions, then leftmost
                    const score = -(candidate.y * 1000 + candidate.x);
                    
                    if (!bestPosition || score > bestPosition.score) {
                        bestPosition = {
                            x: candidate.x,
                            y: candidate.y,
                            width: orientation.width,
                            height: orientation.height,
                            rotated: orientation.rotated,
                            score
                        };
                    }
                }
            }
        }
        
        return bestPosition;
    }

    generateAllValidPositions(placedImages, usableWidth, usableHeight, itemWidth, itemHeight, spacing) {
        const candidates = [];
        
        // If no images placed yet, start at origin
        if (placedImages.length === 0) {
            candidates.push({ x: 0, y: 0 });
            return candidates;
        }
        
        // Generate positions based on edges of placed images
        const importantX = new Set([0]); // Always include left edge
        const importantY = new Set([0]); // Always include top edge
        
        for (const placed of placedImages) {
            // Important X positions: left edge, right edge + spacing
            importantX.add(placed.x);
            importantX.add(placed.x + placed.width + spacing);
            
            // Important Y positions: top edge, bottom edge + spacing
            importantY.add(placed.y);
            importantY.add(placed.y + placed.height + spacing);
        }        // Convert to sorted arrays and filter valid positions
        const validXPositions = Array.from(importantX)
            .filter(x => x >= 0 && x + itemWidth <= usableWidth)
            .sort((a, b) => a - b);
            
        const validYPositions = Array.from(importantY)
            .filter(y => y >= 0 && y + itemHeight <= usableHeight)
            .sort((a, b) => a - b);
        
        // Generate all combinations of valid X,Y positions
        for (const x of validXPositions) {
            for (const y of validYPositions) {
                candidates.push({ x, y });
            }
        }
        
        console.log(`Generated ${candidates.length} candidate positions for ${itemWidth}x${itemHeight}mm item`);
        return candidates;
    }

    isPositionValid(x, y, width, height, placedImages, spacing, usableWidth, usableHeight) {
        // Check bounds
        if (x < 0 || y < 0 || x + width > usableWidth || y + height > usableHeight) {
            return false;
        }
        
        const newRect = { x, y, width, height };
        
        // Check collision with all placed images (with spacing)
        for (const placed of placedImages) {
            // Only add spacing if spacing > 0 to avoid making rectangles too big
            const spacingToUse = spacing > 0 ? spacing : 0;
            const placedRect = {
                x: placed.x - spacingToUse,
                y: placed.y - spacingToUse,
                width: placed.width + (2 * spacingToUse),
                height: placed.height + (2 * spacingToUse)
            };
            
            if (this.rectanglesOverlap(newRect, placedRect)) {
                return false;
            }
        }
        
        return true;
    }

    // Removed old functions - replaced with more efficient optimal positioning

    // Removed old grid-based functions that were causing layout issues
    // The new bottom-left-fill algorithm provides optimal 2D bin packing

    packWithMaxRects(images, width, height, margin, heuristic, allowRotation) {
        const freeRects = [{ x: 0, y: 0, width: width, height: height }];
        const placedItems = [];
        const remaining = [...images];
        
        // Cut-friendly packing: Initialize rails for shared cut lines
        const railsX = new Set([0, width]);  // Vertical cut lines
        const railsY = new Set([0, height]); // Horizontal cut lines
        const snapTol = 0.5; // Increased snap tolerance to 0.5mm
        const railWeight = 1e6; // Reduced weight to allow more flexibility
        
        // Pre-analyze items to suggest good rail positions
        this.suggestOptimalRails(remaining, railsX, railsY, width, height, allowRotation);
        
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
                            
                        // Add rail penalty for cut-friendly packing
                        const railPenalty = this.calculateRailPenalty(
                            rect.x, rect.y, orientation.w, orientation.h,
                            railsX, railsY, snapTol
                        );
                        
                        // MUCH stronger rail penalty - make alignment almost mandatory
                        score -= railWeight * railPenalty;
                        
                        // Additional bonus for creating regular grids
                        const gridBonus = this.calculateGridBonus(
                            rect.x, rect.y, orientation.w, orientation.h,
                            railsX, railsY, snapTol
                        );
                        score += gridBonus;                            if (score > bestScore) {
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
            
            // Update rails with new item edges for cut-friendly packing
            this.updateRails(bestRect.x, bestRect.y, finalWidth, finalHeight, railsX, railsY, snapTol);
            
            // Remove item from remaining
            const itemIndex = remaining.indexOf(bestItem);
            remaining.splice(itemIndex, 1);
            
            // Split the rectangle
            this.splitRectangle(freeRects, bestRect, finalWidth, finalHeight);
        }
        
        // Post-process: snap items to nearest rails
        this.snapItemsToRails(placedItems, railsX, railsY, snapTol, margin, width, height);
        
        return placedItems;
    }
    
    // Pre-analyze items to suggest optimal rail positions
    suggestOptimalRails(items, railsX, railsY, width, height, allowRotation) {
        // Find the most common dimensions
        const dimensionCounts = new Map();
        
        for (const item of items) {
            const dims = allowRotation ? 
                [[item.width, item.height], [item.height, item.width]] :
                [[item.width, item.height]];
                
            for (const [w, h] of dims) {
                const key = `${w.toFixed(1)}x${h.toFixed(1)}`;
                dimensionCounts.set(key, (dimensionCounts.get(key) || 0) + 1);
            }
        }
        
        // Find the most common size
        let mostCommonSize = null;
        let maxCount = 0;
        for (const [key, count] of dimensionCounts) {
            if (count > maxCount) {
                maxCount = count;
                const [w, h] = key.split('x').map(Number);
                mostCommonSize = { width: w, height: h, count };
            }
        }
        
        if (mostCommonSize) {
            console.log(`Creating grid for most common size: ${mostCommonSize.width}x${mostCommonSize.height} (${mostCommonSize.count} items)`);
            
            // Create a regular grid based on the most common size
            const itemW = mostCommonSize.width;
            const itemH = mostCommonSize.height;
            
            // Add vertical rails (for width)
            for (let x = itemW; x < width; x += itemW) {
                railsX.add(x);
            }
            
            // Add horizontal rails (for height)  
            for (let y = itemH; y < height; y += itemH) {
                railsY.add(y);
            }
            
            // Also add rails for double-width/height to accommodate larger items
            if (itemW * 2 <= width) {
                for (let x = itemW * 2; x < width; x += itemW * 2) {
                    railsX.add(x);
                }
            }
            if (itemH * 2 <= height) {
                for (let y = itemH * 2; y < height; y += itemH * 2) {
                    railsY.add(y);
                }
            }
        }
        
        // Add some additional strategic rails for variety
        const numCols = Math.floor(width / 50); // Assume ~50mm minimum column width
        const numRows = Math.floor(height / 50); // Assume ~50mm minimum row height
        
        for (let i = 1; i < numCols; i++) {
            railsX.add((width / numCols) * i);
        }
        for (let i = 1; i < numRows; i++) {
            railsY.add((height / numRows) * i);
        }
        
        console.log(`Suggested rails - X: ${Array.from(railsX).sort((a,b) => a-b)}`);
        console.log(`Suggested rails - Y: ${Array.from(railsY).sort((a,b) => a-b)}`);
    }
    
    // Helper function to calculate rail penalty for cut-friendly packing
    calculateRailPenalty(x, y, w, h, railsX, railsY, snapTol) {
        const leftEdge = x;
        const rightEdge = x + w;
        const topEdge = y;
        const bottomEdge = y + h;
        
        let penalty = 0;
        
        // Check each edge against existing rails
        const leftDist = this.distToNearestRail(leftEdge, railsX, snapTol);
        const rightDist = this.distToNearestRail(rightEdge, railsX, snapTol);
        const topDist = this.distToNearestRail(topEdge, railsY, snapTol);
        const bottomDist = this.distToNearestRail(bottomEdge, railsY, snapTol);
        
        // MASSIVE penalty for edges that don't align with existing rails
        if (leftDist > snapTol) penalty += 10000;
        if (rightDist > snapTol) penalty += 10000;
        if (topDist > snapTol) penalty += 10000;
        if (bottomDist > snapTol) penalty += 10000;
        
        // Perfect alignment gets huge bonus
        if (leftDist === 0) penalty -= 5000;
        if (rightDist === 0) penalty -= 5000;
        if (topDist === 0) penalty -= 5000;
        if (bottomDist === 0) penalty -= 5000;
        
        return penalty;
    }
    
    // Calculate bonus for creating regular grid patterns
    calculateGridBonus(x, y, w, h, railsX, railsY, snapTol) {
        let bonus = 0;
        
        // Check if this placement creates or extends a regular pattern
        const leftEdge = x;
        const rightEdge = x + w;
        const topEdge = y;
        const bottomEdge = y + h;
        
        // Bonus for aligning with multiple existing rails
        let alignedEdges = 0;
        if (this.distToNearestRail(leftEdge, railsX, snapTol) === 0) alignedEdges++;
        if (this.distToNearestRail(rightEdge, railsX, snapTol) === 0) alignedEdges++;
        if (this.distToNearestRail(topEdge, railsY, snapTol) === 0) alignedEdges++;
        if (this.distToNearestRail(bottomEdge, railsY, snapTol) === 0) alignedEdges++;
        
        // Exponential bonus for more aligned edges
        bonus += Math.pow(alignedEdges, 3) * 1000;
        
        return bonus;
    }
    
    // Helper function to find distance to nearest rail
    distToNearestRail(coord, rails, snapTol) {
        let minDist = Infinity;
        for (const rail of rails) {
            const dist = Math.abs(coord - rail);
            if (dist < minDist) {
                minDist = dist;
            }
        }
        return minDist <= snapTol ? 0 : minDist;
    }
    
    // Helper function to update rails when placing an item
    updateRails(x, y, w, h, railsX, railsY, snapTol) {
        const leftEdge = x;
        const rightEdge = x + w;
        const topEdge = y;
        const bottomEdge = y + h;
        
        // Add vertical rails (x coordinates)
        this.addRailIfNew(leftEdge, railsX, snapTol);
        this.addRailIfNew(rightEdge, railsX, snapTol);
        
        // Add horizontal rails (y coordinates)
        this.addRailIfNew(topEdge, railsY, snapTol);
        this.addRailIfNew(bottomEdge, railsY, snapTol);
    }
    
    // Helper function to add a rail if it's not within snap tolerance of existing ones
    addRailIfNew(coord, rails, snapTol) {
        const railsArray = Array.from(rails);
        
        // First check if we should snap to an existing rail
        for (const rail of railsArray) {
            if (Math.abs(coord - rail) <= snapTol) {
                return; // Don't add, use existing rail
            }
        }
        
        // Add the new rail
        rails.add(coord);
        
        // More aggressive merging - look for rails that could be consolidated
        this.mergeCloseRails(rails, snapTol * 2); // Use larger tolerance for merging
    }
    
    // Helper function to merge rails that are closer than snap tolerance
    mergeCloseRails(rails, snapTol) {
        const railsArray = Array.from(rails).sort((a, b) => a - b);
        const toRemove = new Set();
        
        for (let i = 1; i < railsArray.length; i++) {
            if (railsArray[i] - railsArray[i-1] <= snapTol) {
                // Keep the lower coordinate, remove the higher one
                toRemove.add(railsArray[i]);
            }
        }
        
        for (const rail of toRemove) {
            rails.delete(rail);
        }
    }
    
    // Step 2: Post-process snap to clean up rounding
    snapItemsToRails(placedItems, railsX, railsY, snapTol, margin, pageWidth, pageHeight) {
        // Increase snap tolerance for post-processing
        const postSnapTol = snapTol * 3; // More aggressive snapping
        
        for (const item of placedItems) {
            // Convert back to rect coordinates (remove margin)
            const rectX = item.x - margin;
            const rectY = item.y - margin;
            
            // Find nearest rails for each edge with increased tolerance
            const nearestLeft = this.findNearestRail(rectX, railsX, postSnapTol);
            const nearestTop = this.findNearestRail(rectY, railsY, postSnapTol);
            
            // Also check if right/bottom edges can align
            const rectRight = rectX + item.width;
            const rectBottom = rectY + item.height;
            const nearestRight = this.findNearestRail(rectRight, railsX, postSnapTol);
            const nearestBottom = this.findNearestRail(rectBottom, railsY, postSnapTol);
            
            let newX = rectX;
            let newY = rectY;
            
            // Prioritize left/top edge snapping, but consider right/bottom if better
            if (nearestLeft !== null && nearestLeft >= 0 && nearestLeft + item.width <= pageWidth) {
                newX = nearestLeft;
            } else if (nearestRight !== null && nearestRight <= pageWidth && nearestRight - item.width >= 0) {
                newX = nearestRight - item.width;
            }
            
            if (nearestTop !== null && nearestTop >= 0 && nearestTop + item.height <= pageHeight) {
                newY = nearestTop;
            } else if (nearestBottom !== null && nearestBottom <= pageHeight && nearestBottom - item.height >= 0) {
                newY = nearestBottom - item.height;
            }
            
            // Update item position (add margin back) with precise rounding
            item.x = Math.round((newX + margin) * 1000) / 1000;
            item.y = Math.round((newY + margin) * 1000) / 1000;
        }
    }
    
    // Helper function to find nearest rail within snap tolerance
    findNearestRail(coord, rails, snapTol) {
        let nearestRail = null;
        let minDistance = Infinity;
        
        for (const rail of rails) {
            const distance = Math.abs(coord - rail);
            if (distance <= snapTol && distance < minDistance) {
                minDistance = distance;
                nearestRail = rail;
            }
        }
        
        return nearestRail;
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
            // Dynamic sizing based on container width and aspect ratio
            const containerWidth = Math.min(300, window.innerWidth * 0.25); // Max 300px or 25% of screen width
            const previewWidth = containerWidth;
            const previewHeight = previewWidth / aspectRatio;
            const scale = previewWidth / paperWidth;

            pageDiv.innerHTML = `
                <div class="page-title">Page ${index + 1}</div>
                <div class="page-content" style="width: ${previewWidth}px; height: ${previewHeight}px; overflow: hidden; position: relative;">
                </div>
            `;

            const pageContent = pageDiv.querySelector('.page-content');

            page.images.forEach(img => {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'placed-image';
                // Add outer margin to the positions since packing was done on printable area
                imgDiv.style.left = `${(img.x + outerMargin) * scale}px`;
                imgDiv.style.top = `${(img.y + outerMargin) * scale}px`;
                imgDiv.style.width = `${img.width * scale}px`;
                imgDiv.style.height = `${img.height * scale}px`;
                
                // Create display text and full text for tooltip
                const fullText = `${img.name}${img.rotated ? ' (R)' : ''}`;
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                
                // Add size class for appropriate styling
                if (scaledWidth < 20 || scaledHeight < 15) {
                    imgDiv.classList.add('size-micro');
                } else if (scaledWidth < 35 || scaledHeight < 20) {
                    imgDiv.classList.add('size-tiny');
                } else if (scaledWidth < 60 || scaledHeight < 30) {
                    imgDiv.classList.add('size-small');
                }
                
                // For very small images, show abbreviated text
                let displayText = fullText;
                if (scaledWidth < 20 || scaledHeight < 15) {
                    // Micro image - no text (handled by CSS)
                    displayText = '';
                } else if (scaledWidth < 35 || scaledHeight < 20) {
                    // Tiny image - show just initials or very short version
                    const nameParts = img.name.split(/[-._]/);
                    if (nameParts.length > 1) {
                        displayText = nameParts.map(part => part.charAt(0)).join('').toUpperCase();
                    } else {
                        displayText = img.name.substring(0, 2) + (img.name.length > 2 ? '.' : '');
                    }
                    if (img.rotated) displayText += 'R';
                } else if (scaledWidth < 80 || scaledHeight < 30) {
                    // Small image - show shortened filename
                    const maxLength = Math.floor(scaledWidth / 7); // Roughly 7px per character
                    if (fullText.length > maxLength) {
                        displayText = img.name.substring(0, Math.max(3, maxLength - 3)) + '...';
                        if (img.rotated) displayText += ' (R)';
                    }
                }
                
                imgDiv.textContent = displayText;
                imgDiv.title = fullText; // Tooltip with full name
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

    async exportToPDFWithLoading() {
        if (this.layout.length === 0) {
            alert('Please generate a layout first!');
            return;
        }

        this.showLoading('Preparing PDF export...');
        
        try {
            await this.exportToPDF();
        } finally {
            this.hideLoading();
        }
    }

    async exportToPDF() {
        try {
            console.log('🔄 Starting PDF export...');
            
            console.log('📋 Layout data:', this.layout);

            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                console.error('❌ jsPDF library not loaded');
                alert('PDF library not loaded. Please refresh the page.');
                return;
            }

            console.log('✅ jsPDF library loaded');
            
            const paperWidth = parseFloat(document.getElementById('paperWidth').value);
            const paperHeight = parseFloat(document.getElementById('paperHeight').value);
            const outerMargin = parseFloat(document.getElementById('outerMargin').value);

            console.log('📏 Paper settings:', { paperWidth, paperHeight, outerMargin });

            // Convert mm to points (1mm = 2.834645669 points)
            const mmToPt = 2.834645669;
            const pdf = new jsPDF({
                orientation: paperWidth > paperHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [paperWidth, paperHeight]
            });

            console.log('📄 PDF document created');

            for (let pageIndex = 0; pageIndex < this.layout.length; pageIndex++) {
                console.log(`🔄 Processing page ${pageIndex + 1}/${this.layout.length}`);
                
                // Update loading message
                const loadingText = document.querySelector('.loading-content p');
                if (loadingText) {
                    loadingText.textContent = `Preparing PDF... Page ${pageIndex + 1}/${this.layout.length}`;
                }
                
                if (pageIndex > 0) {
                    pdf.addPage();
                }

                const page = this.layout[pageIndex];

                for (const img of page.images) {
                    try {
                        console.log('🖼️ Processing image:', img.originalName);
                        
                        // Load image and add to PDF
                        const imageData = await this.loadImageForPDF(img);
                        
                        pdf.addImage(
                            imageData,
                            'JPEG',
                            img.x + outerMargin,  // Add outer margin to position
                            img.y + outerMargin,  // Add outer margin to position
                            img.width,
                            img.height,
                            undefined,
                            'FAST'
                        );
                        
                        console.log('✅ Image added to PDF');
                    } catch (error) {
                        console.error('❌ Error adding image to PDF:', error);
                    }
                }
            }

            console.log('💾 Saving PDF...');
            pdf.save('fitprint-layout.pdf');
            console.log('✅ PDF export completed successfully');
            
        } catch (error) {
            console.error('❌ PDF Export Error:', error);
            alert('Error exporting to PDF: ' + error.message);
        }
    }

    loadImageForPDF(imgData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Get quality setting
                const quality = parseFloat(document.getElementById('imageQuality').value);
                
                // Determine if original image has transparency
                const hasTransparency = imgData.dataUrl.startsWith('data:image/png');
                
                if (imgData.rotated) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                    
                    // Set white background for non-transparent images, or keep transparent for PNG
                    if (!hasTransparency) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Set white background for non-transparent images, or keep transparent for PNG
                    if (!hasTransparency) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);
                }
                
                // Use PNG for transparent images, JPEG for others (with compression)
                if (hasTransparency) {
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    resolve(canvas.toDataURL('image/jpeg', quality));
                }
            };
            img.onerror = reject;
            img.src = imgData.dataUrl;
        });
    }
}

// Initialize the application
const fitPrint = new FitPrint();
