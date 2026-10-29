<div align="center">

  <div style="background: linear-gradient(to bottom right, #3b82f6, #1d4ed8); padding: 20px; border-radius: 20px; display: inline-block; margin-bottom: 10px;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke-dasharray="4 2"/>
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke-width="1.5"/>
      <path d="M12 8l4 4-4 4" stroke-width="2"/>
    </svg>
  </div>

  # ⚡ PixelSlice Pro
  ### **100% Free, Browser-Based Sprite Sheet Cutter, Polygon Lasso Cropper & Animation Previewer**

  <p>
    <a href="https://pixelslicepro.com/"><img src="https://img.shields.io/badge/Live-Website-3b82f6?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
    <a href="https://github.com/KernelVoltage/PixelSlice-Pro"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
    <img src="https://img.shields.io/badge/Privacy-100%25_Client_Side-blueviolet?style=for-the-badge&logo=shield&logoColor=white" alt="Privacy">
  </p>

  <p><em>Built with Vanilla JavaScript & HTML5 Canvas. Zero server uploads, zero logins, and zero ads.</em></p>

</div>

---

## 🚀 Overview

**PixelSlice Pro** is a high-performance, browser-based web utility built specifically for 2D game developers, digital artists, and asset creators. Whether you are slicing texture atlases for **Godot Engine, Unity, or custom engines**, PixelSlice Pro lets you extract individual frames, clean up transparency boundaries, and preview sprite animations instantly right inside your web browser with absolute privacy.

---

## ✨ Key Features

*   🤖 **Intelligent Auto-Slicer:** Automatically detects sprite boundaries using adjustable tuning parameters (*Min Sprite Size, Proximity Gap, and Padding Margin*).
*   ✂️ **Advanced Manual Cropping:** Take full control with 8-handle box cropping, Click-to-Point Polygon Lasso, and Freehand Pen masks.
*   🎬 **Live Animation Previewer:** Test your extracted sprite sequence in real-time with customizable **FPS control** and smooth looping playback.
*   📦 **Instant ZIP Packaging:** Export your entire frame sequence as a clean, sequentially ordered flat `.zip` archive using **JSZip** with EXIF metadata stripped.
*   🔒 **100% Client-Side Privacy:** Your images never leave your local machine. Processed entirely via HTML5 Canvas API in your browser storage.
*   🌙 **Dark / Light Theme:** Sleek, responsive modern UI built with Tailwind CSS supporting seamless theme toggling.

---

## 🛠️ Tech Stack

*   **Core Logic:** Vanilla JavaScript (ES6+), HTML5 Canvas API
*   **UI Framework:** Tailwind CSS (via CDN)
*   **File Compression & Export:** JSZip (`3.10.1`)
*   **Typography:** Inter (Google Fonts)

---

## 📂 Project Structure

```text
PixelSlice-Pro/
├── index.html       # Main application layout & markup
├── style.css        # Custom styles & checkerboard pattern backgrounds
├── script.js        # Core slicing algorithms, canvas rendering & JSZip logic
└── README.md        # Project documentation
