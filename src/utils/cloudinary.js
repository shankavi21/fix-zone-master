/**
 * Cloudinary Upload Utility
 * Centralized file upload functionality for the application
 */

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a single file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The folder path in Cloudinary (e.g., 'technician_applications/profile')
 * @param {object} options - Additional upload options
 * @returns {Promise<string>} - The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (file, folder = '', options = {}) => {
    if (!file) {
        throw new Error('No file provided for upload');
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(
            'Cloudinary credentials not configured. Please set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET in .env.local'
        );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    if (folder) {
        formData.append('folder', folder);
    }

    // Add any additional options
    Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
    });

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - The folder path in Cloudinary
 * @param {object} options - Additional upload options
 * @returns {Promise<string[]>} - Array of secure URLs
 */
export const uploadMultipleToCloudinary = async (files, folder = '', options = {}) => {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map(file => uploadToCloudinary(file, folder, options));
    return await Promise.all(uploadPromises);
};

/**
 * Get a transformed Cloudinary URL
 * @param {string} url - Original Cloudinary URL
 * @param {object} transformations - Transformation options
 * @returns {string} - Transformed URL
 * 
 * Example transformations:
 * { width: 200, height: 200, crop: 'fill' }
 * { quality: 'auto', fetch_format: 'auto' }
 */
export const getTransformedUrl = (url, transformations = {}) => {
    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }

    const transformParts = [];

    if (transformations.width) transformParts.push(`w_${transformations.width}`);
    if (transformations.height) transformParts.push(`h_${transformations.height}`);
    if (transformations.crop) transformParts.push(`c_${transformations.crop}`);
    if (transformations.quality) transformParts.push(`q_${transformations.quality}`);
    if (transformations.format) transformParts.push(`f_${transformations.format}`);

    if (transformParts.length === 0) {
        return url;
    }

    const transformString = transformParts.join(',');
    return url.replace('/upload/', `/upload/${transformString}/`);
};

/**
 * Delete a file from Cloudinary (requires backend implementation with API secret)
 * Note: This is a placeholder - actual deletion should be done server-side
 * @param {string} publicId - The public ID of the file to delete
 */
export const deleteFromCloudinary = async (publicId) => {
    console.warn('Delete functionality requires backend implementation for security');
    // This would need to call your backend API that has the Cloudinary API secret
    // Never expose your API secret in the frontend!
};

export default {
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    getTransformedUrl,
    deleteFromCloudinary
};
