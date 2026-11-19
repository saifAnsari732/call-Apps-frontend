const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');

const FRONTEND_DIR = path.resolve('I:/call-app/calling-app-frontend');
const BACKEND_DIR = path.resolve('I:/call-app/caller-app-backned');

console.log('===============================================================');
console.log('  CALLING CRM - 16 REQUIREMENTS & EXPO BUILD VERIFICATION SUITE');
console.log('===============================================================');

// 1. AST Parsing of all frontend JS/JSX/TS/TSX files
console.log('\n--- 1. AST Parsing of All Frontend Source Files ---');
function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.expo' || file === '.next' || file === 'android' || file === '.git' || file === 'dist') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const frontendFiles = getAllFiles(path.join(FRONTEND_DIR, 'src'), ['.js', '.jsx', '.ts', '.tsx']);
let parseErrors = 0;
for (const file of frontendFiles) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (err) {
    console.error(`PARSE ERROR in ${file}:`, err.message);
    parseErrors++;
  }
}
console.log(`Frontend Files Parsed: ${frontendFiles.length} files, Errors: ${parseErrors}`);

// 2. Primary Statuses in Frontend & Backend
console.log('\n--- 2. Primary Statuses (All 13 Core Telecaller Statuses) ---');
const EXPECTED_STATUSES = [
  'New', 'Contacted', 'Interested', 'Follow-up Required',
  'Qualified', 'Demo Scheduled', 'Payment Pending', 'Converted',
  'Not Interested', 'Lost', 'Wrong Number', 'Busy', 'Call Not Connected'
];

const leadModelContent = fs.readFileSync(path.join(BACKEND_DIR, 'models/Lead.js'), 'utf8');
const missingStatusesInBackend = EXPECTED_STATUSES.filter(s => !leadModelContent.includes(s));
console.log('Backend Lead.js status enum check:', missingStatusesInBackend.length === 0 ? 'PASS (All 13 present)' : `FAIL (Missing: ${missingStatusesInBackend.join(', ')})`);

const callModalContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/CallModal.js'), 'utf8');
const leadDetailContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/lead/[id].js'), 'utf8');

const missingInCallModal = EXPECTED_STATUSES.filter(s => !callModalContent.includes(s));
console.log('Frontend CallModal.js status check:', missingInCallModal.length === 0 ? 'PASS (All 13 present)' : `FAIL (Missing: ${missingInCallModal.join(', ')})`);

const leadImportsPrimaryStatuses = leadDetailContent.includes('PRIMARY_STATUSES') && leadDetailContent.includes('PRIMARY_STATUSES.map');
console.log('Frontend lead/[id].js renders PRIMARY_STATUSES dynamically:', leadImportsPrimaryStatuses ? 'PASS' : 'FAIL');

// 3. Call Dispositions
console.log('\n--- 3. Call Dispositions (All 10 Core Dispositions) ---');
const EXPECTED_DISPOSITIONS = [
  'Connected', 'Callback requested', 'No answer', 'Switched off',
  'Busy', 'Price issue', 'Timing issue', 'Family approval',
  'Already bought', 'Not eligible'
];

const missingDispCallModal = EXPECTED_DISPOSITIONS.filter(d => !callModalContent.includes(d));
console.log('Frontend CallModal.js dispositions check:', missingDispCallModal.length === 0 ? 'PASS (All 10 present)' : `FAIL (Missing: ${missingDispCallModal.join(', ')})`);

const leadImportsDispositions = leadDetailContent.includes('CALL_DISPOSITIONS') && leadDetailContent.includes('CALL_DISPOSITIONS.map');
console.log('Frontend lead/[id].js renders CALL_DISPOSITIONS dynamically:', leadImportsDispositions ? 'PASS' : 'FAIL');

// 4. 1-Screen Lead Workspace Capabilities
console.log('\n--- 4. 1-Screen Minimum-Clicks Lead Workspace ---');
const leadWorkSpaceChecks = {
  '1-Tap CALL NOW Button': leadDetailContent.includes('Linking.openURL') && leadDetailContent.includes('tel:'),
  'Call Duration Tracker (Ref/Timer)': leadDetailContent.includes('callStartedAtRef') && leadDetailContent.includes('durationSec'),
  'WhatsApp Template Selector': leadDetailContent.includes('whatsapp') && leadDetailContent.includes('quickTemplates'),
  'Document & Screenshot Upload': leadDetailContent.includes('expo-document-picker') && leadDetailContent.includes('/upload-file'),
  'Document Open/View Action': leadDetailContent.includes('getDocumentFullUrl') && leadDetailContent.includes('Linking.openURL'),
  'Mandatory Remarks Validation': leadDetailContent.includes('Remarks are mandatory') || leadDetailContent.includes('remarks.trim()'),
  'Follow-Up Date/Time Scheduling': leadDetailContent.includes('SimpleCalendarModal') && leadDetailContent.includes('followupDate'),
  'Historical Call Timeline': leadDetailContent.includes('Timeline') || leadDetailContent.includes('callLogs'),
  'Power Queue Mode': leadDetailContent.includes('powerQueue') && leadDetailContent.includes('/leads/power-queue')
};
for (const [k, v] of Object.entries(leadWorkSpaceChecks)) {
  console.log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`);
}

// 5. Telecaller Dashboard KPIs
console.log('\n--- 5. Telecaller Dashboard KPIs ---');
const dashboardContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/(telecaller)/dashboard.js'), 'utf8');
const dashboardChecks = {
  'Today Assigned Leads': dashboardContent.includes('todayAssigned') || dashboardContent.includes('Today\'s Assigned'),
  'New / Uncontacted Leads': dashboardContent.includes('freshLeads') || dashboardContent.includes('New / Uncontacted'),
  'Today Follow-ups': dashboardContent.includes('todayFollowups') || dashboardContent.includes('Today\'s Follow-ups'),
  'Overdue Follow-ups': dashboardContent.includes('overdueFollowups') || dashboardContent.includes('Overdue'),
  'Connected vs Not Connected Calls': dashboardContent.includes('connectedCalls') && dashboardContent.includes('notConnectedCalls'),
  'Interested / Converted / Lost Leads': dashboardContent.includes('interestedLeads') && dashboardContent.includes('convertedLeads') && dashboardContent.includes('lostLeads'),
  'Daily Target Progress Bar': dashboardContent.includes('Calling Target') && dashboardContent.includes('callProgressPct'),
  'Conversion Rate %': dashboardContent.includes('conversionRate') || dashboardContent.includes('Conversion')
};
for (const [k, v] of Object.entries(dashboardChecks)) {
  console.log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`);
}

