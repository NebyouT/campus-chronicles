import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';

export const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { name, studentId, department, graduationYear, password } = req.body;

    // Validate input
    if (!name || !studentId || !department || !graduationYear || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'All fields are required',
        received: { name, studentId, department, graduationYear, password: '****' }
      });
    }

    // Check if user already exists
    console.log('Checking if user exists with studentId:', studentId);
    const userRef = db.collection('users').doc(studentId);
    const doc = await userRef.get();
    
    if (doc.exists) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Firebase
    console.log('Creating new user in Firebase');
    const userData = {
      name,
      studentId,
      department,
      graduationYear,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    await userRef.set(userData);
    console.log('User created successfully');

    // Generate JWT token
    const token = jwt.sign(
      { id: studentId, name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        name,
        studentId,
        department,
        graduationYear
      }
    });
  } catch (error) {
    console.error('Detailed registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error registering user',
      error: error.message 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Query user by student ID or name
    let userQuery = await db.collection('users')
      .where('studentId', '==', identifier)
      .get();

    if (userQuery.empty) {
      userQuery = await db.collection('users')
        .where('name', '==', identifier)
        .get();
    }

    if (userQuery.empty) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userDoc = userQuery.docs[0];
    const user = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.studentId, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        name: user.name,
        studentId: user.studentId,
        department: user.department,
        graduationYear: user.graduationYear
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in',
      error: error.message 
    });
  }
};
