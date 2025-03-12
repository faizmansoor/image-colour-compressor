# Image Colour Compression Tool

A web application that compresses images by reducing the number of colours using K-means clustering, an unsupervised machine learning algorithm.

## Features

- Upload and compress images by reducing the number of colours
- Adjust compression level by selecting the number of colours (1-64)
- Visualize upload and processing progress
- Automatic download of compressed images
- Support for various image formats (JPEG, PNG, GIF, BMP)
- Handles images with and without alpha channel (transparency)

## How It Works

This tool uses the K-means clustering algorithm to reduce the number of colours in an image:

1. The image is converted to a pixel array
2. K-means clustering groups similar colours together
3. Each pixel is replaced with its nearest cluster center (centroid)
4. The result is a visually similar image with fewer colours, resulting in a smaller file size

## Tech Stack

### Backend

- **Python 3.x**
- **Flask** (Web framework)
- **NumPy** (Numerical operations)
- **scikit-learn** (K-means implementation)
- **Pillow** (Image processing)

### Frontend

- **React.js**
- **Axios** (HTTP client)
- **CSS3** with responsive design

## Usage

1. Upload an image (up to 5MB)
2. Adjust the number of colours using the slider
3. Click **"Compress & Download"**
4. Wait for the processing to complete
5. The compressed image will download automatically

## Limitations

- **Maximum file size**: 5MB
- **Processing time**: Very large resolution images may take longer
- **Best for images with distinct colour regions**
