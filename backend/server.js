const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const possiblePaths = [
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env.local'),
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && 
                 supabaseKey && 
                 supabaseUrl !== 'twoj_supabase_url' &&
                 supabaseUrl.startsWith('http')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

let redisClient;

async function initRedis() {
  try {
    const isDocker = process.env.DB_HOST === 'database' || process.env.REDIS_HOST === 'redis';
    const redisHost = process.env.REDIS_HOST || (isDocker ? 'redis' : 'localhost');
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    
    redisClient = redis.createClient({
      socket: {
        host: redisHost,
        port: redisPort
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log(`Redis connected to ${redisHost}:${redisPort}`);
  } catch (error) {
    console.error('Redis connection error:', error);
  }
}

initRedis();

let pgPool = null;

async function initPostgreSQL() {
  const isDocker = process.env.DB_HOST === 'database';
  const hasDbConfig = process.env.DB_HOST || isDocker;
  
  if (!hasDbConfig) {
    return;
  }

  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'database',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fireworld',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

    pgPool = new Pool(dbConfig);

    pgPool.on('error', (err) => {
      console.error('PostgreSQL connection error:', err);
      pgPool = null;
    });

    await pgPool.query('SELECT NOW()');
  } catch (error) {
    console.warn('PostgreSQL connection failed:', error.message);
    pgPool = null;
  }
}

initPostgreSQL();

async function logToDatabase(service, action, data) {
  if (pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO system_logs (service, action, data, created_at) VALUES ($1, $2, $3, NOW())',
        [service, action, JSON.stringify(data)]
      );
      return;
    } catch (error) {
      console.error('Error logging to database:', error);
    }
  }
  console.log(`[${service}] ${action}:`, data);
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

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env.local file' });
    }

    try {
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
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      await logToDatabase('backend', 'openai_error', { 
        error: openaiError.message,
        status: openaiError.status,
        code: openaiError.code
      });
      
      if (openaiError.status === 401) {
        return res.status(401).json({ error: 'Invalid OpenAI API key. Please check OPENAI_API_KEY in .env.local' });
      } else if (openaiError.status === 429) {
        return res.status(429).json({ error: 'OpenAI API rate limit exceeded. Please try again later.' });
      } else {
        return res.status(500).json({ 
          error: 'OpenAI API error',
          details: openaiError.message 
        });
      }
    }
  } catch (error) {
    console.error('Error in /api/chat:', error);
    await logToDatabase('backend', 'chat_error', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to process your request',
      details: error.message 
    });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY || process.env.NEWS_API_KEY;
    
    if (!newsApiKey) {
      return res.status(503).json({ error: 'News API key is not configured. Please set NEXT_PUBLIC_NEWS_API_KEY in .env.local file' });
    }

    const response = await axios.get('https://api.thenewsapi.com/v1/news/top', {
      params: {
        api_token: newsApiKey,
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

    if (!supabase) {
      return res.status(503).json({ error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local file' });
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

    const token = jwt.sign({ userID: data.userid, name: data.name }, process.env.JWT_SECRET);
    
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

    if (!supabase) {
      return res.status(503).json({ error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local file' });
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

    const token = jwt.sign({ userID: data.userid, name: data.name }, process.env.JWT_SECRET);
    
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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json(decoded);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/supabase/test', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local file' });
    }

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

