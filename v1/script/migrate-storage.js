// Migration script to recover old records from astro_records_v1
(function migrateOldRecords() {
  const oldKey = 'astro_records_v1';
  const newKey = 'starmatch_records';
  
  const oldData = localStorage.getItem(oldKey);
  const newData = localStorage.getItem(newKey);
  
  if (oldData && !newData) {
    // Migrate old data to new key
    console.log('Migrating records from astro_records_v1 to starmatch_records');
    localStorage.setItem(newKey, oldData);
    console.log('Migration complete');
  }
  
  // Migrate rulershipSet -> traditionalFactors in existing records
  try {
    const currentData = localStorage.getItem(newKey);
    if (currentData) {
      const records = JSON.parse(currentData);
      let migrated = false;
      
      records.forEach(record => {
        if (record.hasOwnProperty('rulershipSet')) {
          record.traditionalFactors = record.rulershipSet;
          delete record.rulershipSet;
          migrated = true;
        }
      });
      
      if (migrated) {
        localStorage.setItem(newKey, JSON.stringify(records));
        console.log('Migrated rulershipSet -> traditionalFactors in stored records');
      }
    }
  } catch (e) {
    console.error('Error migrating rulershipSet field:', e);
  }
})();
