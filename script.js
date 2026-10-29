// Wait until the DOM content is fully loaded before executing any script logic
document.addEventListener('DOMContentLoaded', () => {

  // Retrieve references to the document root and theme toggle buttons for light/dark mode
  const htmlEl = document.documentElement;
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnThemeToggleMobile = document.getElementById('btn-theme-toggle-mobile');

  // Function to toggle between light and dark themes and store the preference in localStorage
  function toggleTheme() {
    if (htmlEl.classList.contains('dark')) {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
      localStorage.setItem('pixelslice_theme', 'light');
    } else {
      htmlEl.classList.remove('light');
      htmlEl.classList.add('dark');
      localStorage.setItem('pixelslice_theme', 'dark');
    }
  }

  // Check initial theme preference stored in localStorage
  if (localStorage.getItem('pixelslice_theme') === 'dark') {
    htmlEl.classList.add('dark');
    htmlEl.classList.remove('light');
  }

  // Bind theme toggle event listeners
  if (btnThemeToggle) btnThemeToggle.addEventListener('click', toggleTheme);
  if (btnThemeToggleMobile) btnThemeToggleMobile.addEventListener('click', toggleTheme);

  // References to core application layout sections and inputs
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const uploadState = document.getElementById('upload-state');
  const workspaceState = document.getElementById('workspace-state');
  const btnReset = document.getElementById('btn-reset');
  const projectPrefixInput = document.getElementById('project-prefix-input');
  const headerModeSwitchers = document.getElementById('header-mode-switchers');

  // Mode switching elements for Auto Slicer vs. Manual Studio
  const btnModeAuto = document.getElementById('btn-mode-auto');
  const btnModeManual = document.getElementById('btn-mode-manual');
  const manualToolbar = document.getElementById('manual-toolbar');
  const slicingParametersCard = document.getElementById('slicing-parameters-card');

  // Manual cropping sub-tool buttons and history controls
  const btnCropBox = document.getElementById('btn-crop-box');
  const btnCropPolygon = document.getElementById('btn-crop-polygon');
  const btnCropFreehand = document.getElementById('btn-crop-freehand');
  const btnCropUndo = document.getElementById('btn-crop-undo');
  const btnCropRedo = document.getElementById('btn-crop-redo');

  // Crop confirmation card overlay elements
  const cropConfirmCard = document.getElementById('crop-confirm-card');
  const cropDimensionsText = document.getElementById('crop-dimensions-text');
  const btnCancelCrop = document.getElementById('btn-cancel-crop');
  const btnConfirmCrop = document.getElementById('btn-confirm-crop');

  // Auto-slicing parameter sliders and value display badges
  const rangeMinSize = document.getElementById('range-min-size');
  const valMinSize = document.getElementById('val-min-size');
  const rangeGap = document.getElementById('range-gap');
  const valGap = document.getElementById('val-gap');
  const rangePadding = document.getElementById('range-padding');
  const valPadding = document.getElementById('val-padding');
  const btnExportZip = document.getElementById('btn-export-zip');

  // Canvas zoom controls and viewport wrappers
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomFit = document.getElementById('btn-zoom-fit');
  const zoomLevelText = document.getElementById('zoom-level-text');
  const canvasScaler = document.getElementById('canvas-scaler');
  const canvasWrapper = document.getElementById('canvas-wrapper');

  // Animation previewer elements
  const animPreviewCanvas = document.getElementById('anim-preview-canvas');
  const animCtx = animPreviewCanvas ? animPreviewCanvas.getContext('2d', { willReadFrequently: true }) : null;
  const animFpsInput = document.getElementById('anim-fps-input');
  const btnAnimPlay = document.getElementById('btn-anim-play');
  const animPlayIcon = document.getElementById('anim-play-icon');
  const animPauseIcon = document.getElementById('anim-pause-icon');
  const animPlayText = document.getElementById('anim-play-text');
  const animEmptyText = document.getElementById('anim-empty-text');

  // Main interactive slicer canvas and extracted gallery elements
  const canvas = document.getElementById('slicer-canvas');
  const ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;
  const spriteCountText = document.getElementById('sprite-count-text');
  const spritesGallery = document.getElementById('sprites-gallery');
  const galleryCountBadge = document.getElementById('gallery-count-badge');

  // State variables for tracking images, sprites, and active editing modes
  let currentImage = null;
  let detectedSprites = [];
  let manualSprites = [];
  let currentMainMode = 'auto'; // 'auto' or 'manual'
  let manualSubTool = 'box';    // 'box', 'polygon', 'freehand'
  let rafId = null;
  let currentZoom = 1.0;

  // Interaction and drawing state flags
  let isDrawing = false;
  let startX = 0, startY = 0;
  let currentBox = null;
  let activeHandle = null;

  // Manual tool path arrays and history stacks for undo/redo
  let polygonPoints = [];
  let freehandStrokes = [];
  let currentFreehand = [];
  let undoStack = [];
  let redoStack = [];

  // Animation previewer state variables
  let isPlayingAnim = false;
  let animInterval = null;
  let animFrameIndex = 0;

  // Function to update the dynamic background gradient fill for range sliders
  function updateSliderTrack(input) {
    if (!input) return;
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const val = parseFloat(input.value);
    const percent = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--track-bg', `linear-gradient(to right, #2563EB ${percent}%, #cbd5e1 ${percent}%)`);
  }

  // Bind input events to update range slider tracks and trigger auto-slicer updates
  [rangeMinSize, rangeGap, rangePadding].forEach(input => {
    if (!input) return;
    updateSliderTrack(input);
    input.addEventListener('input', () => {
      updateSliderTrack(input);
      if (valMinSize && input === rangeMinSize) valMinSize.textContent = rangeMinSize.value + ' px';
      if (valGap && input === rangeGap) valGap.textContent = rangeGap.value + ' px';
      if (valPadding && input === rangePadding) valPadding.textContent = rangePadding.value + ' px';
      if (currentMainMode === 'auto') triggerSlicerUpdate();
    });
  });

  // Function to switch between Auto Slicer and Manual Studio modes
  function setMainMode(mode) {
    currentMainMode = mode;
    if (btnModeAuto) btnModeAuto.className = 'px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5';
    if (btnModeManual) btnModeManual.className = 'px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5';

    if (mode === 'auto') {
      if (btnModeAuto) btnModeAuto.className = 'px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5';
      if (manualToolbar) manualToolbar.classList.add('hidden');
      if (slicingParametersCard) slicingParametersCard.classList.remove('hidden');
      if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
      currentBox = null;
      polygonPoints = [];
      freehandStrokes = [];
      stopAnimation();
      triggerSlicerUpdate();
    } else {
      if (btnModeManual) btnModeManual.className = 'px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5';
      if (manualToolbar) manualToolbar.classList.remove('hidden');
      if (slicingParametersCard) slicingParametersCard.classList.add('hidden');
      detectedSprites = [];
      manualSprites = [];
      currentBox = null;
      polygonPoints = [];
      freehandStrokes = [];
      if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
      setManualSubTool('box');
      stopAnimation();
      redrawCanvas();
      updateAllSpritesList();
    }
  }

  // Function to set the active manual cropping sub-tool (Box, Polygon, or Freehand)
  function setManualSubTool(tool) {
    manualSubTool = tool;
    [btnCropBox, btnCropPolygon, btnCropFreehand].forEach(btn => {
      if (btn) btn.className = 'px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all flex items-center space-x-1';
    });

    if (tool === 'box' && btnCropBox) btnCropBox.className = 'px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold shadow transition-all flex items-center space-x-1';
    if (tool === 'polygon' && btnCropPolygon) btnCropPolygon.className = 'px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold shadow transition-all flex items-center space-x-1';
    if (tool === 'freehand' && btnCropFreehand) btnCropFreehand.className = 'px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold shadow transition-all flex items-center space-x-1';

    currentBox = null;
    polygonPoints = [];
    freehandStrokes = [];
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();
    if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
    redrawCanvas();
  }

  // Bind main mode and sub-tool button click events
  if (btnModeAuto) btnModeAuto.addEventListener('click', () => setMainMode('auto'));
  if (btnModeManual) btnModeManual.addEventListener('click', () => setMainMode('manual'));

  if (btnCropBox) btnCropBox.addEventListener('click', () => setManualSubTool('box'));
  if (btnCropPolygon) btnCropPolygon.addEventListener('click', () => setManualSubTool('polygon'));
  if (btnCropFreehand) btnCropFreehand.addEventListener('click', () => setManualSubTool('freehand'));

  // Push current interactive state into the undo history stack
  function pushUndoState() {
    undoStack.push({
      currentBox: currentBox ? { ...currentBox } : null,
      polygonPoints: JSON.parse(JSON.stringify(polygonPoints)),
      freehandStrokes: JSON.parse(JSON.stringify(freehandStrokes))
    });
    redoStack = [];
    updateUndoRedoButtons();
  }

  // Update disabled state for Undo and Redo buttons
  function updateUndoRedoButtons() {
    if (btnCropUndo) btnCropUndo.disabled = undoStack.length === 0;
    if (btnCropRedo) btnCropRedo.disabled = redoStack.length === 0;
  }

  // Handle Undo action
  if (btnCropUndo) {
    btnCropUndo.addEventListener('click', () => {
      if (undoStack.length === 0) return;
      redoStack.push({
        currentBox: currentBox ? { ...currentBox } : null,
        polygonPoints: JSON.parse(JSON.stringify(polygonPoints)),
        freehandStrokes: JSON.parse(JSON.stringify(freehandStrokes))
      });
      const state = undoStack.pop();
      currentBox = state.currentBox;
      polygonPoints = state.polygonPoints;
      freehandStrokes = state.freehandStrokes;
      updateUndoRedoButtons();
      if (!currentBox && polygonPoints.length < 3 && freehandStrokes.length === 0 && cropConfirmCard) {
        cropConfirmCard.classList.add('hidden');
      }
      redrawCanvas();
    });
  }

  // Handle Redo action
  if (btnCropRedo) {
    btnCropRedo.addEventListener('click', () => {
      if (redoStack.length === 0) return;
      undoStack.push({
        currentBox: currentBox ? { ...currentBox } : null,
        polygonPoints: JSON.parse(JSON.stringify(polygonPoints)),
        freehandStrokes: JSON.parse(JSON.stringify(freehandStrokes))
      });
      const state = redoStack.pop();
      currentBox = state.currentBox;
      polygonPoints = state.polygonPoints;
      freehandStrokes = state.freehandStrokes;
      updateUndoRedoButtons();
      redrawCanvas();
    });
  }

  // Map client mouse or touch coordinates to exact canvas coordinate space
  function getCanvasCoordinates(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // Handle polygon point additions and auto-closing logic upon clicking near the start vertex
  function handleCanvasClick(e) {
    if (currentMainMode !== 'manual' || manualSubTool !== 'polygon' || !currentImage) return;
    const pos = getCanvasCoordinates(e);

    if (polygonPoints.length >= 3) {
      const first = polygonPoints[0];
      const dist = Math.hypot(pos.x - first.x, pos.y - first.y);
      if (dist <= 15) {
        finishPolygon();
        return;
      }
    }

    pushUndoState();
    polygonPoints.push({ x: pos.x, y: pos.y });
    redrawCanvas();
  }

  // Finalize polygon selection and calculate bounding box dimensions
  function finishPolygon() {
    if (polygonPoints.length < 3) return;
    let minX = Math.min(...polygonPoints.map(p => p.x));
    let maxX = Math.max(...polygonPoints.map(p => p.x));
    let minY = Math.min(...polygonPoints.map(p => p.y));
    let maxY = Math.max(...polygonPoints.map(p => p.y));
    let w = maxX - minX;
    let h = maxY - minY;

    if (w > 4 && h > 4) {
      currentBox = { x: minX, y: minY, w, h };
      if (cropDimensionsText) cropDimensionsText.textContent = `Polygon Selection: ${Math.round(w)}×${Math.round(h)} px`;
      if (cropConfirmCard) {
        cropConfirmCard.classList.remove('hidden');
        cropConfirmCard.classList.add('flex');
      }
    }
    redrawCanvas();
  }

  // Handle pointer down / touch start on canvas workspace
  function handleStart(e) {
    if (currentMainMode !== 'manual' || !currentImage) return;

    if (manualSubTool === 'polygon') {
      handleCanvasClick(e);
      return;
    }

    if (manualSubTool === 'freehand') {
      e.preventDefault();
      pushUndoState();
      isDrawing = true;
      const pos = getCanvasCoordinates(e);
      currentFreehand = [{ x: pos.x, y: pos.y }];
      freehandStrokes = [currentFreehand];
      return;
    }

    // Standard Box Crop Handle & Marquee Interaction
    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    const clickX = pos.x;
    const clickY = pos.y;

    if (currentBox) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const handleHitRadius = 32 * scaleX;
      const { x, y, w, h } = currentBox;
      
      const handles = {
        nw: { x, y },
        n:  { x: x + w / 2, y },
        ne: { x: x + w, y },
        w:  { x, y: y + h / 2 },
        e:  { x: x + w, y: y + h / 2 },
        sw: { x, y: y + h },
        s:  { x: x + w / 2, y: y + h },
        se: { x: x + w, y: y + h }
      };

      for (let [hKey, hPos] of Object.entries(handles)) {
        if (Math.abs(clickX - hPos.x) <= handleHitRadius && Math.abs(clickY - hPos.y) <= handleHitRadius) {
          activeHandle = hKey;
          isDrawing = true;
          pushUndoState();
          return;
        }
      }
    }

    pushUndoState();
    startX = clickX;
    startY = clickY;
    isDrawing = true;
    activeHandle = null;
    currentBox = { x: startX, y: startY, w: 0, h: 0 };
    if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
  }

  // Handle pointer move / drag across canvas workspace
  function handleMove(e) {
    if (currentMainMode !== 'manual' || !isDrawing || !currentImage) return;
    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    const currX = pos.x;
    const currY = pos.y;

    if (manualSubTool === 'freehand') {
      currentFreehand.push({ x: currX, y: currY });
      redrawCanvas();
      return;
    }

    if (manualSubTool === 'box') {
      if (activeHandle && currentBox) {
        let { x, y, w, h } = currentBox;
        let right = x + w;
        let bottom = y + h;

        if (activeHandle === 'nw') { x = Math.min(currX, right - 4); y = Math.min(currY, bottom - 4); }
        else if (activeHandle === 'n') { y = Math.min(currY, bottom - 4); }
        else if (activeHandle === 'ne') { right = Math.max(currX, x + 4); y = Math.min(currY, bottom - 4); }
        else if (activeHandle === 'w') { x = Math.min(currX, right - 4); }
        else if (activeHandle === 'e') { right = Math.max(currX, x + 4); }
        else if (activeHandle === 'sw') { x = Math.min(currX, right - 4); bottom = Math.max(currY, y + 4); }
        else if (activeHandle === 's') { bottom = Math.max(currY, y + 4); }
        else if (activeHandle === 'se') { right = Math.max(currX, x + 4); bottom = Math.max(currY, y + 4); }

        currentBox = {
          x: Math.max(0, x),
          y: Math.max(0, y),
          w: Math.min(right - x, canvas.width - x),
          h: Math.min(bottom - y, canvas.height - y)
        };
      } else {
        let x = Math.min(startX, currX);
        let y = Math.min(startY, currY);
        let w = Math.abs(currX - startX);
        let h = Math.abs(currY - startY);

        currentBox = {
          x: Math.max(0, Math.min(x, canvas.width)),
          y: Math.max(0, Math.min(y, canvas.height)),
          w: Math.min(w, canvas.width - x),
          h: Math.min(h, canvas.height - y)
        };
      }
      redrawCanvas();
    }
  }

  // Handle pointer up / touch end to finish drawing or freehand lasso strokes
  function handleEnd(e) {
    if (currentMainMode !== 'manual' || !isDrawing || !currentImage) return;
    isDrawing = false;
    activeHandle = null;

    if (manualSubTool === 'freehand') {
      if (currentFreehand.length > 5) {
        // Auto-close the freehand loop by connecting endpoint to start point
        currentFreehand.push({ ...currentFreehand[0] });

        let minX = Math.min(...currentFreehand.map(p => p.x));
        let maxX = Math.max(...currentFreehand.map(p => p.x));
        let minY = Math.min(...currentFreehand.map(p => p.y));
        let maxY = Math.max(...currentFreehand.map(p => p.y));
        let w = maxX - minX;
        let h = maxY - minY;

        if (w > 4 && h > 4) {
          currentBox = { x: minX, y: minY, w, h };
          if (cropDimensionsText) cropDimensionsText.textContent = `Freehand Selection: ${Math.round(w)}×${Math.round(h)} px`;
          if (cropConfirmCard) {
            cropConfirmCard.classList.remove('hidden');
            cropConfirmCard.classList.add('flex');
          }
        }
      }
      redrawCanvas();
      return;
    }

    if (manualSubTool === 'box') {
      if (currentBox && currentBox.w > 4 && currentBox.h > 4) {
        if (cropDimensionsText) cropDimensionsText.textContent = `Selection: ${Math.round(currentBox.w)}×${Math.round(currentBox.h)} px`;
        if (cropConfirmCard) {
          cropConfirmCard.classList.remove('hidden');
          cropConfirmCard.classList.add('flex');
        }
      } else {
        currentBox = null;
        if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
        redrawCanvas();
      }
    }
  }

  // Bind mouse and touch event listeners to the canvas
  if (canvas) {
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
  }
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);

  // Cancel crop selection
  if (btnCancelCrop) {
    btnCancelCrop.addEventListener('click', () => {
      currentBox = null;
      polygonPoints = [];
      freehandStrokes = [];
      if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
      redrawCanvas();
    });
  }

  // Confirm crop selection and add cropped sprite to extracted gallery
  if (btnConfirmCrop) {
    btnConfirmCrop.addEventListener('click', () => {
      if (!currentBox || currentBox.w < 2 || currentBox.h < 2) return;
      const { x, y, w, h } = currentBox;
      const sc = document.createElement('canvas');
      sc.width = w; sc.height = h;
      const sCtx = sc.getContext('2d', { willReadFrequently: true });
      sCtx.imageSmoothingEnabled = false;

      if (manualSubTool === 'polygon' && polygonPoints.length >= 3) {
        sCtx.save();
        sCtx.beginPath();
        polygonPoints.forEach((pt, idx) => {
          if (idx === 0) sCtx.moveTo(pt.x - x, pt.y - y);
          else sCtx.lineTo(pt.x - x, pt.y - y);
        });
        sCtx.closePath();
        sCtx.clip();
        sCtx.drawImage(currentImage, x, y, w, h, 0, 0, w, h);
        sCtx.restore();
      } else if (manualSubTool === 'freehand' && freehandStrokes.length > 0) {
        sCtx.save();
        sCtx.beginPath();
        const stroke = freehandStrokes[freehandStrokes.length - 1];
        stroke.forEach((pt, idx) => {
          if (idx === 0) sCtx.moveTo(pt.x - x, pt.y - y);
          else sCtx.lineTo(pt.x - x, pt.y - y);
        });
        sCtx.closePath();
        sCtx.clip();
        sCtx.drawImage(currentImage, x, y, w, h, 0, 0, w, h);
        sCtx.restore();
      } else {
        sCtx.drawImage(currentImage, x, y, w, h, 0, 0, w, h);
      }

      const currentPrefix = projectPrefixInput ? projectPrefixInput.value.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'sprite' : 'sprite';
      const newIdx = manualSprites.length + 1;
      const frameNum = String(newIdx).padStart(2, '0');

      manualSprites.push({
        id: newIdx,
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
        canvas: sc,
        customName: `${currentPrefix}_${frameNum}`,
        customEdited: false
      });

      currentBox = null;
      polygonPoints = [];
      freehandStrokes = [];
      if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
      updateAllSpritesList();
      redrawCanvas();
    });
  }

  // Redraw main canvas and active selection overlays
  function redrawCanvas() {
    if (!currentImage || !ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);

    if (currentMainMode === 'auto') {
      detectedSprites.forEach(s => {
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = Math.max(1, Math.floor(canvas.width / 600) + 1);
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
        ctx.fillRect(s.x, s.y, s.w, s.h);
      });
    } else {
      if (manualSubTool === 'polygon' && polygonPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = Math.max(2, Math.floor(canvas.width / 400));
        ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
        ctx.beginPath();
        polygonPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.fill();
        ctx.restore();

        polygonPoints.forEach((pt, idx) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, idx === 0 ? 7 : 5, 0, 2 * Math.PI);
          ctx.fillStyle = idx === 0 ? '#10B981' : '#2563EB';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();
        });
      }

      if (manualSubTool === 'freehand' && freehandStrokes.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = Math.max(2, Math.floor(canvas.width / 400));
        ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
        freehandStrokes.forEach(stroke => {
          if (stroke.length < 2) return;
          ctx.beginPath();
          stroke.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        });
        ctx.restore();
      }

      if (manualSubTool === 'box' && currentBox) {
        ctx.save();
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = Math.max(2, Math.floor(canvas.width / 400));
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
        ctx.fillRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
        ctx.restore();

        const { x, y, w, h } = currentBox;
        const handleCoords = [
          { x: x, y: y },
          { x: x + w / 2, y: y },
          { x: x + w, y: y },
          { x: x, y: y + h / 2 },
          { x: x + w, y: y + h / 2 },
          { x: x, y: y + h },
          { x: x + w / 2, y: y + h },
          { x: x + w, y: y + h }
        ];

        const scaleFactor = canvas.width / 800;
        const radius = Math.max(8, Math.min(14, 10 * scaleFactor));

        handleCoords.forEach(pt => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.lineWidth = Math.max(2.5, 3 * scaleFactor);
          ctx.strokeStyle = '#2563EB';
          ctx.stroke();
          ctx.restore();
        });
      }
    }
  }

  // Update sprite names dynamically when project prefix changes
  if (projectPrefixInput) {
    projectPrefixInput.addEventListener('input', () => {
      const prefix = projectPrefixInput.value.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'sprite';
      let idx = 1;
      const activeList = (currentMainMode === 'auto') ? detectedSprites : manualSprites;
      activeList.forEach(s => {
        const frameNum = String(idx++).padStart(2, '0');
        if (!s.customEdited) {
          s.customName = `${prefix}_${frameNum}`;
        }
      });
      renderGallery();
    });
  }

  // Zoom control event listeners
  if (btnZoomIn) btnZoomIn.addEventListener('click', () => setZoom(currentZoom + 0.15));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => setZoom(currentZoom - 0.15));
  if (btnZoomFit) btnZoomFit.addEventListener('click', () => autoFitZoom());

  function setZoom(level) {
    currentZoom = Math.min(Math.max(0.2, level), 2.5);
    if (zoomLevelText) zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
    if (canvasScaler) canvasScaler.style.transform = `scale(${currentZoom})`;
  }

  function autoFitZoom() {
    if (!currentImage || !canvasWrapper) return;
    const wrapperW = canvasWrapper.clientWidth - 36;
    const wrapperH = canvasWrapper.clientHeight - 36;
    const scaleX = wrapperW / currentImage.naturalWidth;
    const scaleY = wrapperH / currentImage.naturalHeight;
    const fitScale = Math.min(1.0, Math.min(scaleX, scaleY));
    setZoom(fitScale);
  }

  // File drop zone and file input handlers
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => e.target.files[0] && handleFile(e.target.files[0]));

    ['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dropzone-active'); }));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dropzone-active'); }));
    dropZone.addEventListener('drop', e => e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]));
  }

  // Handle uploaded sprite sheet file
  function handleFile(file) {
    if (!file.type.includes('png') && !file.type.includes('webp')) {
      return alert('Please upload a transparent PNG or WebP sprite sheet.');
    }

    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    const baseName = (lastDot > 0 ? originalName.substring(0, lastDot) : originalName).replace(/[^a-zA-Z0-9_-]/g, '_') || 'sprite';
    if (projectPrefixInput) projectPrefixInput.value = baseName;

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        manualSprites = [];
        detectedSprites = [];
        currentMainMode = 'auto';

        if (btnModeAuto) btnModeAuto.className = 'px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5';
        if (btnModeManual) btnModeManual.className = 'px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5';
        if (manualToolbar) manualToolbar.classList.add('hidden');
        if (slicingParametersCard) slicingParametersCard.classList.remove('hidden');
        if (cropConfirmCard) cropConfirmCard.classList.add('hidden');
        
        if (uploadState) uploadState.classList.add('hidden');
        if (workspaceState) workspaceState.classList.remove('hidden');
        if (headerModeSwitchers) {
          headerModeSwitchers.classList.remove('hidden');
          headerModeSwitchers.classList.add('flex');
        }

        setTimeout(() => {
          autoFitZoom();
          triggerSlicerUpdate();
        }, 50);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function triggerSlicerUpdate() {
    if (!currentImage || currentMainMode !== 'auto') return;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(runSlicer);
  }

  // Automated Connected Component Slicing Algorithm
  function runSlicer() {
    if (!currentImage || currentMainMode !== 'auto' || !canvas || !ctx) return;
    const w = currentImage.naturalWidth, h = currentImage.naturalHeight;
    canvas.width = w; canvas.height = h;
    
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(currentImage, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data32 = new Uint32Array(imgData.data.buffer);
    const visited = new Uint8Array(w * h);

    const minSize = rangeMinSize ? parseInt(rangeMinSize.value, 10) : 12;
    const gap = rangeGap ? parseInt(rangeGap.value, 10) : 4;
    const padding = rangePadding ? parseInt(rangePadding.value, 10) : 2;

    let rawBoxes = [];
    const queueX = new Int32Array(w * h);
    const queueY = new Int32Array(w * h);

    for (let y = 0; y < h; y++) {
      const rowOffset = y * w;
      for (let x = 0; x < w; x++) {
        const idx = rowOffset + x;
        if (visited[idx]) continue;

        const alpha = (data32[idx] >> 24) & 0xFF;
        if (alpha <= 5) continue;

        let minX = x, maxX = x, minY = y, maxY = y;
        let head = 0, tail = 0;
        queueX[tail] = x; queueY[tail] = y; tail++;
        visited[idx] = 1;

        while (head < tail) {
          const cx = queueX[head], cy = queueY[head]; head++;
          if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;

          const neighbors = [
            cx + 1, cy,
            cx - 1, cy,
            cx,     cy + 1,
            cx,     cy - 1,
            cx + 1, cy + 1,
            cx - 1, cy - 1,
            cx + 1, cy - 1,
            cx - 1, cy + 1
          ];

          for (let i = 0; i < 16; i += 2) {
            const nx = neighbors[i], ny = neighbors[i+1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (!visited[nIdx]) {
                const nAlpha = (data32[nIdx] >> 24) & 0xFF;
                if (nAlpha > 5) {
                  visited[nIdx] = 1;
                  queueX[tail] = nx; queueY[tail] = ny; tail++;
                }
              }
            }
          }
        }

        if ((maxX - minX + 1) >= minSize && (maxY - minY + 1) >= minSize) {
          rawBoxes.push({ minX, minY, maxX, maxY });
        }
      }
    }

    let merged = rawBoxes;
    let didMerge = true;
    while (didMerge) {
      didMerge = false;
      const nextMerged = [];
      const skip = new Uint8Array(merged.length);
      for (let i = 0; i < merged.length; i++) {
        if (skip[i]) continue;
        let cur = { ...merged[i] };
        for (let j = i + 1; j < merged.length; j++) {
          if (skip[j]) continue;
          let o = merged[j];
          if (cur.minX - gap <= o.maxX && cur.maxX + gap >= o.minX && cur.minY - gap <= o.maxY && cur.maxY + gap >= o.minY) {
            cur.minX = Math.min(cur.minX, o.minX);
            cur.minY = Math.min(cur.minY, o.minY);
            cur.maxX = Math.max(cur.maxX, o.maxX);
            cur.maxY = Math.max(cur.maxY, o.maxY);
            skip[j] = 1;
            didMerge = true;
          }
        }
        nextMerged.push(cur);
      }
      merged = nextMerged;
    }

    merged = merged.filter(b => (b.maxX - b.minX + 1) >= minSize && (b.maxY - b.minY + 1) >= minSize);

    if (merged.length > 0) {
      const totalHeight = merged.reduce((acc, b) => acc + (b.maxY - b.minY + 1), 0);
      const avgHeight = totalHeight / merged.length;
      const rowTolerance = Math.max(12, avgHeight * 0.5);

      merged.sort((a, b) => a.minY - b.minY);

      const rows = [];
      merged.forEach(box => {
        const boxMidY = (box.minY + box.maxY) / 2;
        let addedToRow = false;

        for (let row of rows) {
          if (Math.abs(boxMidY - row.avgMidY) < rowTolerance) {
            row.boxes.push(box);
            row.avgMidY = row.boxes.reduce((sum, b) => sum + (b.minY + b.maxY) / 2, 0) / row.boxes.length;
            addedToRow = true;
            break;
          }
        }

        if (!addedToRow) {
          rows.push({
            avgMidY: boxMidY,
            boxes: [box]
          });
        }
      });

      rows.sort((r1, r2) => r1.avgMidY - r2.avgMidY);

      merged = [];
      rows.forEach(row => {
        row.boxes.sort((a, b) => a.minX - b.minX);
        merged.push(...row.boxes);
      });
    }

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(currentImage, 0, 0);

    const currentPrefix = projectPrefixInput ? projectPrefixInput.value.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'sprite' : 'sprite';

    detectedSprites = merged.map((b, idx) => {
      const trimX = Math.max(0, b.minX - padding);
      const trimY = Math.max(0, b.minY - padding);
      const trimW = Math.min(w - trimX, (b.maxX - b.minX + 1) + padding * 2);
      const trimH = Math.min(h - trimY, (b.maxY - b.minY + 1) + padding * 2);

      const sc = document.createElement('canvas');
      sc.width = trimW; sc.height = trimH;
      const sCtx = sc.getContext('2d', { willReadFrequently: true });
      sCtx.imageSmoothingEnabled = false;
      sCtx.drawImage(currentImage, trimX, trimY, trimW, trimH, 0, 0, trimW, trimH);

      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = Math.max(1, Math.floor(w / 600) + 1);
      ctx.strokeRect(trimX + 0.5, trimY + 0.5, trimW - 1, trimH - 1);
      ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
      ctx.fillRect(trimX, trimY, trimW, trimH);

      const frameNum = String(idx + 1).padStart(2, '0');
      const existing = detectedSprites[idx];
      const customName = existing && existing.customEdited ? existing.customName : `${currentPrefix}_${frameNum}`;

      return {
        id: idx + 1,
        x: trimX,
        y: trimY,
        w: trimW,
        h: trimH,
        canvas: sc,
        customName: customName,
        customEdited: existing ? existing.customEdited : false
      };
    });

    updateAllSpritesList();
  }

  // Update gallery list and animation previewer when sprites change
  function updateAllSpritesList() {
    const activeList = (currentMainMode === 'auto') ? detectedSprites : manualSprites;
    if (spriteCountText) spriteCountText.textContent = `${activeList.length} Sprites`;
    renderGallery();
    updateAnimationPreview();
  }

  // Render extracted sprites gallery cards
  function renderGallery() {
    if (!spritesGallery) return;
    spritesGallery.innerHTML = '';
    const activeList = (currentMainMode === 'auto') ? detectedSprites : manualSprites;
    if (galleryCountBadge) galleryCountBadge.textContent = `${activeList.length} items`;

    if (activeList.length === 0) {
      spritesGallery.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">No sprites extracted yet.</div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    activeList.forEach((s) => {
      const card = document.createElement('div');
      card.className = `relative group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-between shadow-sm transition-all hover:border-brand-500`;

      const thumb = document.createElement('div');
      thumb.className = 'w-full h-20 bg-checkerboard-light dark:bg-checkerboard-dark rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-center p-1.5 mb-2.5 overflow-hidden shadow-inner relative';
      
      s.canvas.toBlob(blob => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = previewUrl;
        img.className = 'max-w-full max-h-full object-contain rendering-pixelated';
        thumb.appendChild(img);
      }, 'image/png');

      if (currentMainMode !== 'auto') {
        const delBtn = document.createElement('button');
        delBtn.className = 'absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow transition-all';
        delBtn.title = 'Remove Crop';
        delBtn.innerHTML = '&times;';
        delBtn.onclick = () => {
          manualSprites = manualSprites.filter(item => item !== s);
          updateAllSpritesList();
        };
        thumb.appendChild(delBtn);
      }

      const infoContainer = document.createElement('div');
      infoContainer.className = 'w-full flex flex-col items-center space-y-2';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = s.customName;
      nameInput.className = 'text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 w-full text-center focus:outline-none focus:border-brand-500 transition-all';
      nameInput.oninput = (e) => {
        s.customName = e.target.value.trim() || 'sprite';
        s.customEdited = true;
      };

      const dlBtn = document.createElement('button');
      dlBtn.className = 'w-full py-1.5 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center space-x-1';
      dlBtn.innerHTML = `
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Download PNG</span>
      `;
      dlBtn.onclick = () => {
        s.canvas.toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${s.customName}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      };

      infoContainer.append(nameInput, dlBtn);
      card.append(thumb, infoContainer);
      frag.appendChild(card);
    });
    spritesGallery.appendChild(frag);
  }

  // Update animation previewer frame state
  function updateAnimationPreview() {
    const activeList = (currentMainMode === 'auto') ? detectedSprites : manualSprites;
    if (activeList.length === 0) {
      if (animEmptyText) animEmptyText.style.display = 'block';
      if (animCtx && animPreviewCanvas) animCtx.clearRect(0, 0, animPreviewCanvas.width, animPreviewCanvas.height);
      if (isPlayingAnim) stopAnimation();
      return;
    }
    if (animEmptyText) animEmptyText.style.display = 'none';
    if (animFrameIndex >= activeList.length) animFrameIndex = 0;
    renderAnimFrame(activeList[animFrameIndex]);
  }

  // Render individual frame onto preview canvas
  function renderAnimFrame(sprite) {
    if (!sprite || !animPreviewCanvas || !animCtx) return;
    animPreviewCanvas.width = sprite.canvas.width;
    animPreviewCanvas.height = sprite.canvas.height;
    animCtx.clearRect(0, 0, animPreviewCanvas.width, animPreviewCanvas.height);
    animCtx.drawImage(sprite.canvas, 0, 0);
  }

  // Start mini animation loop
  function startAnimation() {
    const activeList = (currentMainMode === 'auto') ? detectedSprites : manualSprites;
    if (activeList.length === 0) return;
    isPlayingAnim = true;
    if (animPlayText) animPlayText.textContent = 'Pause Animation';
    if (animPlayIcon) animPlayIcon.classList.add('hidden');
    if (animPauseIcon) animPauseIcon.classList.remove('hidden');
    if (btnAnimPlay) btnAnimPlay.classList.add('bg-brand-50', 'dark:bg-slate-800', 'text-brand-600');

    const fps = Math.max(1, animFpsInput ? parseInt(animFpsInput.value, 10) || 12 : 12);
    const intervalMs = 1000 / fps;

    if (animInterval) clearInterval(animInterval);
    animInterval = setInterval(() => {
      animFrameIndex = (animFrameIndex + 1) % activeList.length;
      renderAnimFrame(activeList[animFrameIndex]);
    }, intervalMs);
  }

  // Stop mini animation loop
  function stopAnimation() {
    isPlayingAnim = false;
    if (animPlayText) animPlayText.textContent = 'Play Animation';
    if (animPauseIcon) animPauseIcon.classList.add('hidden');
    if (animPlayIcon) animPlayIcon.classList.remove('hidden');
    if (btnAnimPlay) btnAnimPlay.classList.remove('bg-brand-50', 'dark:bg-slate-800', 'text-brand-600');
    if (animInterval) {
      clearInterval(animInterval);
      animInterval = null;
    }
  }

  // Bind animation play/pause button click
  if (btnAnimPlay) {
    btnAnimPlay.addEventListener('click', () => {
      const activeList = (currentMainMode === 'auto') ? detectedSprites : manualSprites;
      if (activeList.length === 0) return alert('No frames available for animation preview.');
      if (isPlayingAnim) {
        stopAnimation();
      } else {
        startAnimation();
      }
    });
  }

  // Handle FPS input change
  if (animFpsInput) {
    animFpsInput.addEventListener('change', () => {
      if (isPlayingAnim) {
        stopAnimation();
        startAnimation();
      }
    });
  }

  // Flat ZIP package export with EXIF stripping
  if (btnExportZip) {
    btnExportZip.onclick = async () => {
      const activeList = (currentMainMode === 'auto') ? detectedSprites : manualSprites;
      if (!activeList.length) return alert('No sprites available to export.');
      btnExportZip.disabled = true;
      btnExportZip.textContent = 'Packaging ZIP...';

      try {
        if (typeof JSZip === 'undefined') {
          alert('JSZip library failed to load. Please check your network connection.');
          return;
        }

        const zip = new JSZip();

        await Promise.all(activeList.map(s => {
          return new Promise(resolve => {
            s.canvas.toBlob(blob => {
              if (blob) {
                const fileName = `${s.customName}.png`;
                zip.file(fileName, blob);
              }
              resolve();
            }, 'image/png');
          });
        }));

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelslice_pro.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error(err);
        alert('Error generating ZIP package. Please try again.');
      } finally {
        btnExportZip.disabled = false;
        btnExportZip.innerHTML = `
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export Package (.zip)</span>
        `;
      }
    };
  }

  // Reset workspace and return to upload drop zone
  if (btnReset) {
    btnReset.onclick = () => {
      if (fileInput) fileInput.value = '';
      currentImage = null;
      detectedSprites = [];
      manualSprites = [];
      polygonPoints = [];
      freehandStrokes = [];
      stopAnimation();
      if (workspaceState) workspaceState.classList.add('hidden');
      if (uploadState) uploadState.classList.remove('hidden');
      if (headerModeSwitchers) {
        headerModeSwitchers.classList.remove('flex');
        headerModeSwitchers.classList.add('hidden');
      }
    };
  }

});
