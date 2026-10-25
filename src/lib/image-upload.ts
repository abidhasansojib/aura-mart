import imageCompression from "browser-image-compression";

/**
 * Automatically detects and trims excessive solid-white or transparent border padding
 * so uploaded logos, product cutouts, and icons cleanly fill their containers.
 */
async function autoTrimWhitespace(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h || w < 20 || h < 20) {
          return resolve(file);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample corners to check if background is predominantly white or transparent
        const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
        let whiteCorners = 0;
        let transCorners = 0;

        for (const idx of corners) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 20) {
            transCorners++;
          } else if (r > 240 && g > 240 && b > 240) {
            whiteCorners++;
          }
        }

        const isTransparentBg = transCorners >= 3;
        const isWhiteBg = whiteCorners >= 3;

        // If corners are full bleed / colorful scene photo, do not trim
        if (!isTransparentBg && !isWhiteBg) {
          return resolve(file);
        }

        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        let foundContent = false;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            let isContent = false;
            if (isTransparentBg) {
              if (a >= 25) isContent = true;
            } else {
              if (a > 25 && (r < 235 || g < 235 || b < 235)) {
                isContent = true;
              }
            }

            if (isContent) {
              foundContent = true;
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (!foundContent) return resolve(file);

        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;

        // If content already spans >= 92% of both dimensions, trimming is unnecessary
        if (contentW >= w * 0.92 && contentH >= h * 0.92) {
          return resolve(file);
        }

        // Add 3% breathing room padding
        const padX = Math.round(contentW * 0.03);
        const padY = Math.round(contentH * 0.03);

        const cropX = Math.max(0, minX - padX);
        const cropY = Math.max(0, minY - padY);
        const cropW = Math.min(w - cropX, contentW + padX * 2);
        const cropH = Math.min(h - cropY, contentH + padY * 2);

        const outCanvas = document.createElement("canvas");
        outCanvas.width = cropW;
        outCanvas.height = cropH;
        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) return resolve(file);

        if (isWhiteBg) {
          outCtx.fillStyle = "#ffffff";
          outCtx.fillRect(0, 0, cropW, cropH);
        }

        outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        outCanvas.toBlob(
          (blob) => {
            if (blob) {
              const trimmedFile = new File([blob], file.name, {
                type: file.type || "image/png",
              });
              resolve(trimmedFile);
            } else {
              resolve(file);
            }
          },
          file.type || "image/png",
          0.95
        );
      } catch (err) {
        console.warn("Auto-trim failed, using original file:", err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export async function compressAndUploadImage(file: File): Promise<string> {
  const preparedFile = await autoTrimWhitespace(file);
  const options = {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  };

  let compressedFile: File | Blob;
  try {
    compressedFile = await imageCompression(preparedFile, options);
  } catch (error) {
    console.warn("Image compression failed, using original file:", error);
    compressedFile = preparedFile;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // If Cloudinary credentials are not configured, upload directly to server storage /api/admin/upload
  if (
    !cloudName ||
    cloudName === "your-cloud-name" ||
    !uploadPreset ||
    uploadPreset === "your-unsigned-preset"
  ) {
    try {
      const serverFormData = new FormData();
      serverFormData.append("file", compressedFile, file.name || "product.webp");
      const serverRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: serverFormData,
      });

      if (serverRes.ok) {
        const result = await serverRes.json();
        if (result.url) {
          return result.url;
        }
      }
    } catch (serverErr) {
      console.warn("Direct server upload failed, falling back to Base64:", serverErr);
    }

    console.info("Using Base64 image fallback.");
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
