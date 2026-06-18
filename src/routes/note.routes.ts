import express from 'express';
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote
} from '../controllers/note.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All routes require auth

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .patch(updateNote)
  .delete(deleteNote);

export default router;
