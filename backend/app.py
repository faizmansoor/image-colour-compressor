from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import numpy as np
from sklearn.cluster import KMeans
from PIL import Image
import io
from datetime import datetime
import logging
import uuid

from dotenv import load_dotenv
import os

load_dotenv() 

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('image_compressor')

# Create upload folder if it doesn't exist
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create processed folder for compressed images
PROCESSED_FOLDER = 'processed'
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)

# Configure max file size (5MB)
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

# Model service class
class ImageCompressorService:
    def __init__(self):
        logger.info("Initializing ImageCompressorService")
    
    def compress_image(self, image_path, k=8):
    
        logger.info(f"Compressing image {image_path} with k={k}")
    
        try:
            # Open image and convert to numpy array
            img = Image.open(image_path)
            img_array = np.array(img)
        
            # Remember original shape
            original_shape = img_array.shape
            logger.info(f"Image shape: {original_shape}")
        
            # Check if image has alpha channel and handle accordingly
            has_alpha = False
            if len(original_shape) == 3 and original_shape[2] == 4:
                has_alpha = True
                # Separate the alpha channel
                alpha_channel = img_array[:, :, 3]
                # Process only RGB channels
                img_array = img_array[:, :, :3]
        
            # Reshape the array to be a list of pixels
            pixel_samples = img_array.reshape((-1, 3 if len(original_shape) > 2 else 1))
        
            # Apply K-means clustering
            logger.info(f"Running K-means with k={k}")
            kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
            kmeans.fit(pixel_samples)
        
            # Replace each pixel with its centroid
            compressed = kmeans.cluster_centers_[kmeans.labels_]
        
            # Reshape back to original shape
            if len(original_shape) > 2:
                compressed = compressed.reshape(original_shape[0], original_shape[1], -1).astype(np.uint8)
            else:
                # Handle grayscale images
                compressed = compressed.reshape(original_shape).astype(np.uint8)
        
            # Reattach alpha channel if it existed
            if has_alpha:
                # Create a new array with RGBA
                rgba_compressed = np.zeros((original_shape[0], original_shape[1], 4), dtype=np.uint8)
                rgba_compressed[:, :, :3] = compressed
                rgba_compressed[:, :, 3] = alpha_channel
                compressed = rgba_compressed
            
            # Create compressed image
            compressed_img = Image.fromarray(compressed)
            
            # Calculate compression stats
            original_size = os.path.getsize(image_path)
            
            # Save to bytes buffer
            buffer = io.BytesIO()
            compressed_img.save(buffer, format="PNG")
            buffer.seek(0)
            
            # Get compressed size from buffer
            compressed_size = buffer.getbuffer().nbytes
            
            # Calculate compression ratio
            compression_ratio = original_size / compressed_size if compressed_size > 0 else 0
            
            logger.info(f"Compression successful. Original: {original_size} bytes, " +
                       f"Compressed: {compressed_size} bytes, Ratio: {compression_ratio:.2f}x")
            
            return buffer, compression_ratio, original_size, compressed_size
            
        except Exception as e:
            logger.error(f"Error compressing image: {str(e)}")
            raise

# Create a singleton instance of the service
compressor_service = ImageCompressorService()


@app.route('/compress', methods=['POST'])
def compress_image():
    """Endpoint to compress an image by reducing its colours"""
    try:
        # Check if the post request has the file part
        if 'file' not in request.files:
            logger.warning("No file part in request")
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            logger.warning("No selected file")
            return jsonify({"error": "No selected file"}), 400
        
        # Get number of colours (k) from form
        k = int(request.form.get('colours', 8))
        if k < 1 or k > 256:
            logger.warning(f"Invalid colour count: {k}")
            return jsonify({"error": "Number of colours must be between 1 and 256"}), 400
        
        # Generate a unique filename 
        file_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f"{timestamp}_{file_id}_{file.filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save the uploaded file
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        logger.info(f"File uploaded: {filename}, Size: {file_size} bytes")
        
        # Calls compress_image() to process the uploaded image
        compressed_buffer, compression_ratio, original_size, compressed_size = compressor_service.compress_image(file_path, k)
        
        # Save compression stats
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "compression_ratio": compression_ratio,
            "colours": k
        }
        logger.info(f"Compression stats: {log_entry}")
        
        # Return the compressed image for download
        return send_file(
            compressed_buffer,
            as_attachment=True,
            download_name=f"compressed_{file.filename}",
            mimetype='image/png'
        )
        
    except Exception as e:
        logger.error(f"Error in compress_image endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file size exceeding the limit"""
    logger.warning("File upload exceeds size limit")
    return jsonify({"error": "File too large. Maximum file size is 5MB."}), 413

if __name__ == '__main__':
    logger.info("Starting Image Compressor application")
    app.run(debug=True)