/**
 * Migration script to add default carrier "SITC" to all DTHC records without a carrier
 * Run this script once to update existing data
 */

import { supabase, TABLES } from '../lib/supabase';

async function migrateDTHCCarrier() {
  console.log('🚀 Starting DTHC carrier migration...');
  
  try {
    // Fetch all DTHC records using the correct table name
    const { data: dthcRecords, error: fetchError } = await supabase
      .from(TABLES.DTHC)
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching DTHC records:', fetchError);
      return;
    }

    if (!dthcRecords || dthcRecords.length === 0) {
      console.log('ℹ️ No DTHC records found');
      return;
    }

    console.log(`📊 Found ${dthcRecords.length} DTHC records`);

    // Filter records without carrier or with null/empty carrier
    const recordsToUpdate = dthcRecords.filter(
      record => !record.carrier || record.carrier === '' || record.carrier === null
    );

    console.log(`🔄 ${recordsToUpdate.length} records need carrier update`);

    if (recordsToUpdate.length === 0) {
      console.log('✅ All records already have carrier values');
      return;
    }

    // Update each record to set carrier to "SITC"
    let successCount = 0;
    let errorCount = 0;

    for (const record of recordsToUpdate) {
      const { error: updateError } = await supabase
        .from(TABLES.DTHC)
        .update({ carrier: 'SITC' })
        .eq('id', record.id);

      if (updateError) {
        console.error(`❌ Error updating record ${record.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`✅ Updated record ${record.id}: agent=${record.agent}, pol=${record.pol}, pod=${record.pod}`);
        successCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${successCount} records`);
    console.log(`❌ Failed updates: ${errorCount} records`);
    console.log(`📝 Total processed: ${recordsToUpdate.length} records`);
    
    if (successCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 All DTHC records without carrier now have "SITC" as default carrier');
    }

  } catch (error) {
    console.error('❌ Migration failed with error:', error);
  }
}

// Run the migration
migrateDTHCCarrier();