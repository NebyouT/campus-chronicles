import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register user
export const register = async (req, res) => {
  try {
    const { name, studentId, department, graduationYear, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { studentId }, 
        { fullName: name }
      ] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this Student ID or Name' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      fullName: name,
      studentId,
      department,
      graduationYear,
      password: hashedPassword
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        studentId: user.studentId,
        department: user.department,
        graduationYear: user.graduationYear,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check if user exists (using either studentId or fullName)
    const user = await User.findOne({
      $or: [
        { studentId: identifier },
        { fullName: identifier }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        studentId: user.studentId,
        department: user.department,
        graduationYear: user.graduationYear,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
