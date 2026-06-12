"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { removeStoredValue, setStoredValue } from "@/lib/client-storage";
import { useAuth } from "@/contexts/AuthContext";

export interface StudentInfo {
  name: string;      // Tên đầy đủ trên lớp
  nickname: string;  // Biệt danh / Tên gọi yêu thích
  grade: string;     // Lớp học (ví dụ: Lớp 1, Lớp 2...)
  avatar: string;    // Emoji avatar (ví dụ: 🦁)
  theme?: 'dino' | 'turtle' | 'bunny' | 'panda' | 'leopard'; // Theme giao diện của bé
}

interface StudentContextType {
  studentInfo: StudentInfo | null;
  isConfigured: boolean;
  isOpenConfig: boolean;
  isLoaded: boolean;
  updateStudentInfo: (info: StudentInfo) => void;
  setIsOpenConfig: (isOpen: boolean) => void;
  clearStudentInfo: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STORAGE_KEY = "viettyping_student_profile";

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      try {
        const savedProfile = localStorage.getItem(STORAGE_KEY);
        const localProfile = savedProfile ? JSON.parse(savedProfile) as StudentInfo : null;
        setStudentInfo(localProfile);
        document.documentElement.setAttribute('data-theme', localProfile?.theme || 'dino');
      } catch (error) {
        console.error("Lỗi khi tải thông tin học sinh từ localStorage:", error);
        setStudentInfo(null);
        document.documentElement.setAttribute('data-theme', 'dino');
      } finally {
        setIsLoaded(true);
      }
      return;
    }
    setIsLoaded(false);
    let cancelled = false;

    async function loadProfile() {
      try {
        const savedProfile = localStorage.getItem(STORAGE_KEY);
        const localProfile = savedProfile ? JSON.parse(savedProfile) as StudentInfo : null;
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        const serverProfile = payload.profile as StudentInfo | null;
        const profile = serverProfile?.nickname ? serverProfile : localProfile;

        if (profile) {
          setStudentInfo(profile);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          document.documentElement.setAttribute('data-theme', profile.theme || 'dino');
          if (!serverProfile?.nickname && localProfile?.nickname) {
            await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localProfile),
            });
          }
        } else {
          document.documentElement.setAttribute('data-theme', 'dino');
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin học sinh:", error);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, [user]);

  const updateStudentInfo = useCallback((info: StudentInfo) => {
    const infoWithTheme: StudentInfo = {
      ...info,
      theme: info.theme || 'dino'
    };
    setStudentInfo(infoWithTheme);
    try {
      setStoredValue(STORAGE_KEY, JSON.stringify(infoWithTheme));
      if (user) {
        void fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(infoWithTheme),
        });
      }
      if (infoWithTheme.theme) {
        document.documentElement.setAttribute('data-theme', infoWithTheme.theme);
      }
    } catch (error) {
      console.error("Lỗi khi lưu thông tin học sinh vào localStorage:", error);
    }
  }, [user]);

  const clearStudentInfo = useCallback(() => {
    setStudentInfo(null);
    try {
      removeStoredValue(STORAGE_KEY);
      document.documentElement.setAttribute('data-theme', 'dino');
    } catch (error) {
      console.error("Lỗi khi xóa thông tin học sinh:", error);
    }
  }, []);

  const isConfigured = studentInfo !== null && studentInfo.nickname.trim() !== "";

  return (
    <StudentContext.Provider
      value={{
        studentInfo,
        isConfigured,
        isOpenConfig,
        isLoaded,
        updateStudentInfo,
        setIsOpenConfig,
        clearStudentInfo,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
}
