import React, { useState, useEffect, useRef, useReducer, useMemo, useCallback } from 'react';
import { ChevronDown, Circle, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import { CropShape, CropState, Handle, translateRect, resizeWithAspect, clampRectPosition } from './lib/cropCore';
import { makeView, pointerToImage } from './lib/view';
import { CropOverlay } from './components/CropOverlay';
import CanvasTopBar from './components/canvas/CanvasTopBar';
import ExtendImageControls from './components/format/ExtendImageControls';
import FormatCard from './components/ui/FormatCard';
import IconEllipse from './components/icons/IconEllipse';
import MattingPanel from './components/panels/MattingPanel';
import AdjustPanel from './components/panels/AdjustPanel';
import { ensureCanvas } from './lib/canvasUtils';
import { rotatedEllipseBBox } from './features/crop/geometry';
import { createEllipseCropMask } from './features/crop/mask';
import SettingsModal from './components/modals/SettingsModal';
import {
  appSettingsReducer,
  defaultAppSettings,
  loadAppSettings,
  saveAppSettings,
} from './features/matting/matting.reducer';
import { MattingProvider } from './features/matting/MattingContext';
import { AdjustmentSettings, INITIAL_ADJUSTMENTS } from './features/adjustments/types';
import {
  pushToHistory as pushHistoryEntry,
  setHistoryApplyHandler,
  clearAllHistory,
  HistorySnapshot,
  undo as undoHistory,
  redo as redoHistory,
  canUndo,
  canRedo,
} from './features/history/history';
import { scopeFromTab, type TabKey } from './features/ui/scope';

interface ImageState {
  file: File | null;
  imageData: ImageData | null;
  width: number;
  height: number;
}

type CropRatio = '1:1' | '3:4' | '4:5' | '16:9';
type FormatInputMode = 'ratio' | 'pixel' | 'mm';

type ActiveTab = TabKey;

type Drag = {
  active: boolean;
  handle: Handle;
  startPtImg: { x: number; y: number };
  startRect: CropState;
  modeAtStart: 'free' | 'fixed';
  aspectAtStart: number | null;
  rotation?: {
    startPointerAngle: number;
    startAngleDeg: number;
  };
};

const ACTIVE_TAB_STORAGE_KEY = 'imageeditor.ui.activeTab';

const resolveInitialActiveTab = (): ActiveTab => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'format';
  }

  try {
    const stored = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (stored === 'effects') {
      return 'adjust';
    }
    if (stored === 'matting') {
      return 'freistellen';
    }
    if (stored === 'format' || stored === 'freistellen' || stored === 'adjust') {
      return stored as ActiveTab;
    }
  } catch {
    // Ignore storage access issues (e.g., private mode)
  }

  return 'format';
};

