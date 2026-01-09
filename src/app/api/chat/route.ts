import { NextResponse } from 'next/server';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const { default: OpenAI } = require('openai');
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-3.5-turbo",
    });

    return NextResponse.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
} 