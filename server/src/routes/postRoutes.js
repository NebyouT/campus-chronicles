import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  toggleLike,
  addTestimonial,
  deletePost 
} from '../controllers/postController.js';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync('uploads');
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

// Post routes
router.post('/', auth, upload.single('image'), createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);

// Like/Unlike route
router.post('/:id/like', auth, toggleLike);

// Testimonial route
router.post('/:id/testimonial', auth, addTestimonial);

// Delete route
router.delete('/:id', auth, deletePost);

export default router;
