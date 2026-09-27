import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { HindsightClient } from '@vectorize-io/hindsight-client';
import { SEEDED_CONTACTS } from '../lib/contacts';

async function main() {
  console.log('====================================================');
  console.log('🌱 MEETUP MEMORY - SEEDING HINDSIGHT MEMORY BANKS');
  console.log('====================================================');

  const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';
  const apiKey = process.env.HINDSIGHT_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: HINDSIGHT_API_KEY is not defined in .env.local or .env.');
    console.error('Please configure your credentials before running the seed script.');
    process.exit(1);
  }

  console.log(`📡 Connecting to Hindsight at: ${baseUrl}`);
  const client = new HindsightClient({
    baseUrl,
    apiKey,
  });

  for (const contact of SEEDED_CONTACTS) {
    console.log(`\n📁 Processing bank: ${contact.bankId} (${contact.name} - ${contact.company})`);

    // Attempt bank creation if supported
    try {
      await client.createBank(contact.bankId, {
        name: `${contact.name} - ${contact.company}`,
        reflectMission: `Executive meeting preparation agent tracking relationship history, discussions, and unfulfilled commitments for ${contact.name}.`,
      });
      console.log(`  ✅ Bank initialized: ${contact.bankId}`);
    } catch (e: any) {
      console.log(`  ℹ️ Bank initialization note: ${e?.message || 'Proceeding to retain memories'}`);
    }

    // Retain each meeting memory
    for (const [idx, meeting] of contact.meetings.entries()) {
      console.log(`  ⏳ Retaining Meeting #${idx + 1} (${meeting.date}): "${meeting.summary}"...`);
      try {
        await client.retain(contact.bankId, meeting.content, {
          context: `Past Meeting (${meeting.date}): ${meeting.summary}`,
          timestamp: new Date(meeting.date).toISOString(),
        });
        console.log(`  ✅ Retained successfully.`);
      } catch (err: any) {
        console.error(`  ❌ Failed to retain meeting #${idx + 1}:`, err?.message || err);
      }
    }
  }

  console.log('\n====================================================');
  console.log('🔍 VERIFYING RECALL: DEMO CONTACT (Jordan Reyes)');
  console.log('====================================================');

  try {
    const query = 'urgent overdue unfulfilled commitments technical follow-up integration support pricing revisit';
    console.log(`Querying bank "contact-jordan-reyes" with: "${query}"...`);
    const recallResult = await client.recall('contact-jordan-reyes', query, { budget: 'mid' });

    console.log(`\n📋 Raw recall results count: ${recallResult?.results?.length ?? 0}`);
    if (recallResult?.results && recallResult.results.length > 0) {
      recallResult.results.forEach((r, idx) => {
        console.log(`\n[Recall Result #${idx + 1}]`);
        console.log(r.text);
      });
      console.log('\n🎉 SUCCESS: Jordan Reyes memory verified in Hindsight!');
    } else {
      console.warn('⚠️ Warning: No recall results returned yet (indexing may take a brief moment).');
    }
  } catch (err: any) {
    console.error('❌ Error testing recall on Jordan Reyes:', err?.message || err);
  }

  console.log('\n✨ Seeding process finished.\n');
}

main().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
