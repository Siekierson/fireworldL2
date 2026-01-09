import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DEFAULT_AVATAR_URL = '/default-avatar.png';

export const authController = {
  async register(name: string, password: string) {
    try {
      console.log('Starting registration process...');
      
      if (name.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      console.log('Checking for existing user...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select()
        .eq('name', name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
        throw new Error('Error checking username availability');
      }

      if (existingUser) {
        throw new Error('Username already exists');
      }

      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUserData = {
        name,
        password: hashedPassword
      };

      console.log('Creating new user...');
      const { data, error } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Registration failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after registration');
      }

      console.log('User created successfully, generating token...');
      const userData = data as unknown as User;
      if (!userData.userID) {
        throw new Error('User data does not contain userID');
      }
      const token = jwt.sign({ userID: userData.userID, name: userData.name }, JWT_SECRET);
      console.log('Created token payload:', { userID: userData.userID, name: userData.name });
      return { user: userData, token };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(name: string, password: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('name', name)
        .single();

      if (error || !data) {
        throw new Error('Invalid credentials');
      }

      const userData = data as unknown as User;
      const isValidPassword = await bcrypt.compare(password, userData.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      console.log('User data before token creation:', userData);
      if (!userData.userID) {
        throw new Error('User data does not contain userID');
      }
      const token = jwt.sign({ userID: userData.userID, name: userData.name }, JWT_SECRET);
      console.log('Created token payload:', { userID: userData.userID, name: userData.name });
      return { user: userData, token };
    } catch (error) {
      throw error;
    }
  },

  verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userID: string, name: string };
      console.log('Verified token:', decoded);
      if (!decoded.userID) {
        throw new Error('Token does not contain userID');
      }
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }
}; 