import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { HindsightClient } from '@vectorize-io/hindsight-client';
import { getContactById } from '../lib/contacts';

async function resetJordan() {
  console.log('====================================================');
  console.log('🔄 RESETTING JORDAN REYES BANK (contact-jordan-reyes)');
  console.log('====================================================');

  const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';
  const apiKey =
    process.env.HINDSIGHT_API_KEY ||
    Buffer.from('aHNrXzI4ZWMwZTRlZGUzYTYwMjdlYWNjMmI0M2Y2ZjdjMjBkXzcxZGZmNjQyNTI2OGZmOTY=', 'base64').toString('utf-8');

  console.log(`📡 Connecting to Hindsight at: ${baseUrl}`);
  const client = new HindsightClient({
    baseUrl,
    apiKey,
  });

  const jordan = getContactById('jordan-reyes');
  if (!jordan) {
    throw new Error('Contact jordan-reyes not found in lib/contacts.ts');
  }

  const bankId = jordan.bankId; // "contact-jordan-reyes"

  // 1. Delete existing bank to eliminate all test artifacts, duplicate memories, and resolved docs
  console.log(`\n🗑️ Deleting bank "${bankId}" to purge test pollution and duplicate memories...`);
  try {
    await client.deleteBank(bankId);
    console.log(`  ✅ Successfully deleted bank "${bankId}".`);
  } catch (err: any) {
    console.log(`  ℹ️ Bank delete note: ${err?.message || 'Bank may not have existed yet'}`);
  }

  // Small delay to ensure deletion propagates cleanly
  await new Promise((r) => setTimeout(r, 1500));

  // 2. Re-create the bank fresh
  console.log(`\n✨ Recreating pristine bank "${bankId}"...`);
  try {
    await client.createBank(bankId, {
      name: `${jordan.name} - ${jordan.company}`,
      reflectMission: `Executive meeting preparation agent tracking relationship history, discussions, and unfulfilled commitments for ${jordan.name}.`,
    });
    console.log(`  ✅ Successfully created pristine bank "${bankId}".`);
  } catch (err: any) {
    console.log(`  ℹ️ Create bank note: ${err?.message || 'Proceeding to retain memories'}`);
  }

  // 3. Retain the exact 3 pristine meetings with deterministic IDs
  console.log(`\n🌱 Seeding pristine meetings for ${jordan.name}...`);
  for (const [idx, meeting] of jordan.meetings.entries()) {
    const documentId = `${bankId}-meeting-${idx + 1}`;
    console.log(`  ⏳ Retaining Meeting #${idx + 1} (${meeting.date}) [docId: ${documentId}]...`);
    try {
      await client.retain(bankId, meeting.content, {
        documentId,
        updateMode: 'replace',
        context: `Past Meeting (${meeting.date}): ${meeting.summary}`,
        timestamp: new Date(meeting.date).toISOString(),
      });
      console.log(`  ✅ Retained: "${meeting.summary}"`);
    } catch (err: any) {
      console.error(`  ❌ Failed to retain meeting #${idx + 1}:`, err?.message || err);
    }
  }

  // Small delay for consolidation
  console.log('\n⏳ Waiting 2 seconds for memory indexing...');
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Verify raw recall results
  console.log('\n====================================================');
  console.log('🔍 VERIFYING CLEAN RECALL ON JORDAN REYES');
  console.log('====================================================');
  const recallResult = await client.recall(
    bankId,
    'What outstanding commitments, technical docs, integration concerns, or pricing discussions occurred in past meetings with Jordan Reyes?',
    { budget: 'mid' }
  );

  const results = recallResult?.results || [];
  console.log(`\n📋 Total raw memories in bank: ${results.length}`);

  let foundOverdue = false;
  let foundResolvedPollution = false;

  results.forEach((r, idx) => {
    console.log(`\n[Memory #${idx + 1}]`);
    console.log(`Text: ${r.text}`);
    const lower = r.text.toLowerCase();
    if (lower.includes('not been sent') || lower.includes('overdue') || lower.includes('outstanding')) {
      foundOverdue = true;
    }
    if (lower.includes('technical doc delivered') || lower.includes('pricing agreed') || lower.includes('1790522756303')) {
      foundResolvedPollution = true;
    }
  });

  console.log('\n--- VERIFICATION AUDIT ---');
  console.log(`1. Overdue commitment detected: ${foundOverdue ? '✅ YES (Pristine)' : '❌ NO'}`);
  console.log(`2. Resolved test pollution detected: ${foundResolvedPollution ? '❌ YES (Pollution found!)' : '✅ NO (Clean)'}`);

  if (foundOverdue && !foundResolvedPollution) {
    console.log('\n🎉 SUCCESS: Jordan Reyes memory bank is completely restored to pristine demo state!\n');
  } else {
    console.warn('\n⚠️ Review recall results above.\n');
  }
}

resetJordan().catch((err) => {
  console.error('Fatal error resetting Jordan Reyes bank:', err);
  process.exit(1);
});
