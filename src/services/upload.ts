import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { handleSupabaseError } from '../utils/errorHandling';

// Supported bucket names
export type StorageBucket = 'avatars' | 'posts' | 'covers' | 'messages';

// File types that can be uploaded
export type FileType = 'image' | 'video' | 'audio' | 'document';

// Mime types mapped to file extensions
const mimeTypeMap: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// Maximum file sizes by type in bytes
const maxFileSizes: Record<FileType, number> = {
  image: 5 * 1024 * 1024, // 5MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 20 * 1024 * 1024, // 20MB
  document: 10 * 1024 * 1024, // 10MB
};

// Allowed mime types by file type
const allowedMimeTypes: Record<FileType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

/**
 * Get file type from mime type
 * @param mimeType The mime type of the file
 * @returns The file type or null if not supported
 */
export function getFileTypeFromMimeType(mimeType: string): FileType | null {
  for (const [type, mimeTypes] of Object.entries(allowedMimeTypes)) {
    if (mimeTypes.includes(mimeType)) {
      return type as FileType;
    }
  }
  return null;
}

/**
 * Check if a file is valid for upload
 * @param file The file to validate
 * @param allowedTypes Array of allowed file types
 * @returns Object indicating validity and any error message
 */
export function validateFile(
  file: File,
  allowedTypes: FileType[] = ['image', 'video', 'audio', 'document']
): { valid: boolean; error?: string } {
  const fileType = getFileTypeFromMimeType(file.type);
  
  if (!fileType) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type}` 
    };
  }
  
  if (!allowedTypes.includes(fileType)) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  if (file.size > maxFileSizes[fileType]) {
    const maxSize = maxFileSizes[fileType] / (1024 * 1024);
    return { 
      valid: false, 
      error: `File too large. Maximum size for ${fileType} files is ${maxSize}MB` 
    };
  }
  
  return { valid: true };
}

/**
 * Generate a unique filename for upload
 * @param file The file to generate a name for
 * @returns A unique filename with appropriate extension
 */
export function generateUniqueFilename(file: File): string {
  const extension = mimeTypeMap[file.type] || file.name.split('.').pop() || 'unknown';
  return `${uuidv4()}.${extension}`;
}

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket to upload to
 * @param path Optional path within the bucket
 * @param filename Optional custom filename (will generate unique name if not provided)
 * @returns URL of the uploaded file or error
 */
export async function uploadFile(
  file: File,
  bucket: StorageBucket,
  path: string = '',
  filename?: string
) {
  try {
    const fileType = getFileTypeFromMimeType(file.type);
    if (!fileType) {
      return {
        data: null,
        error: {
          message: `Unsupported file type: ${file.type}`,
          status: 400
        }
      };
    }
    
    const finalFilename = filename || generateUniqueFilename(file);
    const fullPath = path ? `${path}/${finalFilename}` : finalFilename;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      return await handleSupabaseError(error, 'uploading file');
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return {
      data: {
        path: data.path,
        url: publicUrl,
        size: file.size,
        type: file.type,
        fileType
      },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'uploading file');
  }
}

/**
 * Upload multiple files at once
 * @param files Array of files to upload
 * @param bucket The storage bucket to upload to
 * @param path Optional path within the bucket
 * @returns Array of results for each file
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: StorageBucket,
  path: string = ''
) {
  try {
    const uploadPromises = files.map(file => uploadFile(file, bucket, path));
    const results = await Promise.all(uploadPromises);
    
    // Count successful uploads
    const successCount = results.filter(result => !result.error).length;
    
    return {
      data: {
        results,
        successCount,
        totalCount: files.length
      },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'uploading multiple files');
  }
}

/**
 * Delete a file from storage
 * @param path The path to the file including filename
 * @param bucket The storage bucket containing the file
 * @returns Success status or error
 */
export async function deleteFile(path: string, bucket: StorageBucket) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      return await handleSupabaseError(error, 'deleting file');
    }
    
    return {
      data: { success: true },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'deleting file');
  }
}

/**
 * Delete multiple files from storage
 * @param paths Array of file paths to delete
 * @param bucket The storage bucket containing the files
 * @returns Success status or error
 */
export async function deleteMultipleFiles(paths: string[], bucket: StorageBucket) {
  try {
    if (paths.length === 0) {
      return {
        data: { deletedCount: 0 },
        error: null
      };
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    
    if (error) {
      return await handleSupabaseError(error, 'deleting multiple files');
    }
    
    return {
      data: { 
        success: true,
        deletedCount: paths.length
      },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'deleting multiple files');
  }
}

/**
 * Get file URL from path
 * @param path The path to the file
 * @param bucket The storage bucket containing the file
 * @returns Public URL of the file
 */
export function getFileUrl(path: string, bucket: StorageBucket): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Check if a file exists in storage
 * @param path The path to check
 * @param bucket The storage bucket to check in
 * @returns Boolean indicating if file exists
 */
export async function fileExists(path: string, bucket: StorageBucket) {
  try {
    // Try to get metadata for the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 1); // Very short expiry just to check existence
    
    if (error) {
      // If error code indicates file not found, return false
      if (error.message.includes('not found') || error.message.includes('Not Found')) {
        return {
          data: { exists: false },
          error: null
        };
      }
      return await handleSupabaseError(error, 'checking file existence');
    }
    
    return {
      data: { exists: !!data },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'checking file existence');
  }
} 