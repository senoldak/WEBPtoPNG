const MENU_DIRECT_PNG = 'DIRECT_SAVE_AS_PNG';
const PARENT_MENU_ID = 'WEBP_CONVERTER_PARENT';
const MENU_SAVE_PNG = 'SAVE_AS_PNG';
const MENU_SAVE_JPG = 'SAVE_AS_JPG';
const MENU_COPY_CLIPBOARD = 'COPY_TO_CLIPBOARD';

async function updateContextMenus() {
  chrome.contextMenus.removeAll(async () => {
    const data = await chrome.storage.sync.get({ showAdvancedMenu: false });

    if (data.showAdvancedMenu) {
      chrome.contextMenus.create({
        id: PARENT_MENU_ID,
        title: 'WebP - PNG Converter',
        contexts: ['image']
      });

      chrome.contextMenus.create({
        id: MENU_SAVE_PNG,
        parentId: PARENT_MENU_ID,
        title: 'Save WebP as PNG',
        contexts: ['image']
      });

      chrome.contextMenus.create({
        id: MENU_SAVE_JPG,
        parentId: PARENT_MENU_ID,
        title: 'Save WebP as JPEG',
        contexts: ['image']
      });

      chrome.contextMenus.create({
        id: MENU_COPY_CLIPBOARD,
        parentId: PARENT_MENU_ID,
        title: 'Copy WebP as PNG to Clipboard',
        contexts: ['image']
      });
    } else {
      // Direct 1-click single menu item by default
      chrome.contextMenus.create({
        id: MENU_DIRECT_PNG,
        title: 'Save WebP as PNG',
        contexts: ['image']
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateContextMenus();
});

chrome.runtime.onStartup?.addListener(() => {
  updateContextMenus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.showAdvancedMenu) {
    updateContextMenus();
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.srcUrl) return;

  let format = 'png';
  let copyToClipboard = false;

  if (info.menuItemId === MENU_DIRECT_PNG || info.menuItemId === MENU_SAVE_PNG) {
    format = 'png';
  } else if (info.menuItemId === MENU_SAVE_JPG) {
    format = 'jpeg';
  } else if (info.menuItemId === MENU_COPY_CLIPBOARD) {
    format = 'png';
    copyToClipboard = true;
  } else {
    return;
  }

  try {
    await setupOffscreenDocument('offscreen.html');

    let defaultName = 'converted_image';
    try {
      const urlObj = new URL(info.srcUrl);
      const pathname = urlObj.pathname;
      const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (lastSegment) {
        const cleanName = lastSegment.split('?')[0];
        if (cleanName) {
          defaultName = cleanName.replace(/\.(webp|png|jpe?g|bmp)$/i, '');
        }
      }
    } catch (e) {
      // Fallback
    }

    const response = await chrome.runtime.sendMessage({
      action: 'convertUrl',
      url: info.srcUrl,
      filename: defaultName,
      format,
      copyToClipboard
    });

    if (response && response.success) {
      if (copyToClipboard) {
        console.log('Image copied to clipboard successfully.');
      } else if (response.dataUrl) {
        await chrome.downloads.download({
          url: response.dataUrl,
          filename: response.filename,
          saveAs: false
        });
      }
    } else {
      console.error('Conversion failed:', response?.error);
    }
  } catch (err) {
    console.error('Error in context menu conversion:', err);
  }
});

async function setupOffscreenDocument(path) {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(path)]
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['BLOBS', 'CLIPBOARD'],
    justification: 'Convert WebP image to target format and optionally copy to clipboard'
  });
}
