'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityAdapterProps } from '@/types/activity';
import { QuizActivity } from './QuizActivity';
import { useTypingSound } from '@/hooks/useTypingSound';

const VerticalMathActivity: React.FC<ActivityAdapterProps> = ({ activity, onComplete, onProgressUpdate }) => {
  const { playCorrectSound, playWrongSound } = useTypingSound();
  const startTimeRef = useRef<number>(Date.now());
  const wrongAttemptsRef = useRef<number>(0);

  // Trích xuất toán hạng, toán tử
  const operand1 = activity.data?.operand1 ?? 0;
  const operand2 = activity.data?.operand2 ?? 0;
  const operator = activity.data?.operator ?? '+';
  const result = operator === '+' ? operand1 + operand2 : operand1 - operand2;

  // Tách hàng chục và hàng đơn vị
  const op1Tens = Math.floor(operand1 / 10) > 0 ? Math.floor(operand1 / 10) : null;
  const op1Ones = operand1 % 10;

  const op2Tens = Math.floor(operand2 / 10) > 0 ? Math.floor(operand2 / 10) : null;
  const op2Ones = operand2 % 10;

  const resTens = Math.floor(result / 10) > 0 ? Math.floor(result / 10) : null;
  const resOnes = result % 10;

  // Kiểm tra có nhớ hoặc mượn
  const hasCarry = operator === '+' && (op1Ones + op2Ones >= 10);
  const hasBorrow = operator === '-' && (op1Ones < op2Ones);
  const hasCarryOrBorrow = hasCarry || hasBorrow;

  // Trạng thái nhập liệu của trẻ
  const [userOnes, setUserOnes] = useState('');
  const [userCarry, setUserCarry] = useState('');
  const [userTens, setUserTens] = useState('');

  // Trạng thái đúng sai của từng ô
  const [onesStatus, setOnesStatus] = useState<'empty' | 'correct' | 'incorrect'>('empty');
  const [carryStatus, setCarryStatus] = useState<'empty' | 'correct' | 'incorrect'>('empty');
  const [tensStatus, setTensStatus] = useState<'empty' | 'correct' | 'incorrect'>('empty');

  // Ô đang được kích hoạt nhập liệu
  const [activeField, setActiveField] = useState<'ones' | 'carry' | 'tens'>('ones');

  // Xử lý khi nhập một chữ số (từ bàn phím vật lý hoặc bàn phím ảo)
  const handleDigitInput = (digit: string) => {
    if (activeField === 'ones') {
      const correctDigit = String(resOnes);
      if (digit === correctDigit) {
        setUserOnes(digit);
        setOnesStatus('correct');
        playCorrectSound();
        if (onProgressUpdate) onProgressUpdate(33);

        // Chuyển sang bước tiếp theo
        setTimeout(() => {
          if (hasCarryOrBorrow) {
            setActiveField('carry');
          } else if (resTens !== null) {
            setActiveField('tens');
          } else {
            finishActivity();
          }
        }, 600);
      } else {
        setOnesStatus('incorrect');
        playWrongSound();
        wrongAttemptsRef.current += 1;
        setTimeout(() => setOnesStatus('empty'), 800);
      }
    } else if (activeField === 'carry') {
      const correctDigit = '1'; // Phép cộng có nhớ hay trừ có mượn ở lớp 1 đều là nhớ/mượn 1
      if (digit === correctDigit) {
        setUserCarry(digit);
        setCarryStatus('correct');
        playCorrectSound();
        if (onProgressUpdate) onProgressUpdate(66);

        setTimeout(() => {
          if (resTens !== null) {
            setActiveField('tens');
          } else {
            finishActivity();
          }
        }, 600);
      } else {
        setCarryStatus('incorrect');
        playWrongSound();
        wrongAttemptsRef.current += 1;
        setTimeout(() => setCarryStatus('empty'), 800);
      }
    } else if (activeField === 'tens') {
      const correctDigit = String(resTens);
      if (digit === correctDigit) {
        setUserTens(digit);
        setTensStatus('correct');
        playCorrectSound();
        if (onProgressUpdate) onProgressUpdate(100);

        setTimeout(() => {
          finishActivity();
        }, 600);
      } else {
        setTensStatus('incorrect');
        playWrongSound();
        wrongAttemptsRef.current += 1;
        setTimeout(() => setTensStatus('empty'), 800);
      }
    }
  };

  const finishActivity = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    // Tính điểm (mỗi lần gõ sai trừ 10%, tối thiểu 50%)
    const score = Math.max(50, 100 - wrongAttemptsRef.current * 10);
    onComplete({
      score,
      duration,
      rawPayload: {
        operand1,
        operand2,
        operator,
        result,
        wrongAttempts: wrongAttemptsRef.current,
      },
    });
  };

  // Lắng nghe phím gõ vật lý
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitInput(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeField]);

  // Lời nhắn hướng dẫn bé dựa theo ô đang gõ
  const getGuideText = () => {
    if (activeField === 'ones') {
      return `Bé hãy tính hàng đơn vị (bên phải): ${op1Ones} ${operator} ${op2Ones} bằng bao nhiêu nhé?`;
    }
    if (activeField === 'carry') {
      return hasCarry
        ? 'Chính xác! Phép cộng vượt quá 10. Bé hãy điền 1 vào ô nhớ màu hồng trên đầu hàng chục nhé!'
        : 'Chính xác! Hàng đơn vị không trừ được, bé mượn 1 chục. Hãy viết 1 vào ô mượn màu hồng nhé!';
    }
    if (activeField === 'tens') {
      const tensCalculation = hasCarry
        ? `${op1Tens ?? 0} (hàng chục) + ${op2Tens ?? 0} (hàng chục) + 1 (nhớ) = ?`
        : `${op1Tens ?? 0} (hàng chục) - ${op2Tens ?? 0} (hàng chục) - 1 (mượn) = ?`;
      return `Bây giờ bé hãy tính tiếp hàng chục nhé: ${tensCalculation}`;
    }
    return 'Làm tốt lắm!';
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 p-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-2xl font-black text-blue-600 mb-1">{activity.title}</h3>
        <p className="text-sm text-slate-500 font-bold">{activity.instructions}</p>
      </div>

      {/* Guide Banner */}
      <div className="w-full bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center shadow-sm">
        <p className="text-base md:text-lg font-bold text-blue-800 leading-snug">
          {getGuideText()}
        </p>
      </div>

      {/* Vertical Math Board */}
      <div className="bg-white border-4 border-blue-100 rounded-3xl p-8 shadow-xl flex items-center justify-center min-w-[240px]">
        <div className="flex flex-col items-end font-mono text-5xl font-black text-slate-800 relative select-none">
          {/* Carry/Borrow Row */}
          {hasCarryOrBorrow && (
            <div className="flex gap-4 justify-end w-full mb-2 h-12">
              <div className="w-12 h-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {activeField === 'carry' ? (
                    <motion.div
                      key="input"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-10 h-10 rounded-full border-4 border-dashed border-pink-400 bg-pink-50 flex items-center justify-center text-2xl"
                    />
                  ) : carryStatus === 'correct' ? (
                    <motion.div
                      key="correct"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-10 h-10 rounded-full bg-pink-500 border-2 border-pink-600 flex items-center justify-center text-white text-2xl"
                    >
                      {userCarry}
                    </motion.div>
                  ) : carryStatus === 'incorrect' ? (
                    <motion.div
                      key="incorrect"
                      animate={{ x: [-5, 5, -5, 5, 0] }}
                      className="w-10 h-10 rounded-full bg-red-500 border-2 border-red-600 flex items-center justify-center text-white text-2xl"
                    >
                      ?
                    </motion.div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200" />
                  )}
                </AnimatePresence>
              </div>
              <div className="w-12" /> {/* Right side spacer */}
            </div>
          )}

          {/* Operand 1 */}
          <div className="flex gap-4 justify-end w-full h-12 items-center">
            <span className="w-12 text-center">{op1Tens !== null ? op1Tens : ''}</span>
            <span className="w-12 text-center">{op1Ones}</span>
          </div>

          {/* Operator & Operand 2 */}
          <div className="flex gap-4 justify-end w-full h-12 items-center relative">
            <span className="absolute left-0 text-blue-500 text-4xl">{operator}</span>
            <span className="w-12 text-center">{op2Tens !== null ? op2Tens : ''}</span>
            <span className="w-12 text-center">{op2Ones}</span>
          </div>

          {/* Horizontal Line */}
          <div className="w-full h-1.5 bg-slate-400 my-3 rounded-full" />

          {/* Result Inputs Row */}
          <div className="flex gap-4 justify-end w-full h-14">
            {/* Tens Result Input */}
            <div className="w-12 h-14 flex items-center justify-center">
              {resTens !== null ? (
                <AnimatePresence mode="wait">
                  {activeField === 'tens' ? (
                    <motion.div
                      key="active"
                      animate={{ scale: [1, 1.05, 1], borderColor: ['#3b82f6', '#93c5fd', '#3b82f6'] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-12 h-14 border-4 border-blue-500 rounded-xl bg-blue-50/50 flex items-center justify-center text-3xl font-black"
                    />
                  ) : tensStatus === 'correct' ? (
                    <motion.div
                      key="correct"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-12 h-14 border-2 border-green-500 bg-green-100 text-green-700 rounded-xl flex items-center justify-center text-3xl font-black shadow-inner"
                    >
                      {userTens}
                    </motion.div>
                  ) : tensStatus === 'incorrect' ? (
                    <motion.div
                      key="incorrect"
                      animate={{ x: [-6, 6, -6, 6, 0] }}
                      className="w-12 h-14 border-2 border-red-500 bg-red-100 text-red-700 rounded-xl flex items-center justify-center text-3xl font-black"
                    >
                      ?
                    </motion.div>
                  ) : (
                    <div className="w-12 h-14 border-2 border-slate-200 bg-slate-50/30 rounded-xl" />
                  )}
                </AnimatePresence>
              ) : null}
            </div>

            {/* Ones Result Input */}
            <div className="w-12 h-14 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeField === 'ones' ? (
                  <motion.div
                    key="active"
                    animate={{ scale: [1, 1.05, 1], borderColor: ['#3b82f6', '#93c5fd', '#3b82f6'] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-12 h-14 border-4 border-blue-500 rounded-xl bg-blue-50/50 flex items-center justify-center text-3xl font-black"
                  />
                ) : onesStatus === 'correct' ? (
                  <motion.div
                    key="correct"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-14 border-2 border-green-500 bg-green-100 text-green-700 rounded-xl flex items-center justify-center text-3xl font-black shadow-inner"
                  >
                    {userOnes}
                  </motion.div>
                ) : onesStatus === 'incorrect' ? (
                  <motion.div
                    key="incorrect"
                    animate={{ x: [-6, 6, -6, 6, 0] }}
                    className="w-12 h-14 border-2 border-red-500 bg-red-100 text-red-700 rounded-xl flex items-center justify-center text-3xl font-black"
                  >
                    ?
                  </motion.div>
                ) : (
                  <div className="w-12 h-14 border-2 border-slate-200 bg-slate-50/30 rounded-xl" />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Onscreen Kid-friendly Number Pad */}
      <div className="w-full max-w-sm bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
        <span className="text-xs font-black text-slate-400 text-center uppercase tracking-wider mb-1">
          Bàn phím số cho bé
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigitInput(String(num))}
              className="py-3 bg-white border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 active:scale-95 transition-all select-none"
            >
              {num}
            </button>
          ))}
          <div /> {/* Spacer */}
          <button
            onClick={() => handleDigitInput('0')}
            className="py-3 bg-white border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 active:scale-95 transition-all select-none"
          >
            0
          </button>
          <div /> {/* Spacer */}
        </div>
      </div>
    </div>
  );
};

export const MathActivity: React.FC<ActivityAdapterProps> = props => props.activity.data?.subtype === 'vertical' ? <VerticalMathActivity {...props} /> : <QuizActivity {...props} />;
