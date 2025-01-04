import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'] 
  },
  studentId: { 
    type: String, 
    required: [true, 'Student ID is required'],
    unique: true 
  },
  department: { 
    type: String, 
    required: [true, 'Department is required'] 
  },
  graduationYear: { 
    type: Number, 
    required: [true, 'Graduation year is required'] 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'] 
  },
  profilePicture: { type: String },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('User', userSchema);
