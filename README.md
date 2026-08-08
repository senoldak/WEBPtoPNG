# WebP - PNG Converter 🚀 (Chrome Extension - Manifest V3)

[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/Version-2.0.0-6366F1?style=for-the-badge)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline_Ready-100%25-34D399?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25_Local-A855F7?style=for-the-badge)](https://github.com/)

**WebP - PNG Converter** is an open-source, high-performance, privacy-first Google Chrome Extension (Manifest V3) designed to effortlessly convert WebP images into **PNG**, **JPEG**, **WEBP**, or **BMP** formats. 

It provides seamless **online conversion** via Chrome's right-click context menu and **offline batch conversion** through a modern glassmorphic control panel popup with drag-and-drop support, single-click ZIP archive downloads, image scaling, compression controls, background color fills, and direct clipboard copying.

---

## 🌟 Key Features & Capabilities

### 1. 🌐 Online Context Menu Right-Click Actions
- Right-click any WebP image on any website to convert and download it instantly.
- Context menu options include:
  - **Save WebP as PNG** (Lossless transparent export)
  - **Save WebP as JPEG** (Compressed format)
  - **Copy WebP as PNG to Clipboard** (Instant clipboard copy for fast pasting into Photoshop, Figma, Slack, Discord, Notion, etc.)

### 2. ⚡ Offline Batch Drag & Drop Control Panel
- Drag and drop single or multiple `.webp` files directly into the extension popup.
- Batch process dozens of images simultaneously without uploading anything to remote servers.

### 3. 🎯 Multi-Format Exporting & Quality Controls
- **Supported Export Formats**: PNG, JPEG, WEBP, BMP.
- **JPEG/WEBP Quality Slider**: Adjust output image compression from **10%** (smallest file size) to **100%** (maximum fidelity).

### 4. 📐 Image Resizing & Scaling
- Scale images prior to export:
  - **50%** (Half size)
  - **75%**
  - **100%** (Original resolution)
  - **150%**
  - **200%** (Double resolution / 2x upscale)

### 5. 🎨 Custom Background Fill
- Choose transparent, white (`#ffffff`), or black (`#000000`) background fills when converting transparent WebP graphics into non-transparent formats like JPEG.

### 6. 📦 One-Click ZIP Archive Packaging
- Download all converted files inside a single compressed `.zip` archive using a built-in, lightweight, 100% offline JSZip module.

### 7. 📁 Custom Subfolder Management
- Specify a custom subfolder destination (e.g., `Converted_Images/`) inside your browser's default Downloads directory.

---

## 🏗️ Architecture & Component Design

```
+-----------------------------------------------------------------------+
|                         CHROME BROWSER ENVIRONMENT                    |
+-----------------------------------------------------------------------+
|                                                                       |
|   +-----------------------+           +---------------------------+   |
|   |  Web Page (Right Click) | --------> | background.js (Worker)    |   |
|   +-----------------------+           +---------------------------+   |
|                                                     |                 |
|                                                     v                 |
|   +-----------------------+           +---------------------------+   |
|   | Extension Popup UI    |           | offscreen.html / .js      |   |
|   | (popup.html/.js/.css) |           | (HTML5 Canvas Engine)     |   |
|   +-----------------------+           +---------------------------+   |
|               |                                     |                 |
|               +-----------------+-------------------+                 |
|                                 |                                     |
|                                 v                                     |
|              +-------------------------------------+                  |
|              | chrome.downloads API / Clipboard    |                  |
|              +-------------------------------------+                  |
|                                 |                                     |
|                                 v                                     |
|              +-------------------------------------+                  |
|              | Local File System (PNG / JPEG / ZIP)|                  |
|              +-------------------------------------+                  |
+-----------------------------------------------------------------------+
```

### Component Roles

- **`manifest.json`**: Extension manifest (Version 3) registering background service worker, permissions, popup UI, and icon assets.
- **`background.js`**: Background service worker managing context menu registration (`chrome.contextMenus`), event listeners, and offscreen document creation.
- **`offscreen.html` & `offscreen.js`**: Hidden DOM context facilitating HTML5 Canvas drawing, format encoding (`toDataURL`), scaling, and background clipboard writing (`navigator.clipboard.write`).
- **`popup.html`, `popup.css`, `popup.js`**: Glassmorphic user interface offering settings toggles (Format, Quality, Scale, Fill, Subfolder), file dropzone, list history, item actions, and ZIP archive generation.
- **`lib/jszip.min.js`**: Lightweight, zero-dependency local JSZip implementation handling offline ZIP bundling.
- **`tools/generate_minimal_icon.js`**: Standalone Node.js utility for generating vector icons (16x16, 48x48, 128x128).

---

## 📁 Repository Directory Structure

```
WEBPtoPNG/
├── .gitignore               # Git ignore rules for OS & IDE temporary files
├── README.md                # Full technical project documentation
├── manifest.json            # Chrome extension configuration (Manifest V3)
├── background.js            # Service worker & context menu event router
├── offscreen.html           # Background offscreen DOM wrapper
├── offscreen.js             # Canvas rendering engine & format encoder
├── popup.html               # Popup HTML layout
├── popup.css                # Glassmorphic dark-mode CSS design system
├── popup.js                 # Popup event handlers, settings & ZIP packager
├── lib/
│   └── jszip.min.js         # Offline standalone ZIP archiving module
├── tools/
│   └── generate_minimal_icon.js # Node.js icon generator script
└── icons/                   # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 📥 Installation Guide

### Option 1: Load Unpacked Extension (Developer Mode)

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/your-username/WEBPtoPNG.git
   ```
2. **Open Chrome Extensions Manager**:
   Open Google Chrome and type `chrome://extensions/` in the address bar (or go to `Menu` > `Extensions` > `Manage Extensions`).
3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the upper-right corner of the page.
4. **Load the Extension**:
   Click the **Load unpacked** button in the top-left corner and select the cloned `WEBPtoPNG` directory.
5. **Pin Extension**:
   Click the puzzle icon in Chrome's toolbar and pin **WebP - PNG Converter** for quick access.

---

## 🎮 How to Use

### A. Right-Clicking Online Web Images
1. Navigate to any webpage containing WebP images.
2. Right-click on the image.
3. Hover over **WebP - PNG Converter** in the context menu:
   - Click **Save WebP as PNG** to convert and download as PNG.
   - Click **Save WebP as JPEG** to convert and download as JPEG.
   - Click **Copy WebP as PNG to Clipboard** to copy the PNG image directly to your clipboard.

### B. Drag & Drop Conversion in Popup
1. Click the **WebP - PNG Converter** icon in your extension toolbar.
2. Configure your conversion preferences:
   - **Format**: Select `PNG`, `JPEG`, `WEBP`, or `BMP`.
   - **Quality**: Adjust slider (for JPEG/WEBP).
   - **Scale**: Choose `100%`, `75%`, `50%`, `150%`, or `200%`.
   - **Background**: Choose `Transparent`, `White Fill`, or `Black Fill`.
   - **Subfolder**: Enter an optional subfolder name (e.g. `Converted/`).
3. Drag & drop `.webp` files into the drop zone (or click to browse local files).
4. Files will be converted instantly:
   - Click **Save** on any list item to download individually.
   - Click **Copy** to copy the image to your clipboard.
   - Click **ZIP Archive** to download all converted images in a single `.zip` file.

---

## 🔒 Security & Privacy Guarantees

- 🛡️ **100% Local Execution**: All canvas operations, scaling, encoding, and ZIP bundling happen entirely inside your local browser instance.
- 📡 **Zero Server Dependencies**: No data, images, URLs, or metadata are ever transmitted to any external server, cloud service, or API.
- 🚫 **No Tracking / Analytics**: Zero telemetry, tracking scripts, or analytics counters.
- 🔐 **Manifest V3 CSP**: Adheres strictly to Chrome's Manifest V3 security model with zero inline dynamic scripts.

---

## 🛠️ Permissions Reference

| Permission | Purpose |
| :--- | :--- |
| `contextMenus` | Registers right-click menu items on image elements. |
| `downloads` | Downloads converted images and ZIP files to your device. |
| `offscreen` | Spawns background DOM contexts for offscreen canvas conversion. |
| `clipboardWrite` | Copies converted PNG image blobs directly to your operating system clipboard. |
| `storage` | Saves user format and UI preferences across browser sessions. |
| `<all_urls>` | Enables fetching remote WebP images for canvas rendering across origins. |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project repository.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git update-ref` / `git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
