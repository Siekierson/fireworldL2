const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');
const { Pool } = require('pg');
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

