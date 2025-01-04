import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';

// Create graduation post
export const createPost = async (req, res) => {
  try {
    const { caption, graduationYear, department } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ message: 'Please upload a graduation photo' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(imageFile.path, {
      folder: 'graduation-photos',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    const post = new Post({
      imageUrl: result.secure_url,
      caption,
      graduationYear,
      department,
      author: req.user._id
    });

    await post.save();

    // Populate author details
    await post.populate('author', 'fullName studentId department graduationYear');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all graduation posts with pagination and filters
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 12, department, graduationYear, search } = req.query;
    const query = {};

    if (department) query.department = department;
    if (graduationYear) query.graduationYear = graduationYear;
    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: 'i' } },
        { 'author.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(query)
      .populate('author', 'fullName studentId department graduationYear')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get post details by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'fullName studentId department graduationYear')
      .populate('testimonials.author', 'fullName studentId');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like/Unlike a post
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    
    if (likeIndex === -1) {
      // Like the post
      post.likes.push(req.user._id);
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json({ likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add testimonial to a post
export const addTestimonial = async (req, res) => {
  try {
    const { message } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.testimonials.push({
      author: req.user._id,
      message
    });

    await post.save();
    await post.populate('testimonials.author', 'fullName studentId');

    res.json(post.testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a post (only by the author)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete image from Cloudinary
    const publicId = post.imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`graduation-photos/${publicId}`);

    await post.remove();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
