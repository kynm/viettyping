"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoTrashOutline, IoCheckmarkCircle, IoAlertCircle, IoSparkles } from "react-icons/io5";
import { GameAdapterProps, ColoringCanvasItem } from "@/types/lesson";

const SHAPES: Record<string, { path: string; stroke: string; width: number; height: number; viewBox: string }> = {
  heart: {
    path: "M250,90 C200,30 110,30 110,110 C110,190 200,250 250,330 C300,250 390,190 390,110 C390,30 300,30 250,90 Z",
    stroke: "#000000",
    width: 500,
    height: 400,
    viewBox: "0 0 500 400"
  },
  star: {
    path: "M250,50 L310,170 L440,190 L340,280 L370,410 L250,340 L130,410 L160,280 L60,190 L190,170 Z",
    stroke: "#000000",
    width: 500,
    height: 450,
    viewBox: "0 0 500 450"
  },
  tree: {
    path: "M250,40 L130,190 L180,190 L100,310 L220,310 L220,390 L280,390 L280,310 L400,310 L320,190 L370,190 Z",
    stroke: "#000000",
    width: 500,
    height: 450,
    viewBox: "0 0 500 450"
  },
  house: {
    path: "M250,60 L420,210 L370,210 L370,390 L130,390 L130,210 L80,210 Z M210,390 L210,290 L290,290 L290,390 Z M170,270 L170,220 L220,220 L220,270 Z M280,270 L280,220 L330,220 L330,270 Z",
    stroke: "#000000",
    width: 500,
    height: 450,
    viewBox: "0 0 500 450"
  },
  bear: {
    path: "M150,220 A100,100 0 1,0 350,220 A100,100 0 1,0 150,220 Z M125,130 A35,35 0 1,0 195,130 A35,35 0 1,0 125,130 Z M305,130 A35,35 0 1,0 375,130 A35,35 0 1,0 305,130 Z M235,240 A15,15 0 1,0 265,240 A15,15 0 1,0 235,240 Z M205,190 A8,8 0 1,0 221,190 A8,8 0 1,0 205,190 Z M285,190 A8,8 0 1,0 301,190 A8,8 0 1,0 285,190 Z M235,260 Q250,275 265,260",
    stroke: "#000000",
    width: 500,
    height: 450,
    viewBox: "0 0 500 450"
  }
};

const COLORS = [
  { hex: "#ef4444", name: "Đỏ" },
  { hex: "#f97316", name: "Cam" },
  { hex: "#eab308", name: "Vàng" },
  { hex: "#22c55e", name: "Lá" },
  { hex: "#3b82f6", name: "Dương" },
  { hex: "#a855f7", name: "Tím" },
  { hex: "#ec4899", name: "Hồng" },
  { hex: "#14b8a6", name: "Ngọc" },
];

