const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

let redisClient;

async function initRedis() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log('Redis connected');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
}

initRedis();

const pgPool = new Pool({
  host: process.env.DB_HOST || 'database',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fireworld',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pgPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function logToDatabase(service, action, data) {
  try {
    await pgPool.query(
      'INSERT INTO system_logs (service, action, data, created_at) VALUES ($1, $2, $3, NOW())',
      [service, action, JSON.stringify(data)]
    );
  } catch (error) {
    console.error('Error logging to database:', error);
  }
}

async function publishToRedis(channel, data) {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.publish(channel, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error publishing to Redis:', error);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-3.5-turbo",
    });

    const response = completion.choices[0].message.content;

    await logToDatabase('backend', 'openai_request', { message, response });
    await publishToRedis('stats', {
      type: 'ai_request',
      timestamp: new Date().toISOString(),
      message_length: message.length
    });

    res.json({ message: response });
  } catch (error) {
    console.error('Error:', error);
    await logToDatabase('backend', 'openai_error', { error: error.message });
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const response = await axios.get('https://api.thenewsapi.com/v1/news/top', {
      params: {
        api_token: process.env.NEWS_API_KEY,
        locale: 'pl',
        limit: parseInt(limit),
        page: parseInt(page),
        language: 'pl'
      }
    });

    let newsData = response.data.data || response.data.articles || response.data;
    
    if (!Array.isArray(newsData)) {
      newsData = [];
    }

    const transformedData = newsData.map((item) => ({
      title: item.title || item.headline || '',
      description: item.description || item.summary || '',
      url: item.url || item.link || '',
      image_url: item.image_url || item.urlToImage || '',
      published_at: item.published_at || item.publishedAt || new Date().toISOString()
    }));

    await logToDatabase('backend', 'newsapi_request', { page, limit, count: transformedData.length });
    await publishToRedis('stats', {
      type: 'news_request',
      timestamp: new Date().toISOString(),
      count: transformedData.length
    });

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching news:', error);
    await logToDatabase('backend', 'newsapi_error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.post('/api/auth', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select()
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      await logToDatabase('backend', 'auth_error', { error: checkError.message });
      return res.status(400).json({ error: 'Error checking username availability' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, password: hashedPassword }])
      .select()
      .single();

    if (error || !data) {
      await logToDatabase('backend', 'auth_error', { error: error?.message });
      return res.status(400).json({ error: 'Registration failed' });
    }

    const token = jwt.sign({ userID: data.userid, name: data.name }, process.env.JWT_SECRET || 'your-secret-key');
    
    await logToDatabase('backend', 'auth_register', { userID: data.userid });
    await publishToRedis('stats', {
      type: 'user_register',
      timestamp: new Date().toISOString()
    });

    res.json({ user: data, token });
  } catch (error) {
    console.error('Registration error:', error);
    await logToDatabase('backend', 'auth_error', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.put('/api/auth', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('name', name)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, data.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userID: data.userid, name: data.name }, process.env.JWT_SECRET || 'your-secret-key');
    
    await logToDatabase('backend', 'auth_login', { userID: data.userid });
    await publishToRedis('stats', {
      type: 'user_login',
      timestamp: new Date().toISOString()
    });

    res.json({ user: data, token });
  } catch (error) {
    console.error('Login error:', error);
    await logToDatabase('backend', 'auth_error', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json(decoded);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/supabase/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) throw error;

    await logToDatabase('backend', 'supabase_test', { success: true });
    await publishToRedis('stats', {
      type: 'supabase_test',
      timestamp: new Date().toISOString()
    });

    res.json({ connected: true, data });
  } catch (error) {
    console.error('Supabase error:', error);
    await logToDatabase('backend', 'supabase_error', { error: error.message });
    res.status(500).json({ error: 'Failed to connect to Supabase' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

