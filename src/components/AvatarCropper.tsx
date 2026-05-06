import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { cn } from '../utils';

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        200,
        200
      );
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    image.src = imageSrc;
  });
}

function AvatarCropper({ imageSrc, onCrop, onCancel }: { imageSrc: string, onCrop: (result: string) => void, onCancel: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = (_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const result = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCrop(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl space-y-4"
      >
        <h3 className="font-bold text-[#1A1A1A] text-center">裁剪头像</h3>
        <div className="relative w-full h-64 bg-[#F5F5F0] rounded-2xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#5A5A40]/40 font-bold">缩放</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#5A5A40]"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0] transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl font-bold bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all"
          >
            确认裁剪
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export { AvatarCropper, getCroppedImg };
export default AvatarCropper;
