import { Request, Response, NextFunction } from 'express';
import { Note } from '../models/Note';
import { AppError } from '../utils/AppError';

export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId, problemName, notes, tags, difficulty, revisionStatus } = req.body;

    const newNote = await Note.create({
      user: req.user.id,
      problemId,
      problemName,
      notes,
      tags,
      difficulty,
      revisionStatus
    });

    res.status(201).json({ status: 'success', data: newNote });
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Basic filtering available via query params
    const filter: any = { user: req.user.id };
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.revisionStatus) filter.revisionStatus = req.query.revisionStatus;

    const notes = await Note.find(filter).sort('-updatedAt');
    res.status(200).json({ status: 'success', count: notes.length, data: notes });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const note = await Note.findOneAndUpdate(
      { _id: id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!note) {
      return next(new AppError('Note not found', 404));
    }

    res.status(200).json({ status: 'success', data: note });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndDelete({ _id: id, user: req.user.id });

    if (!note) {
      return next(new AppError('Note not found', 404));
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
