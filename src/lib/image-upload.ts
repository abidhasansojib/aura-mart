import imageCompression from "browser-image-compression";

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export async function compressAndUploadImage(file: File): Promise<string> {
  const options = {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  };

  let compressedFile: File | Blob;
  try {
    compressedFile = await imageCompression(file, options);
  } catch (error) {
    console.warn("Image compression failed, using original file:", error);
    compressedFile = file;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Fallback: If Cloudinary credentials are not configured, return Base64 data URL for local testing
  if (
    !cloudName ||
    cloudName === "your-cloud-name" ||
    !uploadPreset ||
    uploadPreset === "your-unsigned-preset"
  ) {
    console.info("Cloudinary not configured. Generating Base64 image data URL as fallback.");
    return await fileToBase64(compressedFile);
  }

  try {
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("upload_preset", uploadPreset);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.warn("Cloudinary direct upload failed, returning Base64:", errorMsg);
      return await fileToBase64(compressedFile);
    }

    const data = await response.json();
    return data.secure_url || data.url;
  } catch (error) {
    console.warn("Network error during Cloudinary upload, returning Base64:", error);
    return await fileToBase64(compressedFile);
  }
}
