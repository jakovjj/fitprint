# FitPrint

A smart web application for optimally fitting images on printable pages with automatic layout generation and PDF export.

## Features

- **Image Upload**: Support for multiple image formats
- **Smart Layout Algorithm**: Automatically fits images with minimal page usage
- **Rotation Support**: Images can be rotated 90° for better space utilization
- **Customizable Settings**:
  - Paper size configuration (width/height in mm)
  - Outer and inner margins
  - Individual image sizing
  - Copy quantity per image
- **Real-time Preview**: Visual representation of the layout
- **PDF Export**: Direct export to printable PDF format
- **Modern UI**: Clean white and red theme
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Upload Images**: Click "Choose Images" to select multiple image files
2. **Configure Paper**: Set paper dimensions and margins in millimeters
3. **Adjust Images**: For each image, set:
   - Width and height in millimeters
   - Number of copies needed
4. **Generate Layout**: Click "Generate Layout" to run the smart packing algorithm
5. **Preview**: Review the optimized layout showing all pages
6. **Export**: Click "Export to PDF" to download the printable file

## Technical Details

### Smart Packing Algorithm

The application uses a sophisticated bin packing algorithm that:
- Tries both normal and 90° rotated orientations for each image
- Minimizes wasted space on each page
- Splits available space efficiently after placing each image
- Optimizes for the minimum number of pages required

### Supported Formats

- Input: JPG, PNG, GIF, WebP, and other browser-supported image formats
- Output: PDF with precise positioning and scaling

## Browser Requirements

- Modern web browser with JavaScript enabled
- Support for HTML5 File API
- Canvas API support for image processing

## Getting Started

1. Open `index.html` in your web browser
2. No installation or server setup required
3. Works entirely in the browser - no data is sent to external servers

## Privacy

All image processing happens locally in your browser. No images or data are uploaded to external servers.
