import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  user: mongoose.Types.ObjectId;
  problemId: string;
  problemName: string;
  notes: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  revisionStatus: 'Need Revision' | 'Mastered' | 'Favorite' | 'None';
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: String,
      required: true,
    },
    problemName: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    tags: [String],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    revisionStatus: {
      type: String,
      enum: ['Need Revision', 'Mastered', 'Favorite', 'None'],
      default: 'None',
    },
  },
  {
    timestamps: true,
  }
);

export const Note = mongoose.model<INote>('Note', NoteSchema);
