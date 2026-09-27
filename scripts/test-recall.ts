import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { HindsightClient } from '@vectorize-io/hindsight-client';

async function test() {
  const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';
  const apiKey = process.env.HINDSIGHT_API_KEY;

  if (!apiKey) {
    console.error('❌ HINDSIGHT_API_KEY missing.');
    process.exit(1);
  }

  const client = new HindsightClient({ baseUrl, apiKey });

  console.log('--- Testing Recall on contact-jordan-reyes ---');
  const recallRes = await client.recall(
    'contact-jordan-reyes',
    'What outstanding commitments or topics were left unresolved from past meetings with Jordan Reyes?'
  );
  console.log('Recall results:');
  console.dir(recallRes, { depth: 4 });

  console.log('\n--- Testing Reflect on contact-jordan-reyes ---');
  const reflectRes = await client.reflect(
    'contact-jordan-reyes',
    'What should I lead with in the next meeting with Jordan Reyes?'
  );
  console.log('Reflection text:');
  console.log(reflectRes.text);
}

test().catch(console.error);
