const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');

const FRONTEND_DIR = path.resolve('I:/call-app/calling-app-frontend');
const BACKEND_DIR = path.resolve('I:/call-app/caller-app-backned');

console.log('=== STEP 1: AST Parsing of All Frontend JS/JSX/TS/TSX Files ===');
function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.expo' || file === '.next' || file === 'android' || file === '.git') continue;
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
console.log(`Frontend Files Parsed: ${frontendFiles.length}, Errors: ${parseErrors}`);

console.log('\n=== STEP 2: Verifying 13 Primary Statuses in Frontend & Backend ===');
const EXPECTED_STATUSES = [
  'New', 'Contacted', 'Interested', 'Follow-up Required',
  'Qualified', 'Demo Scheduled', 'Payment Pending', 'Converted',
  'Not Interested', 'Lost', 'Wrong Number', 'Busy', 'Call Not Connected'
];

// Check Lead.js in backend
const leadModelContent = fs.readFileSync(path.join(BACKEND_DIR, 'models/Lead.js'), 'utf8');
const missingStatusesInBackend = EXPECTED_STATUSES.filter(s => !leadModelContent.includes(s));
console.log('Backend Lead.js missing statuses:', missingStatusesInBackend.length === 0 ? 'NONE (ALL 13 PRESENT)' : missingStatusesInBackend);

// Check CallModal.js and lead/[id].js in frontend
const callModalContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/CallModal.js'), 'utf8');
const leadDetailContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/lead/[id].js'), 'utf8');

const missingInCallModal = EXPECTED_STATUSES.filter(s => !callModalContent.includes(s));
const missingInLeadDetail = EXPECTED_STATUSES.filter(s => !leadDetailContent.includes(s));
console.log('CallModal.js missing statuses:', missingInCallModal.length === 0 ? 'NONE (ALL 13 PRESENT)' : missingInCallModal);
console.log('lead/[id].js missing statuses:', missingInLeadDetail.length === 0 ? 'NONE (ALL 13 PRESENT)' : missingInLeadDetail);

console.log('\n=== STEP 3: Verifying 10 Call Dispositions ===');
const EXPECTED_DISPOSITIONS = [
  'Connected', 'Callback requested', 'No answer', 'Switched off',
  'Busy', 'Price issue', 'Timing issue', 'Family approval',
  'Already bought', 'Not eligible'
];

const missingDispCallModal = EXPECTED_DISPOSITIONS.filter(d => !callModalContent.includes(d));
const missingDispLeadDetail = EXPECTED_DISPOSITIONS.filter(d => !leadDetailContent.includes(d));
console.log('CallModal.js missing dispositions:', missingDispCallModal.length === 0 ? 'NONE (ALL 10 PRESENT)' : missingDispCallModal);
console.log('lead/[id].js missing dispositions:', missingDispLeadDetail.length === 0 ? 'NONE (ALL 10 PRESENT)' : missingDispLeadDetail);

console.log('\n=== STEP 4: Verifying 1-Screen Lead Workspace Capabilities ===');
const leadWorkSpaceChecks = {
  hasCallButton: leadDetailContent.includes('Linking.openURL') && leadDetailContent.includes('tel:'),
  hasWhatsAppTemplates: leadDetailContent.includes('whatsapp') && leadDetailContent.includes('Namaste'),
  hasDocumentUpload: leadDetailContent.includes('expo-document-picker') && leadDetailContent.includes('/upload-file'),
  hasMandatoryRemarks: leadDetailContent.includes('Remarks are mandatory') || leadDetailContent.includes('remarks.trim()'),
  hasFollowUpScheduling: leadDetailContent.includes('SimpleCalendarModal') && leadDetailContent.includes('next_followup_date'),
  hasTimeline: leadDetailContent.includes('Timeline'),
  hasCallTimer: leadDetailContent.includes('callStartTime') || leadDetailContent.includes('callDuration'),
};
console.log('1-Screen Workspace checks:', leadWorkSpaceChecks);

console.log('\n=== STEP 5: Verifying Telecaller Dashboard KPIs ===');
const dashboardContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/(telecaller)/dashboard.js'), 'utf8');
const dashboardChecks = {
  hasTodaysAssigned: dashboardContent.includes('Today\'s Assigned') || dashboardContent.includes('todayAssigned') || dashboardContent.includes('assigned'),
  hasNewUncontacted: dashboardContent.includes('New / Uncontacted') || dashboardContent.includes('freshLeads') || dashboardContent.includes('uncontacted'),
  hasTodaysFollowups: dashboardContent.includes('Today\'s Follow-ups') || dashboardContent.includes('todayFollowups'),
  hasOverdueFollowups: dashboardContent.includes('Overdue') || dashboardContent.includes('overdueFollowups'),
  hasConnectedCalls: dashboardContent.includes('Connected') || dashboardContent.includes('connectedCalls'),
  hasInterestedLeads: dashboardContent.includes('Interested'),
  hasConvertedLeads: dashboardContent.includes('Converted'),
  hasLostLeads: dashboardContent.includes('Lost'),
  hasTargetProgressBar: dashboardContent.includes('Daily Calling Target') || dashboardContent.includes('targetPercentage') || dashboardContent.includes('daily_call_target'),
  hasConversionRate: dashboardContent.includes('Conversion') || dashboardContent.includes('conversionRate'),
};
console.log('Telecaller Dashboard checks:', dashboardChecks);

console.log('\n=== STEP 6: Verifying 3-Role RBAC & Routing Architecture ===');
const rootLayoutContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/_layout.js'), 'utf8');
const userModelContent = fs.readFileSync(path.join(BACKEND_DIR, 'models/User.js'), 'utf8');
const teamModelContent = fs.readFileSync(path.join(BACKEND_DIR, 'models/Team.js'), 'utf8');

const rbacChecks = {
  backendUserRoles: ['admin', 'team_leader', 'telecaller'].every(r => userModelContent.includes(r)),
  backendTeamHierarchy: teamModelContent.includes('team_leader') && teamModelContent.includes('members'),
  frontendRoleRedirection: rootLayoutContent.includes('(admin)') && rootLayoutContent.includes('(telecaller)'),
  frontendRoleGuard: rootLayoutContent.includes('user.role') || rootLayoutContent.includes('role ==='),
};
console.log('RBAC Architecture checks:', rbacChecks);

console.log('\n=== STEP 7: Verifying CI/CD & Build Configuration ===');
const easConfigExists = fs.existsSync(path.join(FRONTEND_DIR, 'eas.json'));
const buildAndroidYmlExists = fs.existsSync(path.join(FRONTEND_DIR, '.github/workflows/build-android.yml'));
const easBuildYmlExists = fs.existsSync(path.join(FRONTEND_DIR, '.github/workflows/eas-build.yml'));
const existingApkExists = fs.existsSync(path.join(FRONTEND_DIR, 'android/app/build/outputs/apk/release/app-release.apk'));

console.log('Build configs:', {
  easJson: easConfigExists,
  githubActionsBuildAndroid: buildAndroidYmlExists,
  githubActionsEasBuild: easBuildYmlExists,
  compiledReleaseApk: existingApkExists
});
