import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoLecture extends Document {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  teacher: string;
  description: string;
  views: number;
  createdAt: Date;
}

const VideoLectureSchema = new Schema<IVideoLecture>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, default: 'AI & GenAI Master Track' },
    duration: { type: String, default: '45 mins' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
    teacher: { type: String, default: 'Lead AI Researcher' },
    description: { type: String, default: '' },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const VideoLectureModel =
  mongoose.models.VideoLecture ||
  mongoose.model<IVideoLecture>('VideoLecture', VideoLectureSchema);

