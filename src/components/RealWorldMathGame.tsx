"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { IoCheckmarkCircle, IoAlertCircle, IoHelpCircle } from "react-icons/io5";
import { GameAdapterProps, RealWorldMathGameItem } from "@/types/lesson";

// Draggable Item Component
function DraggableItem({ id, itemType }: { id: string; itemType: string }) {
  const getEmoji = () => itemType === 'apple' ? '🍎' : itemType === 'candy' ? '🍬' : '🪙';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 1,
        touchAction: "none",
      }
    : { touchAction: "none" };



  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="p-1 select-none">
      <motion.div
        whileHover={!isDragging ? { scale: 1.15, rotate: 5 } : {}}
        whileTap={!isDragging ? { scale: 0.9 } : {}}
        className={`cursor-grab text-5xl flex items-center justify-center w-14 h-14 bg-white rounded-2xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_#1e293b] transition-all active:translate-y-[2px] active:shadow-none ${
          isDragging ? "shadow-[4px_4px_0px_0px_#1e293b] opacity-80 scale-110 cursor-grabbing" : ""
        }`}
      >
        {getEmoji()}
      </motion.div>
    </div>
  );
}

// Droppable Source Pool Component (Vùng chứa nguồn vật phẩm)
function SourcePool({ id, items, itemType }: { id: string; items: string[]; itemType: string }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-wrap justify-center items-center gap-3 p-4 bg-slate-50 rounded-3xl border-3 border-slate-800 shadow-[6px_6px_0px_0px_#1e293b] w-full max-w-xl min-h-[100px]"
    >
      {items.map((itemId) => (
        <DraggableItem key={itemId} id={itemId} itemType={itemType} />
      ))}
      {items.length === 0 && (
        <span className="text-slate-400 text-sm font-bold">Hết vật phẩm để kéo rồi!</span>
      )}
    </div>
  );
}

// Droppable Target Area Component (Vùng giỏ chứa quả/kẹo/xu)
function TargetContainer({
  id,
  items,
  itemType,
  isError,
}: {
  id: string;
  items: string[];
  itemType: string;
  isError: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const getTargetBg = () => {
    if (isOver) return "bg-purple-100 shadow-[8px_8px_0px_0px_#1e293b] -translate-y-[2px] scale-105";
    if (isError) return "bg-red-100 border-red-500 shadow-[2px_2px_0px_0px_#1e293b] translate-y-[4px]";
    return "bg-amber-50/50 shadow-[6px_6px_0px_0px_#1e293b]";
  };

  const getTargetIcon = () => {
    if (itemType === "apple") return "🧺 Giỏ Táo";
    if (itemType === "candy") return "🎁 Hộp Kẹo";
    return "👛 Ví Tiền";
  };



  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-lg font-black text-amber-700 bg-amber-100/50 px-4 py-1.5 rounded-full border border-amber-200">
        {getTargetIcon()}
      </div>
      <motion.div
        ref={setNodeRef}
        animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={`relative w-64 h-64 md:w-80 md:h-72 rounded-[40px] border-4 border-slate-800 flex flex-wrap content-start items-center justify-center p-6 gap-3 transition-all ${getTargetBg()}`}
      >
        <AnimatePresence>
          {items.map((itemId) => (
            <motion.div
              key={itemId}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, y: 50 }}
              className="text-5xl select-none"
            >
              <DraggableItem id={itemId} itemType={itemType} />
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none p-4 text-center">
            <span className="text-4xl mb-2">📥</span>
            <span className="text-xs font-bold">Kéo thả vật phẩm vào đây</span>
          </div>
        )}
      </motion.div>
      <div className="text-sm font-bold text-slate-500">
        Đang có: <span className="text-blue-600 font-extrabold text-lg">{items.length}</span> vật phẩm
      </div>
    </div>
  );
}