export default function ColoringCanvas({ gameConfig, onComplete }: GameAdapterProps<ColoringCanvasItem>) {
  const { id: gameId, items } = gameConfig;
  const currentItem = items[0] || { outlineSvgName: "heart", title: "Tô màu hình Trái tim", targetCoveragePercent: 70 };
  const shapeKey = currentItem.outlineSvgName in SHAPES ? currentItem.outlineSvgName : "heart";
  const shape = SHAPES[shapeKey];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[6].hex); // Mặc định hồng
  const [brushSize, setBrushSize] = useState(20);
  const [isClient, setIsClient] = useState(false);
  
  // Realtime stats
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [bleedPercent, setBleedPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Telemetry references
  const startTimeRef = useRef<number>(Date.now());
  const drawingStrokesRef = useRef<number>(0);

  useEffect(() => {
    setIsClient(true);
    startTimeRef.current = Date.now();
    drawingStrokesRef.current = 0;
    
    // Draw outline once canvas is mounted
    setTimeout(drawOutline, 100);
  }, [gameId, shapeKey]);

  // Transform parameters to scale and center shape inside canvas
  const getTransformParams = (canvasWidth: number, canvasHeight: number) => {
    const scaleX = canvasWidth / shape.width;
    const scaleY = canvasHeight / shape.height;
    const scale = Math.min(scaleX, scaleY) * 0.85; // Scale down slightly for margin (85%)
    const translateX = (canvasWidth - shape.width * scale) / 2;
    const translateY = (canvasHeight - shape.height * scale) / 2;
    return { scale, translateX, translateY };
  };

  const drawOutline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the shape outline path with scale and translate
    ctx.save();
    const { scale, translateX, translateY } = getTransformParams(canvas.width, canvas.height);
    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);

    ctx.strokeStyle = "#475569"; // Slate gray border
    ctx.lineWidth = 6 / scale; // Keep border thick regardless of scale
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    const p = new Path2D(shape.path);
    ctx.stroke(p);
    ctx.restore();

    setCoveragePercent(0);
    setBleedPercent(0);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    drawingStrokesRef.current += 1;
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
      }
    }
    calculateCoverageAndBleed();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    // Get correct mouse/touch coordinates relative to canvas width/height attributes
    // rect.width and rect.height could be smaller/larger due to responsive styling
    if ("touches" in e) {
      x = ((e.touches[0].clientX - rect.left) / rect.width) * canvas.width;
      y = ((e.touches[0].clientY - rect.top) / rect.height) * canvas.height;
    } else {
      x = (((e as React.MouseEvent).clientX - rect.left) / rect.width) * canvas.width;
      y = (((e as React.MouseEvent).clientY - rect.top) / rect.height) * canvas.height;
    }

    ctx.save();
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = selectedColor;
    ctx.globalCompositeOperation = "destination-over"; // Draw behind outline black lines

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.restore();

    // Redraw outline on top so it doesn't get covered by paint
    ctx.save();
    const { scale, translateX, translateY } = getTransformParams(canvas.width, canvas.height);
    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 6 / scale;
    const p = new Path2D(shape.path);
    ctx.globalCompositeOperation = "source-over"; // Draw outline on top
    ctx.stroke(p);
    ctx.restore();
  };

  const calculateCoverageAndBleed = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Path definition
    const path = new Path2D(shape.path);
    const { scale, translateX, translateY } = getTransformParams(canvas.width, canvas.height);

    // Sample points in a grid
    const step = 8;
    let insideTotal = 0;
    let insidePainted = 0;
    let outsidePainted = 0;

    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) {
        // Dịch ngược tọa độ canvas về hệ tọa độ gốc của path để kiểm tra isPointInPath
        const xOrig = (x - translateX) / scale;
        const yOrig = (y - translateY) / scale;
        
        const isInside = ctx.isPointInPath(path, xOrig, yOrig);
        
        const imgData = ctx.getImageData(x, y, 1, 1).data;
        const isPainted = imgData[3] > 30; // Check alpha channel

        if (isInside) {
          insideTotal++;
          if (isPainted) {
            // Exclude the outline color itself (#475569)
            const r = imgData[0];
            const g = imgData[1];
            const b = imgData[2];
            const isOutlineColor = r === 0x47 && g === 0x55 && b === 0x69;
            if (!isOutlineColor) {
              insidePainted++;
            }
          }
        } else {
          if (isPainted) {
            // Count as bleed if it is painted and not the outline color
            const r = imgData[0];
            const g = imgData[1];
            const b = imgData[2];
            const isOutlineColor = r === 0x47 && g === 0x55 && b === 0x69;
            if (!isOutlineColor) {
              outsidePainted++;
            }
          }
        }
      }
    }

    const coverage = Math.round((insidePainted / Math.max(insideTotal, 1)) * 100);
    const bleed = Math.round((outsidePainted / Math.max(insideTotal, 1)) * 100);

    setCoveragePercent(coverage);
    setBleedPercent(Math.min(100, bleed));
  };

  const handleClear = () => {
    drawOutline();
    setErrorMessage(null);
  };

  const handleFinish = () => {
    if (coveragePercent < 35) {
      setErrorMessage("Bé ơi, hãy tô màu thêm một chút nữa trước khi hoàn thành nhé!");
      return;
    }

    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const score = Math.max(10, Math.min(100, coveragePercent - Math.round(bleedPercent * 0.5)));

    onComplete({
      score,
      durationSeconds,
      metadata: {
        colorCoveragePercent: coveragePercent,
        colorBleedPercent: bleedPercent,
      }
    });
  };

  if (!isClient) return null;

  return (
    <div className="w-full flex flex-col items-center gap-5 max-w-3xl mx-auto px-4">
      
      {/* Title Block */}
      <div className="w-full bg-pink-50/90 border-4 border-slate-800 rounded-3xl p-4 shadow-[6px_6px_0px_0px_#1e293b] text-center">
        <h4 className="text-xl md:text-2xl font-black text-pink-700 mb-1 leading-snug flex items-center justify-center gap-2">
          <IoSparkles className="text-pink-500 animate-pulse" />
          <span>{currentItem.title}</span>
          <IoSparkles className="text-pink-500 animate-pulse" />
        </h4>
        <p className="text-slate-600 text-xs md:text-sm font-semibold">
          Nhiệm vụ: Chọn bút sáp màu bên dưới và di cọ vẽ để tô kín bên trong hình nhé!
        </p>
      </div>

      {/* Canvas painting area (750x500 for Premium Desktop size) */}
      <div className="bg-gradient-to-tr from-pink-100/30 via-purple-50/20 to-indigo-100/30 border-4 border-slate-800 rounded-[32px] p-4 shadow-[6px_6px_0px_0px_#1e293b] relative w-full">
        <canvas
          ref={canvasRef}
          width={750}
          height={500}
          className="bg-white border-3 border-slate-800 rounded-[24px] cursor-crosshair touch-none w-full shadow-inner aspect-[1.5/1]"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>

      {/* Colors Palette: Beautiful 3D Crayons Box */}
      <div className="flex flex-col items-center p-4 bg-amber-50 rounded-3xl border-3 border-slate-800 shadow-[6px_6px_0px_0px_#1e293b] w-full">
        <div className="text-xs font-black text-amber-800 uppercase tracking-wider mb-3 text-center">
          🖍️ Hộp Bút Màu Sáp
        </div>
        
        {/* Crayon container - horizontal layout */}
        <div className="flex flex-row gap-3 md:gap-5 justify-center items-end flex-wrap px-2 h-16 w-full">
          {COLORS.map((c) => {
            const isSelected = selectedColor === c.hex;
            return (
              <motion.button
                key={c.hex}
                onClick={() => setSelectedColor(c.hex)}
                animate={isSelected ? { y: -12, scale: 1.1 } : { y: 0, scale: 1 }}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="relative flex flex-col items-center focus:outline-none cursor-pointer"
                title={c.name}
              >
                {/* Crayon Tip (Đầu bút nhọn) */}
                <div 
                  className="w-4 h-3.5 border border-slate-700/10"
                  style={{ 
                    backgroundColor: c.hex, 
                    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" 
                  }}
                />
                {/* Crayon Body (Thân bút sáp màu) */}
                <div 
                  className={`w-6 h-10 rounded-b border ${
                    isSelected ? "border-slate-800 shadow-md" : "border-slate-700/20"
                  } shadow-sm flex items-center justify-center text-[9px] font-black text-white/90 select-none`}
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="drop-shadow">{c.name[0]}</span>
                </div>
                {/* Shadow overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/20 rounded-b pointer-events-none" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error alert message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1.5 text-red-500 bg-red-50 px-4 py-2 rounded-2xl font-bold border border-red-200 w-full justify-center text-xs"
          >
            <IoAlertCircle className="text-base" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Station: Brush sizes, Stats, and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full items-center bg-white p-4 rounded-3xl border-3 border-slate-800 shadow-[6px_6px_0px_0px_#1e293b]">
        
        {/* Brush Size Selector */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Cọ vẽ</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBrushSize(12)}
              className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center transition-all border-2 font-black cursor-pointer ${
                brushSize === 12 ? "bg-amber-500 text-white border-2 border-slate-800 shadow-none translate-y-[3px]" : "bg-white text-slate-800 border-2 border-slate-800 shadow-[3px_3px_0px_0px_#1e293b] hover:bg-slate-50 active:translate-y-[3px] active:shadow-none"
              }`}
            >
              <div className="w-2.5 h-2.5 bg-current rounded-full" />
              <span className="text-[9px] mt-0.5 font-bold">Nhỏ</span>
            </button>
            <button
              type="button"
              onClick={() => setBrushSize(22)}
              className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center transition-all border-2 font-black cursor-pointer ${
                brushSize === 22 ? "bg-amber-500 text-white border-2 border-slate-800 shadow-none translate-y-[3px]" : "bg-white text-slate-800 border-2 border-slate-800 shadow-[3px_3px_0px_0px_#1e293b] hover:bg-slate-50 active:translate-y-[3px] active:shadow-none"
              }`}
            >
              <div className="w-5 h-5 bg-current rounded-full" />
              <span className="text-[9px] mt-0.5 font-bold">To</span>
            </button>
          </div>
        </div>

        {/* Stats Display (Coverage and Bleed) */}
        <div className="space-y-2 border-y md:border-y-0 md:border-x border-slate-100 py-2.5 md:py-0 px-4">
          <div>
            <div className="flex justify-between items-center text-slate-600 font-bold mb-1 text-[10px]">
              <span>Phủ màu:</span>
              <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                {coveragePercent}% / {currentItem.targetCoveragePercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full"
                animate={{ width: `${coveragePercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center text-slate-600 font-bold mb-1 text-[10px]">
              <span>Lem viền:</span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {bleedPercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                className={`h-full rounded-full ${bleedPercent > 18 ? "bg-red-500" : "bg-emerald-500"}`}
                animate={{ width: `${bleedPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-4 py-2.5 bg-white border-2 border-slate-800 hover:bg-slate-50 text-slate-800 font-black rounded-xl transition-all shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-[3px] active:shadow-none text-xs cursor-pointer"
          >
            <IoTrashOutline className="text-sm" />
            <span>Tô lại</span>
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-6 py-3 bg-pink-400 hover:bg-pink-300 text-white border-2 border-slate-800 font-black text-sm rounded-xl shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
          >
            <IoCheckmarkCircle size={16} />
            <span>Hoàn thành</span>
          </button>
        </div>
      </div>

    </div>
  );
}