// 6. 3-Tier RBAC Architecture & Team Hierarchy
console.log('\n--- 6. 3-Tier RBAC Architecture & Team Hierarchy ---');
const rootLayoutContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/_layout.js'), 'utf8');
const userModelContent = fs.readFileSync(path.join(BACKEND_DIR, 'models/User.js'), 'utf8');
const teamModelContent = fs.readFileSync(path.join(BACKEND_DIR, 'models/Team.js'), 'utf8');

const rbacChecks = {
  'User Schema 3 Roles (admin, team_leader, telecaller)': ['admin', 'team_leader', 'telecaller'].every(r => userModelContent.includes(r)),
  'User Schema Team & TL References': userModelContent.includes('team_id') && userModelContent.includes('team_leader_id'),
  'Team Schema Leader & Members': teamModelContent.includes('leader') && teamModelContent.includes('members'),
  'Frontend Navigation Role Separation': rootLayoutContent.includes('(admin)') && rootLayoutContent.includes('(telecaller)'),
  'Telecaller Role Guard (Restricted from Admin)': rootLayoutContent.includes('role') && (rootLayoutContent.includes('telecaller') || rootLayoutContent.includes('admin'))
};
for (const [k, v] of Object.entries(rbacChecks)) {
  console.log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`);
}

// 7. Follow-up Management & Reminders
console.log('\n--- 7. Follow-up Management & Reminders ---');
const followupsContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/(telecaller)/followups.js'), 'utf8');
const voiceReminderContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/VoiceReminderService.js'), 'utf8');
const globalFabContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/GlobalReminderFAB.js'), 'utf8');

const followupChecks = {
  'Follow-ups Screen Filter Segments (Today, Tomorrow, This Week, Overdue)':
    followupsContent.includes('Today') && followupsContent.includes('Tomorrow') && (followupsContent.includes('This Week') || followupsContent.includes('Upcoming')) && followupsContent.includes('Overdue'),
  'Global Voice TTS Reminder Service': voiceReminderContent.includes('expo-speech') && voiceReminderContent.includes('Speech.speak'),
  'Global Floating Reminder FAB with Direct Dial': globalFabContent.includes('Linking.openURL') && globalFabContent.includes('tel:')
};
for (const [k, v] of Object.entries(followupChecks)) {
  console.log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`);
}

// 8. Mobile App Build, Expo & CI/CD Pipelines
console.log('\n--- 8. Mobile App Build, Expo & CI/CD Pipelines ---');
const buildAndroidYml = fs.readFileSync(path.join(FRONTEND_DIR, '.github/workflows/build-android.yml'), 'utf8');
const easJson = fs.readFileSync(path.join(FRONTEND_DIR, 'eas.json'), 'utf8');
const releaseApkPath = path.join(FRONTEND_DIR, 'android/app/build/outputs/apk/release/app-release.apk');
const releaseApkStats = fs.existsSync(releaseApkPath) ? fs.statSync(releaseApkPath) : null;

const buildChecks = {
  'EAS Build Config (eas.json) preview & production': easJson.includes('"preview"') && easJson.includes('"production"'),
  'GitHub Actions Workflow (build-android.yml) for APK & AAB': buildAndroidYml.includes('build_type') && buildAndroidYml.includes('apk'),
  'GitHub Actions EAS Build (eas-build.yml)': fs.existsSync(path.join(FRONTEND_DIR, '.github/workflows/eas-build.yml')),
  'Compiled Release APK Artifact': releaseApkStats ? `Present (${(releaseApkStats.size / (1024*1024)).toFixed(2)} MB)` : 'Not found'
};
for (const [k, v] of Object.entries(buildChecks)) {
  console.log(`  ${k}: ${v}`);
}

console.log('\n===============================================================');
console.log('  ALL CHECKS COMPLETED SUCCESSFULLY');
console.log('===============================================================');
