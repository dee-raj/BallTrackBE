import cloudinary from "../config/cloudinary";
import { UploadApiOptions, UploadApiResponse } from "cloudinary";

async function uploadFile(
    filePath: string,
    options?: UploadApiOptions
): Promise<UploadApiResponse> {
    try {
        const result = await cloudinary.uploader.upload(filePath, options);
        return result;
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw error;
    }
}

async function uploadBuffer(
    buffer: Buffer,
    options?: UploadApiOptions
): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Cloudinary upload failed'));
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
}

export { uploadFile, uploadBuffer };