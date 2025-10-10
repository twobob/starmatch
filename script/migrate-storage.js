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
})();
