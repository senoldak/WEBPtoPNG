chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'convertUrl') {
    convertWebpImage(message)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});

async function convertWebpImage(options) {
  const {
    url,
    filename = 'converted_image',
    format = 'png',
    quality = 0.92,
    scale = 1.0,
    bgFill = 'transparent',
    copyToClipboard = false
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      let imageSrc = url;
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          imageSrc = URL.createObjectURL(blob);
        }
      } catch (fetchErr) {
        // Fallback to direct URL
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const canvas = document.getElementById('conversion-canvas');
          const srcWidth = img.naturalWidth || img.width;
          const srcHeight = img.naturalHeight || img.height;

          const targetWidth = Math.max(1, Math.round(srcWidth * scale));
          const targetHeight = Math.max(1, Math.round(srcHeight * scale));

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, targetWidth, targetHeight);

          // Apply background fill if needed (e.g. for JPEG or user preference)
          if (format === 'jpeg' || (bgFill && bgFill !== 'transparent')) {
            ctx.fillStyle = (bgFill === 'transparent' || !bgFill) ? '#ffffff' : bgFill;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Map format type
          let mimeType = 'image/png';
          let extension = '.png';
          const fmtLower = format.toLowerCase();

          if (fmtLower === 'jpeg' || fmtLower === 'jpg') {
            mimeType = 'image/jpeg';
            extension = '.jpg';
          } else if (fmtLower === 'webp') {
            mimeType = 'image/webp';
            extension = '.webp';
          } else if (fmtLower === 'bmp') {
            mimeType = 'image/bmp';
            extension = '.bmp';
          }

          const dataUrl = canvas.toDataURL(mimeType, quality);
          let targetFilename = filename.replace(/\.(webp|png|jpe?g|bmp)$/i, '') + extension;

          if (imageSrc.startsWith('blob:')) {
            URL.revokeObjectURL(imageSrc);
          }

          // Handle Copy to Clipboard if requested
          let copied = false;
          if (copyToClipboard) {
            try {
              if (typeof window !== 'undefined' && window.focus) {
                window.focus();
              }
              canvas.toBlob(async (blob) => {
                if (blob) {
                  try {
                    const type = blob.type || 'image/png';
                    await navigator.clipboard.write([
                      new ClipboardItem({ [type]: blob })
                    ]);
                    copied = true;
                  } catch (clipErr) {
                    // Handled gracefully if window focus is restricted by browser policy
                    copied = false;
                  }
                }
                resolve({ success: true, dataUrl, filename: targetFilename, copied });
              }, 'image/png');
              return;
            } catch (err) {
              copied = false;
            }
          }

          resolve({ success: true, dataUrl, filename: targetFilename, copied });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image or WebP format unsupported.'));
      img.src = imageSrc;
    } catch (err) {
      reject(err);
    }
  });
}
