import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  imageUrl: { 
    type: String, 
    required: [true, 'Graduation photo is required'] 
  },
  caption: { 
    type: String,
    required: [true, 'Please add a caption for your photo']
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  testimonials: [{
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    message: { 
      type: String,
      required: true 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  graduationYear: {
    type: Number,
    required: [true, 'Graduation year is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for testimonial count
postSchema.virtual('testimonialCount').get(function() {
  return this.testimonials.length;
});

export default mongoose.model('Post', postSchema);
