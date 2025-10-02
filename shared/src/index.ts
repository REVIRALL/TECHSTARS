// ユーザー型
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'standard' | 'professional';
  createdAt: Date;
  updatedAt: Date;
}

// コード解析型
export interface CodeAnalysis {
  id: string;
  userId: string;
  code: string;
  language: string;
  explanation: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
}

// 解説レベル型
export type ExplanationLevel = 'beginner' | 'intermediate' | 'advanced';

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 認証トークン型
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 学習進捗型
export interface LearningProgress {
  userId: string;
  day: number;
  completed: boolean;
  score: number;
  timestamp: Date;
}
