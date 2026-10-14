import { AI_COURSE_SYLLABUS, PhaseData } from './aiSyllabusData.js';

export interface SeedDataStructure {
  student: any;
  attendanceRecords: any[];
  classes: any[];
  quizzes: any[];
  assignments: any[];
  courseMaterials: any[];
  videos: any[];
  testResults: any[];
  payments: any[];
  syllabus: PhaseData[];
}

// Clean Database & In-Memory Store: All operational seed data removed.
// Starts with 0 students, 0 assignments, 0 quizzes, 0 videos, 0 notes, 0 attendance records, 0 payments.
// Admin dynamically creates and uploads all content which is stored in database and fetched by portals.
// Only the official AI & GenAI curriculum syllabus structure is preserved.
export const SEED_DATA: SeedDataStructure = {
  student: null,
  attendanceRecords: [],
  classes: [],
  quizzes: [],
  assignments: [],
  courseMaterials: [],
  videos: [],
  testResults: [],
  payments: [],
  syllabus: [],
};
  