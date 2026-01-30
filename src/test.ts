import 'dotenv/config';
import { OneMinAIClient } from './client';

async function testClient() {
  const apiKey = process.env.MINAI_API_KEY;

  if (!apiKey) {
    console.error('Error: MINAI_API_KEY not set in .env');
    process.exit(1);
  }

  const client = new OneMinAIClient(apiKey);

  // Test basic chat
  console.log('Testing basic chat...');
  const result = await client.chat({
    prompt: 'Hello, what is 2 + 2?',
    model: 'gpt-4o-mini',
  });

  console.log('Response:', result);

  // Test streaming
  console.log('\nTesting streaming...');
  try {
    const stream = await client.chatStream({
      prompt: 'Write a short poem about TypeScript',
    });
    
    if (stream) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (value) {
          process.stdout.write(decoder.decode(value));
        }
        done = streamDone;
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

testClient().catch(console.error);