export default function RealWorldMathGame({ gameConfig, onComplete }: GameAdapterProps<RealWorldMathGameItem>) {
  const { id: gameId, items } = gameConfig;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = items[currentQuestionIndex];

  const [sourceItems, setSourceItems] = useState<string[]>([]);
  const [targetItems, setTargetItems] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Telemetry references
  const startTimeRef = useRef<number>(Date.now());
  const mathRetriesRef = useRef<number>(0);
  const errorsRef = useRef<Array<{ questionId: string; userAnswer: string; correctAnswer: string }>>([]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setIsClient(true);
    resetQuestion(0);
    startTimeRef.current = Date.now();
    mathRetriesRef.current = 0;
    errorsRef.current = [];
  }, [gameId]);

  const resetQuestion = (index: number) => {
    const q = items[index];
    if (!q) return;

    // Cung cấp sẵn 10 vật phẩm ở nguồn
    const newSource = Array.from({ length: 12 }, (_, i) => `${q.itemType}_${i}`);
    setSourceItems(newSource);
    setTargetItems([]);
    setIsError(false);
    setErrorHint(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Kéo từ Nguồn vào Đích
    if (overId === "target-pool" && sourceItems.includes(activeId)) {
      setSourceItems((prev) => prev.filter((i) => i !== activeId));
      setTargetItems((prev) => [...prev, activeId]);

      // Play a light audio cue
      playAudioCue("/ting.mp3", 0.3);
    }
    // Kéo từ Đích trả về Nguồn
    else if (overId === "source-pool" && targetItems.includes(activeId)) {
      setTargetItems((prev) => prev.filter((i) => i !== activeId));
      setSourceItems((prev) => [...prev, activeId]);

      playAudioCue("/ting.mp3", 0.2);
    }
  };

  const playAudioCue = (src: string, volume = 0.5) => {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch {
      // Ignore
    }
  };

  const handleCheckAnswer = () => {
    const targetCount = targetItems.length;
    const expected = currentQuestion.targetNum;

    if (targetCount === expected) {
      // Đúng phép tính!
      playAudioCue("/ting.mp3", 0.6);

      if (currentQuestionIndex < items.length - 1) {
        // Chuyển câu hỏi kế tiếp
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        resetQuestion(nextIdx);
      } else {
        // Hoàn thành tất cả các câu
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const score = Math.max(0, 100 - (mathRetriesRef.current * 15)); // Giảm điểm dựa vào số lần thử sai

        onComplete({
          score,
          durationSeconds,
          errors: errorsRef.current.length > 0 ? errorsRef.current : undefined,
          metadata: {
            mathRetries: mathRetriesRef.current,
          }
        });
      }
    } else {
      // Sai phép tính!
      setIsError(true);
      mathRetriesRef.current += 1;
      playAudioCue("/buzz.mp3", 0.5);

      // Thêm thông tin lỗi cho telemetry
      errorsRef.current.push({
        questionId: `${gameId}_q_${currentQuestionIndex}`,
        userAnswer: `${targetCount}`,
        correctAnswer: `${expected}`,
      });

      // Tạo gợi ý thông minh ("Cơ hội thứ hai")
      if (targetCount < expected) {
        setErrorHint(`Bé cần thêm ${expected - targetCount} vật phẩm nữa nhé!`);
      } else {
        setErrorHint(`Bé đã bỏ thừa mất ${targetCount - expected} vật phẩm rồi!`);
      }

      setTimeout(() => {
        setIsError(false);
      }, 800);
    }
  };

  if (!isClient || !currentQuestion) return null;

  return (
    <div className="w-full flex flex-col items-center gap-6">

      {/* Question / Instruction Section */}
      <div className="w-full max-w-xl bg-white/90 border-4 border-slate-800 rounded-3xl p-5 shadow-[6px_6px_0px_0px_#1e293b]">
        <h4 className="text-xl md:text-2xl font-black text-purple-700 mb-2 leading-snug">
          {currentQuestion.sentence}
        </h4>
        <p className="text-sm text-slate-500 font-bold flex items-center gap-1 justify-center">
          <IoHelpCircle className="text-base text-purple-500" />
          Nhiệm vụ: Kéo số lượng vật phẩm tương ứng vào giỏ rồi bấm nút Kiểm tra.
        </p>
      </div>

      {/* Dnd Workspace */}
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 py-4">
          {/* Target Container */}
          <TargetContainer
            id="target-pool"
            items={targetItems}
            itemType={currentQuestion.itemType}
            isError={isError}
          />

          {/* Source Pool */}
          <div className="flex flex-col items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400">Kho vật phẩm của bé</span>
            <SourcePool
              id="source-pool"
              items={sourceItems}
              itemType={currentQuestion.itemType}
            />
          </div>
        </div>
      </DndContext>

      {/* Error Hint Display */}
      <AnimatePresence>
        {errorHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1.5 text-red-500 bg-red-50 px-4 py-2 rounded-xl font-bold border border-red-200"
          >
            <IoAlertCircle className="text-lg" />
            <span>{errorHint}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="flex items-center justify-between w-full max-w-xl bg-slate-50 p-4 rounded-2xl border-3 border-slate-800 shadow-[4px_4px_0px_0px_#1e293b] shrink-0">
        <span className="text-xs font-bold text-slate-400">
          Câu hỏi {currentQuestionIndex + 1} / {items.length}
        </span>
        <button
          onClick={handleCheckAnswer}
          className="flex items-center gap-1.5 px-8 py-3 bg-green-400 hover:bg-green-300 text-white font-black text-lg rounded-2xl border-3 border-slate-800 shadow-[4px_4px_0px_0px_#1e293b] transition-all active:translate-y-[4px] active:shadow-none"
        >
          <IoCheckmarkCircle size={20} />
          Kiểm tra
        </button>
      </div>

    </div>
  );
}