const FORMAT_MODES: { key: FormatInputMode; label: string }[] = [
  { key: 'ratio', label: 'Verhältnis' },
  { key: 'pixel', label: 'Pixel' },
  { key: 'mm', label: 'MM' },
];
const FORMAT_PRESETS: { key: CropRatio; label: string }[] = [
  { key: '1:1', label: '1:1 (Quadrat)' },
  { key: '3:4', label: '3:4 (Standard CV)' },
  { key: '4:5', label: '4:5 (Social Media)' },
  { key: '16:9', label: '16:9 (Breitbild)' },
];
const App: React.FC = () => {
  const [appSettings, dispatchAppSettings] = useReducer(
    appSettingsReducer,
    defaultAppSettings,
    (defaults) => {
      const loaded = loadAppSettings();
      return loaded ?? defaults;
    }
  );

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(media.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    media.addListener(listener as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
    return () => media.removeListener(listener as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prefersDark =
      appSettings.theme === 'dark' || (appSettings.theme === 'system' && systemPrefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, [appSettings.theme, systemPrefersDark]);

  useEffect(() => {
    saveAppSettings(appSettings);
  }, [appSettings]);

  const isDarkTheme = useMemo(() => {
    return appSettings.theme === 'dark' || (appSettings.theme === 'system' && systemPrefersDark);
  }, [appSettings.theme, systemPrefersDark]);

  const toggleTheme = useCallback(() => {
    dispatchAppSettings({
      type: 'SET_APP_SETTINGS',
      patch: { theme: isDarkTheme ? 'light' : 'dark' },
    });
  }, [dispatchAppSettings, isDarkTheme]);

  const handleResetSettings = useCallback(() => {
    dispatchAppSettings({ type: 'RESET_APP_SETTINGS' });
  }, [dispatchAppSettings]);

  const handleImmediateCleanup = useCallback(() => {
    console.info('[privacy-wipe-requested]', { at: new Date().toISOString() });
  }, []);

  const registerBackgroundReplace = useCallback((runner: () => void) => {
    backgroundReplaceRunnerRef.current = runner;
  }, []);

  const handleBackgroundReplaceClick = useCallback(() => {
    backgroundReplaceRunnerRef.current?.();
  }, []);

  const stageBackgroundStyle = useMemo<React.CSSProperties>(() => {
    const size = Math.max(4, Math.min(32, appSettings.overlays.checkerSize));
    const accent = isDarkTheme ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)';
    const base = isDarkTheme ? '#0f172a' : '#f8fafc';
    return {
      backgroundColor: base,
      backgroundImage: `linear-gradient(45deg, ${accent} 25%, transparent 25%),\n        linear-gradient(-45deg, ${accent} 25%, transparent 25%),\n        linear-gradient(45deg, transparent 75%, ${accent} 75%),\n        linear-gradient(-45deg, transparent 75%, ${accent} 75%)`,
      backgroundSize: `${size * 2}px ${size * 2}px`,
      backgroundPosition: `0 0, 0 ${size}px, ${size}px -${size}px, -${size}px 0`,
    };
  }, [appSettings.overlays.checkerSize, isDarkTheme]);

  const [image, setImage] = useState<ImageState>({
    file: null,
    imageData: null,
    width: 0,
    height: 0
  });
  
  // Pixel-based state
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [cropPx, setCropPx] = useState<CropState>({ x: 0, y: 0, w: 0, h: 0, shape: 'rect', featherPx: 0, angleDeg: 0 });
  const [cropMode, setCropMode] = useState<'free' | 'fixed'>('fixed');
  const [aspect, setAspect] = useState<number | null>(3/4); // Default 3:4
  const [cropRatio, setCropRatio] = useState<CropRatio>('3:4');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Extended format input state
  const [formatInputMode, setFormatInputMode] = useState<FormatInputMode>('ratio');
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => resolveInitialActiveTab());
  const [customRatio, setCustomRatio] = useState('');
  const [pixelWidth, setPixelWidth] = useState('');
  const [pixelHeight, setPixelHeight] = useState('');
  const [mmWidth, setMmWidth] = useState('');
  const [mmHeight, setMmHeight] = useState('');
  const [dpi, setDpi] = useState(300);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [exportCounter, setExportCounter] = useState(1);
  
  // Crop state
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [isCropped, setIsCropped] = useState(false);
  
  // Image adjustment state
  const [adjustments, setAdjustments] = useState<AdjustmentSettings>({ ...INITIAL_ADJUSTMENTS });
  const [mattingSessionId, setMattingSessionId] = useState(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const originalImageDataRef = useRef<ImageData | null>(null);
  
  // Refs for live values (no stale state in move)
  const modeRef = useRef<'free' | 'fixed'>('fixed');
  const aspectRef = useRef<number | null>(3/4);
  const dragRef = useRef<Drag | null>(null);

  useEffect(() => {
    const handler = (snapshot: HistorySnapshot) => {
      setImage((prev) => ({
        file: prev.file,
        imageData: snapshot.imageData,
        width: snapshot.imageSize.w,
        height: snapshot.imageSize.h,
      }));
      setImageSize({ ...snapshot.imageSize });
      setCropPx({ ...snapshot.cropPx });
      setIsCropped(snapshot.isCropped);
    };

    setHistoryApplyHandler('format', handler);
    return () => {
      setHistoryApplyHandler('format', undefined);
    };
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundReplaceRunnerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      if (stored === 'effects') {
        window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, 'adjust');
      }
      if (stored === 'matting') {
        window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, 'freistellen');
      }
    } catch {
      // Ignore storage access issues (e.g., private mode)
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    } catch {
      // Ignore storage access issues (e.g., private mode)
    }
  }, [activeTab]);

  // Sync refs with state
  useEffect(() => {
    modeRef.current = cropMode;
    aspectRef.current = aspect;
  }, [cropMode, aspect]);

  // Update originalImageDataRef when image changes
  useEffect(() => {
    if (image.imageData) {
      // Create a deep copy of ImageData
      const tempCanvas = ensureCanvas(image.imageData.width, image.imageData.height);
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (tempCtx) {
        tempCtx.putImageData(image.imageData, 0, 0);
        originalImageDataRef.current = tempCtx.getImageData(0, 0, image.imageData.width, image.imageData.height);
      }
    } else {
      originalImageDataRef.current = null;
    }
    // Reset adjustments to default when a new image is loaded
    setAdjustments({ ...INITIAL_ADJUSTMENTS });
  }, [image.imageData]);

  // Apply adjustments to canvas
  const applyAdjustments = React.useCallback(async (canvas: HTMLCanvasElement, settings: AdjustmentSettings) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !originalImageDataRef.current) return;

    // Restore original image
    ctx.putImageData(originalImageDataRef.current, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Apply Brightness, Contrast, Saturation (pixel manipulation)
    const brightnessFactor = 1 + settings.brightness / 100;
    const contrastFactor = 1 + settings.contrast / 100;
    const saturationFactor = 1 + settings.saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r *= brightnessFactor;
      g *= brightnessFactor;
      b *= brightnessFactor;

      // Contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Saturation (using luminance)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    // Apply Highlights/Shadows/Whites/Blacks adjustment
    if (settings.highlights !== 0 || settings.shadows !== 0 || settings.whites !== 0 || settings.blacks !== 0) {
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const normalizedLum = luminance / 255;

        let adjustment = 0;
        
        if (normalizedLum > 0.5) {
          adjustment += settings.highlights * (normalizedLum - 0.5) * 2;
        }
        
        if (normalizedLum < 0.5) {
          adjustment += settings.shadows * (0.5 - normalizedLum) * 2;
        }
        
        if (normalizedLum > 0.8) {
          adjustment += settings.whites * (normalizedLum - 0.8) * 5;
        }
        
        if (normalizedLum < 0.2) {
          adjustment += settings.blacks * (0.2 - normalizedLum) * 5;
        }

        const factor = 1 + adjustment / 100;
        data[i] = Math.max(0, Math.min(255, r * factor));
        data[i + 1] = Math.max(0, Math.min(255, g * factor));
        data[i + 2] = Math.max(0, Math.min(255, b * factor));
      }
    }

    // Apply sharpness
    if (settings.sharpness !== 100 && Math.abs(settings.sharpness - 100) > 1) {
      const sharpnessFactor = (settings.sharpness - 100) / 100;
      const originalData = new Uint8ClampedArray(data);

      const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
      const kernelWeight = 1;

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * canvas.width + (x + kx)) * 4 + c;
                sum += originalData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const originalIdx = (y * canvas.width + x) * 4 + c;
            const sharpened = sum / kernelWeight;
            const blended = originalData[originalIdx] + (sharpened - originalData[originalIdx]) * sharpnessFactor;
            data[originalIdx] = Math.max(0, Math.min(255, blended));
          }
        }
      }
    }

    // Apply vignette effect
    if (settings.vignette > 0) {
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const vignetteStrength = settings.vignette / 100;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const vignetteFactor = 1 - (distance / maxDistance) * vignetteStrength;
          const factor = Math.max(0, Math.min(1, vignetteFactor));
          
          const index = (y * width + x) * 4;
          data[index] = Math.max(0, Math.min(255, data[index] * factor));
          data[index + 1] = Math.max(0, Math.min(255, data[index + 1] * factor));
          data[index + 2] = Math.max(0, Math.min(255, data[index + 2] * factor));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  // Auto optimize function
  const autoOptimize = () => {
    if (!canvasRef.current || !originalImageDataRef.current) return;

    const optimizedSettings: AdjustmentSettings = {
      brightness: 5,
      contrast: 15,
      saturation: 10,
      highlights: -10,
      shadows: 15,
      whites: 0,
      blacks: -5,
      sharpness: 110,
      vignette: 0
    };

    setAdjustments(optimizedSettings);
  };

  // Apply adjustments when they change
  useEffect(() => {
    if (!canvasRef.current || !originalImageDataRef.current) return;
    applyAdjustments(canvasRef.current, adjustments);
  }, [adjustments, applyAdjustments]);

  // Crop functions
  const applyCrop = () => {
    if (!image.imageData) return;

    // Store original if not already stored
    if (!originalImage) {
      setOriginalImage({ ...image });
    }

    const featherPx = cropPx.shape === 'rect' ? 0 : cropPx.featherPx ?? 0;
    let outW = cropPx.w;
    let outH = cropPx.h;
    let rx = 0;
    let ry = 0;
    let angleDeg = 0;
    let angleRad = 0;
    let pad = 0;

    if (cropPx.shape !== 'rect') {
      const size = Math.min(cropPx.w, cropPx.h);
      rx = cropPx.shape === 'round' ? Math.max(1, size / 2) : Math.max(1, cropPx.w / 2);
      ry = cropPx.shape === 'round' ? Math.max(1, size / 2) : Math.max(1, cropPx.h / 2);
      angleDeg = cropPx.shape === 'ellipse' ? cropPx.angleDeg ?? 0 : 0;
      angleRad = (angleDeg * Math.PI) / 180;

      const { w: bbW, h: bbH } = rotatedEllipseBBox(rx, ry, angleRad);
      pad = Math.ceil(featherPx + 2);
      outW = Math.ceil(bbW + 2 * pad);
      outH = Math.ceil(bbH + 2 * pad);
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;

    const ctx =
      (canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null) ??
      canvas.getContext('2d')!;
    ctx.clearRect(0, 0, outW, outH);

    const srcCanvas: HTMLCanvasElement = Object.assign(document.createElement('canvas'), {
      width: image.width,
      height: image.height,
    });
    const srcCtx =
      (srcCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null) ??
      srcCanvas.getContext('2d')!;
    srcCtx.putImageData(image.imageData, 0, 0);

    if (cropPx.shape !== 'rect') {
      const cxImg = cropPx.x + cropPx.w / 2;
      const cyImg = cropPx.y + cropPx.h / 2;

      let sx = Math.round(cxImg - outW / 2);
      let sy = Math.round(cyImg - outH / 2);
      let sw = outW;
      let sh = outH;
      let dx = 0;
      let dy = 0;

      if (sx < 0) {
        dx = -sx;
        sw += sx;
        sx = 0;
      }
      if (sy < 0) {
        dy = -sy;
        sh += sy;
        sy = 0;
      }

      const maxSw = image.width - sx;
      const maxSh = image.height - sy;
      sw = Math.max(0, Math.min(sw, maxSw));
      sh = Math.max(0, Math.min(sh, maxSh));

      if (sw > 0 && sh > 0) {
        ctx.drawImage(srcCanvas, sx, sy, sw, sh, dx, dy, sw, sh);
      }

      const mask = createEllipseCropMask(rx, ry, angleDeg, featherPx) as any;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      const mx = outW / 2 - mask.width / 2;
      const my = outH / 2 - mask.height / 2;
      ctx.drawImage(mask, mx, my);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    } else {
      ctx.drawImage(
        srcCanvas,
        cropPx.x,
        cropPx.y,
        cropPx.w,
        cropPx.h,
        0,
        0,
        outW,
        outH
      );
    }

    const croppedImageData = ctx.getImageData(0, 0, outW, outH);

    const beforeSnapshot: HistorySnapshot = {
      imageData: image.imageData,
      cropPx: { ...cropPx },
      imageSize: { ...imageSize },
      isCropped,
    };

    const afterCropPx: CropState = {
      x: 0,
      y: 0,
      w: outW,
      h: outH,
      shape: cropPx.shape,
      featherPx: cropPx.featherPx ?? 0,
      angleDeg: cropPx.angleDeg ?? 0,
    };

    const afterSnapshot: HistorySnapshot = {
      imageData: croppedImageData,
      cropPx: { ...afterCropPx },
      imageSize: { w: outW, h: outH },
      isCropped: true,
    };

    pushHistoryEntry({ before: beforeSnapshot, after: afterSnapshot }, 'format');

    setImage((prev) => ({
      file: prev.file,
      imageData: croppedImageData,
      width: outW,
      height: outH,
    }));
    setImageSize(afterSnapshot.imageSize);
    setCropPx({ ...afterCropPx });
    setIsCropped(true);
  };
  
  const resetCrop = () => {
    if (originalImage) {
      setImage({ ...originalImage });
      setImageSize({ w: originalImage.width, h: originalImage.height });

      // Reset crop to center
      const ar = aspect || 3/4;
      const targetW = Math.round(Math.min(originalImage.width, originalImage.height * ar) * 0.9);
      const targetH = Math.round(targetW / ar);
      setCropPx(prev => ({
        ...prev,
        x: Math.round((originalImage.width - targetW) / 2),
        y: Math.round((originalImage.height - targetH) / 2),
        w: targetW,
        h: targetH,
        angleDeg: 0,
      }));

      setIsCropped(false);
    }
  };

  const handleCropAction = () => {
    if (!image.file) {
      return;
    }
    if (isCropped) {
      resetCrop();
    } else {
      applyCrop();
    }
  };

  const clearImageState = React.useCallback(() => {
    setImage({ file: null, imageData: null, width: 0, height: 0 });
    setImageSize({ w: 0, h: 0 });
    setCropPx({ x: 0, y: 0, w: 0, h: 0, shape: 'rect', featherPx: 0, angleDeg: 0 });
    setCropMode('fixed');
    setAspect(3 / 4);
    setCropRatio('3:4');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFormatInputMode('ratio');
    setCustomRatio('');
    setPixelWidth('');
    setPixelHeight('');
    setMmWidth('');
    setMmHeight('');
    setDpi(300);
    setOriginalImage(null);
    setIsCropped(false);
    clearAllHistory();
    originalImageDataRef.current = null;
    dragRef.current = null;
    modeRef.current = 'fixed';
    aspectRef.current = 3 / 4;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }
    setAdjustments({ ...INITIAL_ADJUSTMENTS });
    setMattingSessionId((id) => id + 1);
    setExportCounter(1);
  }, []);

  const handleRemoveImage = React.useCallback(() => {
    if (!image.file) return;
    clearImageState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearImageState, image.file]);

  const handleReplaceImage = React.useCallback(() => {
    if (image.file) {
      clearImageState();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    fileInputRef.current?.click();
  }, [clearImageState, image.file]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const exportSettings = appSettings.export;
    let exportCanvas: HTMLCanvasElement = canvas;
    let cleanup: (() => void) | null = null;

    if (exportSettings.format === 'jpeg') {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let hasTransparency = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          hasTransparency = true;
          break;
        }
      }
      if (hasTransparency) {
        const tmp = document.createElement('canvas');
        tmp.width = canvas.width;
        tmp.height = canvas.height;
        const tmpCtx = tmp.getContext('2d');
        if (!tmpCtx) return;
        tmpCtx.fillStyle = exportSettings.backgroundForJpeg || '#ffffff';
        tmpCtx.fillRect(0, 0, tmp.width, tmp.height);
        tmpCtx.drawImage(canvas, 0, 0);
        exportCanvas = tmp;
        cleanup = () => {
          tmp.width = 0;
          tmp.height = 0;
        };
      }
    }

    const baseName = image.file ? image.file.name.replace(/\.[^.]+$/, '') : 'export';
    const ext = exportSettings.format === 'png' ? 'png' : 'jpg';
    const indexStr = String(exportCounter).padStart(2, '0');
    const pattern = exportSettings.filenamePattern?.trim() || '{basename}_{index}';
    let filename = pattern
      .replace(/\{basename\}/gi, baseName)
      .replace(/\{index\}/gi, indexStr)
      .replace(/\{ext\}/gi, ext);
    if (!filename) {
      filename = `${baseName}_${indexStr}`;
    }
    if (!filename.toLowerCase().endsWith(`.${ext}`)) {
      filename = `${filename}.${ext}`;
    }

    const mimeType = exportSettings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl =
      exportSettings.format === 'jpeg'
        ? exportCanvas.toDataURL(mimeType, exportSettings.jpegQuality)
        : exportCanvas.toDataURL(mimeType);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
    cleanup?.();
    setExportCounter((count) => count + 1);
  }, [appSettings.export, exportCounter, image.file]);

  // Load image
  const handleFileSelect = async (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const currentShape = cropPx.shape;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = (canvas.getContext('2d', { willReadFrequently: true }) as any) ||
                  canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      
      setImage({
        file,
        imageData,
        width: img.width,
        height: img.height
      });
      
      // Set image size and initial crop
      setImageSize({ w: img.width, h: img.height });
      
      // Reset crop state
      setIsCropped(false);
      setOriginalImage(null);
      clearAllHistory();
      
      // Initial crop: centered, 90% of constraining dimension
      const ar = aspect || 3/4;
      const targetW = Math.round(Math.min(img.width, img.height * ar) * 0.9);
      const targetH = Math.round(targetW / ar);
      setCropPx(prev => ({
        ...prev,
        shape: currentShape,
        x: Math.round((img.width - targetW) / 2),
        y: Math.round((img.height - targetH) / 2),
        w: targetW,
        h: targetH,
        angleDeg: 0,
      }));
      
      URL.revokeObjectURL(url);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    img.src = url;
  };

  // Ratio selection
  const selectRatio = (r: CropRatio) => {
    const [a, b] = r.split(':').map(Number);
    const ar = a / b;
    setCropMode('fixed');
    setAspect(ar);
    setCropRatio(r);
    
    // Set refs immediately
    modeRef.current = 'fixed';
    aspectRef.current = ar;
    
    // Update crop to new ratio if image loaded
    if (imageSize.w > 0 && imageSize.h > 0) {
      const targetW = Math.round(Math.min(imageSize.w, imageSize.h * ar) * 0.9);
      const targetH = Math.round(targetW / ar);
      setCropPx(prev => ({
        ...prev,
        x: Math.round((imageSize.w - targetW) / 2),
        y: Math.round((imageSize.h - targetH) / 2),
        w: targetW,
        h: targetH,
        shape: 'rect',
        angleDeg: 0,
      }));
    }
  };

  const toggleFree = () => {
    const next = cropMode === 'free' ? 'fixed' : 'free';
    setCropMode(next);
    modeRef.current = next;
    
    if (next === 'free') {
      setAspect(null);
      aspectRef.current = null;
    } else {
      // Restore last ratio
      const ar = 3/4; // Default to 3:4
      setAspect(ar);
      aspectRef.current = ar;
    }
  };

  // Extended format functions
  const applyCustomRatio = () => {
    if (formatInputMode === 'ratio' && customRatio) {
      const match = customRatio.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
      if (match) {
        const [, a, b] = match;
        const ar = parseFloat(a) / parseFloat(b);
        setCropMode('fixed');
        setAspect(ar);
        modeRef.current = 'fixed';
        aspectRef.current = ar;
        
        // Update crop
        if (imageSize.w > 0 && imageSize.h > 0) {
          const targetW = Math.round(Math.min(imageSize.w, imageSize.h * ar) * 0.9);
          const targetH = Math.round(targetW / ar);
          setCropPx(prev => ({
            ...prev,
            x: Math.round((imageSize.w - targetW) / 2),
            y: Math.round((imageSize.h - targetH) / 2),
            w: targetW,
            h: targetH,
            shape: 'rect',
            angleDeg: 0,
          }));
        }
      }
    } else if (formatInputMode === 'pixel' && pixelWidth && pixelHeight) {
      const w = parseInt(pixelWidth);
      const h = parseInt(pixelHeight);
      if (w > 0 && h > 0) {
        const ar = w / h;
        setCropMode('fixed');
        setAspect(ar);
        modeRef.current = 'fixed';
        aspectRef.current = ar;
        
        // Set exact pixel size if possible
        const maxW = Math.min(w, imageSize.w);
        const maxH = Math.min(h, imageSize.h);
        const finalW = Math.min(maxW, Math.round(maxH * ar));
        const finalH = Math.round(finalW / ar);
        
        setCropPx(prev => ({
          ...prev,
          x: Math.round((imageSize.w - finalW) / 2),
          y: Math.round((imageSize.h - finalH) / 2),
          w: finalW,
          h: finalH,
          shape: 'rect',
          angleDeg: 0,
        }));
      }
    } else if (formatInputMode === 'mm' && mmWidth && mmHeight) {
      const wMm = parseFloat(mmWidth);
      const hMm = parseFloat(mmHeight);
      if (wMm > 0 && hMm > 0) {
        // Convert mm to pixels at given DPI
        const wPx = Math.round((wMm / 25.4) * dpi);
        const hPx = Math.round((hMm / 25.4) * dpi);
        const ar = wPx / hPx;
        
        setCropMode('fixed');
        setAspect(ar);
        modeRef.current = 'fixed';
        aspectRef.current = ar;
        
        // Set size based on mm conversion
        const maxW = Math.min(wPx, imageSize.w);
        const maxH = Math.min(hPx, imageSize.h);
        const finalW = Math.min(maxW, Math.round(maxH * ar));
        const finalH = Math.round(finalW / ar);
        
        setCropPx(prev => ({
          ...prev,
          x: Math.round((imageSize.w - finalW) / 2),
          y: Math.round((imageSize.h - finalH) / 2),
          w: finalW,
          h: finalH,
          shape: 'rect',
          angleDeg: 0,
        }));
      }
    }
  };

  const applyFreeResize = (startRect: CropState, handle: Handle, dx: number, dy: number): CropState => {
    const next: CropState = { ...startRect };
    switch (handle) {
      case 'n':
        next.y = startRect.y + dy;
        next.h = startRect.h - dy;
        break;
      case 's':
        next.h = startRect.h + dy;
        break;
      case 'w':
        next.x = startRect.x + dx;
        next.w = startRect.w - dx;
        break;
      case 'e':
        next.w = startRect.w + dx;
        break;
      case 'nw':
        next.x = startRect.x + dx;
        next.w = startRect.w - dx;
        next.y = startRect.y + dy;
        next.h = startRect.h - dy;
        break;
      case 'ne':
        next.w = startRect.w + dx;
        next.y = startRect.y + dy;
        next.h = startRect.h - dy;
        break;
      case 'sw':
        next.x = startRect.x + dx;
        next.w = startRect.w - dx;
        next.h = startRect.h + dy;
        break;
      case 'se':
        next.w = startRect.w + dx;
        next.h = startRect.h + dy;
        break;
      default:
        break;
    }

    if (next.w < 1) {
      next.w = 1;
    }
    if (next.h < 1) {
      next.h = 1;
    }

    return clampRectPosition(next, imageSize.w, imageSize.h);
  };

  const enforceRoundShape = (rect: CropState): CropState => {
    if (imageSize.w <= 0 || imageSize.h <= 0) {
      return rect;
    }

    const desired = Math.max(rect.w, rect.h);
    const maxSize = Math.min(imageSize.w, imageSize.h);
    const size = Math.max(1, Math.min(Math.round(desired), maxSize));
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    let x = Math.round(centerX - size / 2);
    let y = Math.round(centerY - size / 2);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + size > imageSize.w) x = imageSize.w - size;
    if (y + size > imageSize.h) y = imageSize.h - size;

    return clampRectPosition({ ...rect, x, y, w: size, h: size, shape: 'round', angleDeg: 0 }, imageSize.w, imageSize.h);
  };

  const changeCropShape = (shape: CropShape) => {
    setCropPx(prev => {
      if (prev.shape === shape) {
        return prev;
      }

      if (shape === 'round') {
        return enforceRoundShape({ ...prev, shape: 'round', angleDeg: 0 });
      }

      const nextAngle = shape === 'ellipse' ? prev.angleDeg ?? 0 : 0;
      return { ...prev, shape, angleDeg: nextAngle };
    });
  };

  // Pointer events
  const onPointerDown = (e: React.PointerEvent, handle: Handle) => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const rect = stage.getBoundingClientRect();
    const v = makeView(zoom, pan.x, pan.y);
    const pt = pointerToImage(e.clientX - rect.left, e.clientY - rect.top, v);

    const startRect = { ...cropPx };
    let rotation: Drag['rotation'];
    if (handle === 'rotate') {
      const centerX = startRect.x + startRect.w / 2;
      const centerY = startRect.y + startRect.h / 2;
      const startPointerAngle = Math.atan2(pt.y - centerY, pt.x - centerX);
      rotation = {
        startPointerAngle,
        startAngleDeg: startRect.angleDeg ?? 0,
      };
    }

    dragRef.current = {
      active: true,
      handle,
      startPtImg: pt,
      startRect,
      modeAtStart: modeRef.current,
      aspectAtStart: aspectRef.current,
      rotation,
    };

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d?.active || !stageRef.current) return;
    
    const stage = stageRef.current;
    const rect = stage.getBoundingClientRect();
    const v = makeView(zoom, pan.x, pan.y);
    const now = pointerToImage(e.clientX - rect.left, e.clientY - rect.top, v);
    const dx = Math.round(now.x - d.startPtImg.x);
    const dy = Math.round(now.y - d.startPtImg.y);
    
    const shape = d.startRect.shape;
    if (d.handle === 'rotate') {
      const centerX = d.startRect.x + d.startRect.w / 2;
      const centerY = d.startRect.y + d.startRect.h / 2;
      const pointerAngle = Math.atan2(now.y - centerY, now.x - centerX);
      const rotation = d.rotation ?? {
        startPointerAngle: Math.atan2(d.startPtImg.y - centerY, d.startPtImg.x - centerX),
        startAngleDeg: d.startRect.angleDeg ?? 0,
      };
      let delta = pointerAngle - rotation.startPointerAngle;
      if (!Number.isFinite(delta)) {
        delta = 0;
      }
      // Normalize delta to [-PI, PI]
      delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
      let nextAngleDeg = rotation.startAngleDeg + (delta * 180) / Math.PI;
      // Snap near multiples of 15°
      const snapStep = 15;
      const snapped = Math.round(nextAngleDeg / snapStep) * snapStep;
      if (Math.abs(nextAngleDeg - snapped) < 3) {
        nextAngleDeg = snapped;
      }
      nextAngleDeg = ((nextAngleDeg % 360) + 360) % 360;
      setCropPx({ ...d.startRect, angleDeg: nextAngleDeg });
      return;
    }

    let next: CropState;
    if (d.handle === 'move') {
      next = translateRect(d.startRect, dx, dy, imageSize.w, imageSize.h);
    } else if (shape === 'round') {
      const resized = applyFreeResize(d.startRect, d.handle, dx, dy);
      next = enforceRoundShape(resized);
    } else if (shape === 'ellipse') {
      next = applyFreeResize(d.startRect, d.handle, dx, dy);
    } else if (d.modeAtStart === 'fixed' && d.aspectAtStart != null) {
      next = resizeWithAspect(d.startRect, d.handle, dx, dy, d.aspectAtStart, imageSize.w, imageSize.h);
    } else {
      next = applyFreeResize(d.startRect, d.handle, dx, dy);
    }

    setCropPx(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Draw image on canvas
  useEffect(() => {
    if (image.imageData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = (canvas.getContext('2d', { willReadFrequently: true }) as any) ||
                  canvas.getContext('2d')!;
      
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Show original image
      ctx.putImageData(image.imageData, 0, 0);
    }
  }, [image]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      const scope = scopeFromTab(activeTab);
      if (!e.shiftKey && key === 'z') {
        e.preventDefault();
        if (canUndo(scope)) {
          undoHistory(scope);
        }
        return;
      }

      if (e.shiftKey && key === 'z') {
        e.preventDefault();
        if (canRedo(scope)) {
          redoHistory(scope);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <MattingProvider key={mattingSessionId}>
      <div className="h-screen flex bg-gray-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 transition-colors dark:border-slate-700 dark:bg-dark-bg">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Portrait Matting</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Darstellung umschalten"
              title={isDarkTheme ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white dark:focus:ring-offset-slate-900"
            >
              {isDarkTheme ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span>{isDarkTheme ? 'Helles Design' : 'Dunkles Design'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              aria-label="Einstellungen"
              title="Einstellungen"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white dark:focus:ring-offset-slate-900"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Preview Area */}
        <div className="relative flex flex-1 items-center justify-center bg-gray-50 p-8 transition-colors dark:bg-dark-bg">
          {!image.file ? (
            <div className="text-center">
              <div 
                className="flex h-64 w-96 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-blue-400 dark:border-slate-600 dark:bg-slate-900/50 dark:hover:border-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-4 text-gray-500 dark:text-slate-400">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-slate-100">Bild auswählen</h3>
                <p className="text-gray-500 dark:text-slate-400">Klicken Sie hier oder ziehen Sie ein Bild hierhin</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative inline-block rounded-lg p-4 shadow-inner"
                style={{ ...stageBackgroundStyle, overflow: 'hidden' }}
              >
                <CanvasTopBar
                  activeTab={activeTab}
                  onCropClick={handleCropAction}
                  onBackgroundReplaceClick={handleBackgroundReplaceClick}
                />
                <div
                  ref={stageRef}
                  className="relative group"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: '0 0'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    id="editor-canvas"
                    className="max-w-full max-h-full shadow-lg"
                    style={{
                      maxWidth: '800px',
                      maxHeight: '600px',
                      objectFit: 'contain'
                    }}
                  />

                  <CropOverlay
                    cropPx={cropPx}
                    onPointerDown={onPointerDown}
                    isFreeCrop={cropMode === 'free'}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    overlayOpacity={appSettings.overlays.maskOverlayOpacity}
                    showGuides={appSettings.overlays.showGuides}
                    showGrid={appSettings.overlays.showGrid}
                    imageSize={imageSize}
                    isActive={activeTab === 'format'}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={!image.file}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Bild entfernen
                </button>
                <button
                  type="button"
                  onClick={handleReplaceImage}
                  disabled={!image.file}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Bild ersetzen
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with Action Buttons */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 transition-colors dark:border-slate-700 dark:bg-dark-bg">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleExport}
              disabled={!image.file}
              className="flex items-center space-x-2 rounded-lg border border-blue-500 bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
            >
              <span>⭳</span>
              <span>Exportieren</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white transition-colors dark:border-slate-700 dark:bg-dark-surface flex flex-col">
        <div className="border-b border-gray-200 p-6 dark:border-slate-700">

          {/* Tab Navigation */}
          <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-dark-bg">
            <button
              onClick={() => setActiveTab('format')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'format'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-dark-surface dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-800 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              Format
            </button>
            <button
              onClick={() => setActiveTab('freistellen')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'freistellen'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-dark-surface dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-800 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              Hintergrund
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'adjust'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-dark-surface dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-800 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              Anpassen
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {activeTab === 'format' && (
            <>
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <FormatCard
                    title="Freier Zuschnitt"
                    subtitle={cropMode === 'free' ? 'Aktiv – Ziehen & Größe ändern' : undefined}
                    active={cropMode === 'free'}
                    onClick={toggleFree}
                  />
                  {FORMAT_PRESETS.map((format) => (
                    <FormatCard
                      key={format.key}
                      title={format.label}
                      active={cropRatio === format.key && cropMode === 'fixed'}
                      onClick={() => selectRatio(format.key)}
                    />
                  ))}
                  <FormatCard
                    title="Kreis"
                    icon={<Circle className="h-5 w-5" />}
                    active={cropPx.shape === 'round'}
                    onClick={() => {
                      selectRatio('1:1');
                      changeCropShape('round');
                    }}
                  />
                  <FormatCard
                    title="Ellipse"
                    icon={<IconEllipse className="h-5 w-5" />}
                    active={cropPx.shape === 'ellipse'}
                    onClick={() => changeCropShape('ellipse')}
                  />
                  <FormatCard
                    title="Verhältnis setzen"
                    active={ratioOpen}
                    onClick={() => setRatioOpen((open) => !open)}
                    rightAdornment={
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${ratioOpen ? 'rotate-180' : ''}`}
                      />
                    }
                  >
                    <div className="space-y-4">
                      <div className="inline-flex w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800">
                        {FORMAT_MODES.map((mode, index) => (
                          <button
                            key={mode.key}
                            type="button"
                            onClick={() => setFormatInputMode(mode.key)}
                            className={`flex-1 px-3 py-2 text-sm transition-colors focus:outline-none ${
                              index < FORMAT_MODES.length - 1 ? 'border-r border-gray-200 dark:border-slate-700' : ''
                            } ${
                              formatInputMode === mode.key
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                                : 'text-gray-600 hover:text-gray-800 dark:text-slate-300 dark:hover:text-slate-100'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      {formatInputMode === 'ratio' && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                              Verhältnis (z.B. 7:9)
                            </label>
                            <input
                              type="text"
                              value={customRatio}
                              onChange={(e) => setCustomRatio(e.target.value)}
                              placeholder="7:9"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                            />
                          </div>
                          <button
                            onClick={applyCustomRatio}
                            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                          >
                            Anwenden
                          </button>
                        </div>
                      )}

                      {formatInputMode === 'pixel' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                                Breite (px)
                              </label>
                              <input
                                type="number"
                                value={pixelWidth}
                                onChange={(e) => setPixelWidth(e.target.value)}
                                placeholder="800"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                                Höhe (px)
                              </label>
                              <input
                                type="number"
                                value={pixelHeight}
                                onChange={(e) => setPixelHeight(e.target.value)}
                                placeholder="600"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                              />
                            </div>
                          </div>
                          <button
                            onClick={applyCustomRatio}
                            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                          >
                            Anwenden
                          </button>
                        </div>
                      )}

                      {formatInputMode === 'mm' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                                Breite (mm)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={mmWidth}
                                onChange={(e) => setMmWidth(e.target.value)}
                                placeholder="50"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                                Höhe (mm)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={mmHeight}
                                onChange={(e) => setMmHeight(e.target.value)}
                                placeholder="70"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                              DPI
                            </label>
                            <input
                              type="number"
                              value={dpi}
                              onChange={(e) => setDpi(parseInt(e.target.value) || 300)}
                              placeholder="300"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                            />
                          </div>
                          <button
                            onClick={applyCustomRatio}
                            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                          >
                            Anwenden
                          </button>
                        </div>
                      )}
                    </div>
                  </FormatCard>
                  <hr className="my-4 opacity-20" />
                  <FormatCard
                    title="Bild erweitern"
                    active={extendOpen}
                    onClick={() => setExtendOpen((open) => !open)}
                    rightAdornment={
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${extendOpen ? 'rotate-180' : ''}`}
                      />
                    }
                  >
                    <ExtendImageControls />
                  </FormatCard>
                </div>
              </div>

              {/* Current Crop Info */}
              {image.file && (
                <div className="rounded-lg bg-gray-50 p-4 transition-colors dark:bg-slate-800/60">
                  <h4 className="mb-3 font-medium text-gray-800 dark:text-slate-100">Aktueller Zuschnitt</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Format:</span>
                      <span className="font-medium">
                        {cropMode === 'free' ? 'Frei' : cropRatio}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Position:</span>
                      <span className="font-mono">{cropPx.x}px, {cropPx.y}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Größe:</span>
                      <span className="font-mono">{cropPx.w}px × {cropPx.h}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Pixel:</span>
                      <span className="font-mono">
                        {cropPx.w} × {cropPx.h}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Verhältnis:</span>
                      <span className="font-mono">
                        {(cropPx.w / cropPx.h).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              </>
            )}
          
          {activeTab === 'freistellen' && (
            <MattingPanel
              key={mattingSessionId}
              getCurrentImageCanvas={() => canvasRef.current}
              maskOverlayOpacity={appSettings?.overlays?.maskOverlayOpacity ?? 0.5}
              defaultInputSize={appSettings?.performance?.inputSizeDefault ?? 320}
              performanceSettings={appSettings.performance}
              onRegisterBackgroundReplace={registerBackgroundReplace}
            />
          )}

          {activeTab === 'adjust' && (
            <AdjustPanel
              adjustments={adjustments}
              setAdjustments={setAdjustments}
              autoOptimize={autoOptimize}
            />
          )}
        </div>
      </div>
      </div>
      <SettingsModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={appSettings}
        dispatch={dispatchAppSettings}
        onReset={handleResetSettings}
        onCleanup={handleImmediateCleanup}
      />
    </MattingProvider>
  );
};

export default App;
