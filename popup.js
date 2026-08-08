document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileListContainer = document.getElementById('file-list-container');
  const fileList = document.getElementById('file-list');
  const clearListBtn = document.getElementById('clear-list-btn');
  const downloadZipBtn = document.getElementById('download-zip-btn');
  
  const formatSelect = document.getElementById('format-select');
  const qualityContainer = document.getElementById('quality-container');
  const qualityRange = document.getElementById('quality-range');
  const qualityVal = document.getElementById('quality-val');
  const scaleSelect = document.getElementById('scale-select');
  const bgSelect = document.getElementById('bg-select');
  const folderInput = document.getElementById('folder-input');

  const canvas = document.getElementById('popup-canvas');
  const ctx = canvas.getContext('2d');

  const convertedFilesHistory = [];

  // Toggle Quality Slider visibility based on format
  formatSelect.addEventListener('change', () => {
    if (formatSelect.value === 'jpeg' || formatSelect.value === 'webp') {
      qualityContainer.style.display = 'flex';
    } else {
      qualityContainer.style.display = 'none';
    }
  });

  qualityRange.addEventListener('input', () => {
    qualityVal.textContent = `${qualityRange.value}%`;
  });

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
  });

  ['dragleave', 'dragend'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.remove('active'));
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      handleFiles(fileInput.files);
    }
  });

  clearListBtn.addEventListener('click', () => {
    fileList.innerHTML = '';
    convertedFilesHistory.length = 0;
    fileListContainer.style.display = 'none';
  });

  downloadZipBtn.addEventListener('click', async () => {
    if (!convertedFilesHistory.length) return;
    try {
      downloadZipBtn.disabled = true;
      downloadZipBtn.textContent = 'Packing ZIP...';

      const zip = new JSZip();
      for (const item of convertedFilesHistory) {
        if (item.dataUrl) {
          const base64Data = item.dataUrl.split(',')[1];
          zip.file(item.filename, base64Data, { base64: true });
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const zipFilename = `converted_images_${Date.now()}.zip`;

      if (typeof chrome !== 'undefined' && chrome.downloads) {
        chrome.downloads.download({
          url: zipUrl,
          filename: zipFilename,
          saveAs: false
        });
      } else {
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = zipFilename;
        link.click();
      }

      downloadZipBtn.disabled = false;
      downloadZipBtn.textContent = 'ZIP Archive';
    } catch (err) {
      alert(`ZIP Error: ${err.message}`);
      downloadZipBtn.disabled = false;
      downloadZipBtn.textContent = 'ZIP Archive';
    }
  });

  async function handleFiles(files) {
    const webpFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.webp') || file.type === 'image/webp');
    if (!webpFiles.length) {
      alert('Please select valid .webp file(s).');
      return;
    }

    fileListContainer.style.display = 'block';

    for (const file of webpFiles) {
      await convertAndDisplay(file);
    }
  }

  async function convertAndDisplay(file) {
    const format = formatSelect.value;
    const quality = parseFloat(qualityRange.value) / 100;
    const scale = parseFloat(scaleSelect.value);
    const bgFill = bgSelect.value;
    let subfolder = folderInput.value.trim();
    if (subfolder && !subfolder.endsWith('/')) {
      subfolder += '/';
    }

    const itemEl = document.createElement('div');
    itemEl.className = 'file-item loading';
    itemEl.innerHTML = `
      <div class="file-info">
        <span class="file-name">${escapeHtml(file.name)}</span>
        <span class="file-status">Converting...</span>
      </div>
      <div class="spinner"></div>
    `;
    fileList.prepend(itemEl);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const targetDataUrl = await convertWebpDataUrl(dataUrl, format, quality, scale, bgFill);

      let extension = `.${format}`;
      if (format === 'jpeg') extension = '.jpg';

      const baseName = file.name.replace(/\.(webp|png|jpe?g|bmp)$/i, '');
      const targetName = `${baseName}${extension}`;
      const downloadPath = `${subfolder}${targetName}`;

      convertedFilesHistory.push({
        filename: targetName,
        dataUrl: targetDataUrl
      });

      itemEl.classList.remove('loading');
      itemEl.classList.add('success');
      itemEl.innerHTML = `
        <div class="file-info">
          <span class="file-name">${escapeHtml(targetName)}</span>
          <span class="file-status success">✓ Downloaded (${format.toUpperCase()})</span>
        </div>
        <div class="item-actions">
          <button class="btn-icon btn-copy-item" title="Copy to Clipboard">Copy</button>
          <a class="btn-icon" href="${targetDataUrl}" download="${targetName}">Save</a>
        </div>
      `;

      const copyBtn = itemEl.querySelector('.btn-copy-item');
      copyBtn.addEventListener('click', async () => {
        try {
          const res = await fetch(targetDataUrl);
          const blob = await res.blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        } catch (err) {
          alert('Clipboard copy error: ' + err.message);
        }
      });

      // Trigger automatic download
      if (typeof chrome !== 'undefined' && chrome.downloads) {
        chrome.downloads.download({
          url: targetDataUrl,
          filename: downloadPath,
          saveAs: false
        });
      } else {
        const link = document.createElement('a');
        link.href = targetDataUrl;
        link.download = targetName;
        link.click();
      }
    } catch (err) {
      itemEl.classList.remove('loading');
      itemEl.classList.add('error');
      itemEl.innerHTML = `
        <div class="file-info">
          <span class="file-name">${escapeHtml(file.name)}</span>
          <span class="file-status error">Error: ${escapeHtml(err.message)}</span>
        </div>
      `;
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function convertWebpDataUrl(dataUrl, format, quality, scale, bgFill) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        const targetW = Math.max(1, Math.round(srcW * scale));
        const targetH = Math.max(1, Math.round(srcH * scale));

        canvas.width = targetW;
        canvas.height = targetH;

        ctx.clearRect(0, 0, targetW, targetH);

        if (format === 'jpeg' || (bgFill && bgFill !== 'transparent')) {
          ctx.fillStyle = (bgFill === 'transparent' || !bgFill) ? '#ffffff' : bgFill;
          ctx.fillRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        let mimeType = 'image/png';
        if (format === 'jpeg') mimeType = 'image/jpeg';
        else if (format === 'webp') mimeType = 'image/webp';
        else if (format === 'bmp') mimeType = 'image/bmp';

        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = () => reject(new Error('Failed to load image or format unsupported'));
      img.src = dataUrl;
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
});
