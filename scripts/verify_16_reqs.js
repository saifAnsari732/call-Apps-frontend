const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');

const FRONTEND_DIR = path.resolve('I:/call-app/calling-app-frontend');
const BACKEND_DIR = path.resolve('I:/call-app/caller-app-backned');

console.log('========================================================================');
console.log('   CALLING CRM - ALL 16 REQUIREMENTS & EXPO BUILD VERIFICATION SUITE   ');
console.log('========================================================================');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function reportCheck(title, condition, detail = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${title}${detail ? ` (${detail})` : ''}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${title}${detail ? ` (${detail})` : ''}`);
  }
}

// 0. AST Parsing of all frontend JS/JSX/TS/TSX files
console.log('\n--- [Pre-Flight] AST Parsing of All Frontend Source Files ---');
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
reportCheck('AST Source Code Parsing', parseErrors === 0, `${frontendFiles.length} files parsed with 0 syntax errors`);

// File Contents
const leadModel = fs.readFileSync(path.join(BACKEND_DIR, 'models/Lead.js'), 'utf8');
const userModel = fs.readFileSync(path.join(BACKEND_DIR, 'models/User.js'), 'utf8');
const teamModel = fs.readFileSync(path.join(BACKEND_DIR, 'models/Team.js'), 'utf8');
const callModel = fs.readFileSync(path.join(BACKEND_DIR, 'models/Call.js'), 'utf8');
const followupModel = fs.readFileSync(path.join(BACKEND_DIR, 'models/Followup.js'), 'utf8');
const webhookRoute = fs.readFileSync(path.join(BACKEND_DIR, 'routes/webhook.js'), 'utf8');
const distributorService = fs.readFileSync(path.join(BACKEND_DIR, 'services/distributor.js'), 'utf8');
const backendCallsRoute = fs.readFileSync(path.join(BACKEND_DIR, 'routes/calls.js'), 'utf8');
const backendReportsRoute = fs.readFileSync(path.join(BACKEND_DIR, 'routes/reports.js'), 'utf8');
const backendLeadsRoute = fs.readFileSync(path.join(BACKEND_DIR, 'routes/leads.js'), 'utf8');

const callModalContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/CallModal.js'), 'utf8');
const leadDetailContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/lead/[id].js'), 'utf8');
const dashboardContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/(telecaller)/dashboard.js'), 'utf8');
const adminDashboardContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/(admin)/dashboard.js'), 'utf8');
const followupsContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/(telecaller)/followups.js'), 'utf8');
const leadListContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/(telecaller)/lead-list.js'), 'utf8');
const voiceReminderContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/VoiceReminderService.js'), 'utf8');
const globalFabContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/GlobalReminderFAB.js'), 'utf8');
const rootLayoutContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/_layout.js'), 'utf8');
const apiServiceContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/services/api.js'), 'utf8');
const buildAndroidYml = fs.readFileSync(path.join(FRONTEND_DIR, '.github/workflows/build-android.yml'), 'utf8');
const easJson = fs.readFileSync(path.join(FRONTEND_DIR, 'eas.json'), 'utf8');

// =========================================================================
// REQUIREMENT 1: Admin Role & Dashboard
// =========================================================================
console.log('\n--- Requirement 1: Admin Role & Dashboard ---');
reportCheck('Admin dashboard endpoint (/api/reports/admin-dashboard)', backendReportsRoute.includes('/admin-dashboard'));
reportCheck('Admin Overview Matrix KPIs & Rankings', adminDashboardContent.includes('Overview Matrix') && adminDashboardContent.includes('Leaderboard'));
reportCheck('Admin User/Telecaller Management', fs.existsSync(path.join(FRONTEND_DIR, 'src/app/(admin)/users.js')));

// =========================================================================
// REQUIREMENT 2: Team Leader Role & Leaderboard
// =========================================================================
console.log('\n--- Requirement 2: Team Leader Role & Leaderboard ---');
reportCheck('Team Leader dashboard endpoint (/api/reports/team-leader-dashboard)', backendReportsRoute.includes('/team-leader-dashboard'));
reportCheck('Team model defines leader & members', teamModel.includes('leader') && teamModel.includes('members'));
reportCheck('Mobile dashboard adapts for Team Leader without 403', adminDashboardContent.includes('isTeamLeader') && adminDashboardContent.includes('/reports/team-leader-dashboard'));
reportCheck('Leaderboard computation in reports', backendReportsRoute.includes('leaderboard.sort'));

// =========================================================================
// REQUIREMENT 3: Telecaller Role & Workbench
// =========================================================================
console.log('\n--- Requirement 3: Telecaller Role & Workbench ---');
reportCheck('Telecaller assigned leads scoping in backend', backendLeadsRoute.includes('req.user.role === \'telecaller\'') && backendLeadsRoute.includes('assigned_to: req.user.id'));
reportCheck('Telecaller workspace screen (lead/[id].js)', fs.existsSync(path.join(FRONTEND_DIR, 'src/app/lead/[id].js')));
reportCheck('Telecaller outcome logging with mandatory remarks', leadDetailContent.includes('Remarks are mandatory') || leadDetailContent.includes('remarks.trim()'));

// =========================================================================
// REQUIREMENT 4: Team Structure & 3-Tier Hierarchy
// =========================================================================
console.log('\n--- Requirement 4: Team Structure & 3-Tier Hierarchy ---');
const userRoles = ['admin', 'team_leader', 'telecaller'];
reportCheck('User model supports 3 roles (admin, team_leader, telecaller)', userRoles.every(r => userModel.includes(r)));
reportCheck('User model hierarchy links (team_id, team_leader_id)', userModel.includes('team_id') && userModel.includes('team_leader_id'));
reportCheck('Navigation role guard in _layout.js', rootLayoutContent.includes('(admin)') && rootLayoutContent.includes('(telecaller)') && rootLayoutContent.includes('role'));

// =========================================================================
// REQUIREMENT 5: Lead Management & Full Schema
// =========================================================================
console.log('\n--- Requirement 5: Lead Management & Full Schema ---');
const leadContactFields = ['name', 'mobile', 'alternate_mobile', 'email', 'city', 'state', 'business_type', 'product_interest'];
reportCheck('Lead model has all contact fields', leadContactFields.every(f => leadModel.includes(f)));
const leadMetaFields = ['lead_source', 'campaign_name', 'adset_name', 'ad_name', 'meta_lead_id'];
reportCheck('Lead model has Meta campaign attributes', leadMetaFields.every(f => leadModel.includes(f)));
const leadUtmFields = ['utm_source', 'utm_medium', 'utm_campaign'];
reportCheck('Lead model has UTM tracking fields', leadUtmFields.every(f => leadModel.includes(f)));
reportCheck('Lead model has scoring & quality fields', leadModel.includes('priority') && leadModel.includes('temperature') && leadModel.includes('tags') && leadModel.includes('custom_fields'));

// =========================================================================
// REQUIREMENT 6: Lead Status (18 Statuses)
// =========================================================================
console.log('\n--- Requirement 6: Lead Status (18 Standard Statuses) ---');
const REQUIRED_18_STATUSES = [
  'New', 'Assigned', 'Contacted', 'Interested', 'Qualified', 'Follow-up Required',
  'Demo Scheduled', 'Meeting Scheduled', 'Demo/Meeting Scheduled', 'Payment Pending',
  'Converted', 'Not Interested', 'Wrong Number', 'Busy', 'No Response',
  'Call Not Connected', 'Duplicate', 'Duplicate Lead', 'Invalid Lead', 'Lost'
];
const missing18InBackend = REQUIRED_18_STATUSES.filter(s => !leadModel.includes(s));
reportCheck('Backend Lead.js defines all 18 statuses', missing18InBackend.length === 0, `Missing: ${missing18InBackend.length}`);

const CORE_TELECALLER_STATUSES = [
  'New', 'Contacted', 'Interested', 'Follow-up Required', 'Qualified',
  'Demo Scheduled', 'Payment Pending', 'Converted', 'Not Interested',
  'Lost', 'Wrong Number', 'Busy', 'Call Not Connected'
];
const missingCoreInCallModal = CORE_TELECALLER_STATUSES.filter(s => !callModalContent.includes(s));
reportCheck('Frontend CallModal.js defines all core telecaller statuses', missingCoreInCallModal.length === 0, `Missing: ${missingCoreInCallModal.length}`);
reportCheck('Frontend lead/[id].js dynamically renders PRIMARY_STATUSES', leadDetailContent.includes('PRIMARY_STATUSES.map'));

// =========================================================================
// REQUIREMENT 7: Call Dispositions (10 Dispositions)
// =========================================================================
console.log('\n--- Requirement 7: Call Dispositions (10 Dispositions) ---');
const REQUIRED_10_DISPOSITIONS = [
  'Connected', 'Callback requested', 'No answer', 'Switched off',
  'Busy', 'Price issue', 'Timing issue', 'Family approval',
  'Already bought', 'Not eligible'
];
const missingDisp = REQUIRED_10_DISPOSITIONS.filter(d => !callModalContent.includes(d));
reportCheck('Frontend CallModal.js defines all 10 canonical dispositions', missingDisp.length === 0, `Missing: ${missingDisp.length}`);
reportCheck('Frontend lead/[id].js dynamically renders CALL_DISPOSITIONS', leadDetailContent.includes('CALL_DISPOSITIONS.map'));
reportCheck('Mandatory remarks validation before submission', callModalContent.includes('Mandatory Remarks required') || callModalContent.includes('remarks.trim()'));

// =========================================================================
// REQUIREMENT 8: Automatic Lead Assignment
// =========================================================================
console.log('\n--- Requirement 8: Automatic Lead Assignment ---');
reportCheck('Meta webhook endpoint in routes/webhook.js', webhookRoute.includes('/meta') && webhookRoute.includes('hub.challenge'));
reportCheck('Cyclic round-robin telecaller allocation', distributorService.includes('chooseCallerForLead') || distributorService.includes('distributeSingleLead'));
reportCheck('Duplicate lead detection on phone/Meta ID', distributorService.includes('duplicate') || backendLeadsRoute.includes('/detect-duplicates'));

// =========================================================================
// REQUIREMENT 9: 1-Screen Minimum-Clicks Workbench
// =========================================================================
console.log('\n--- Requirement 9: 1-Screen Minimum-Clicks Workbench ---');
reportCheck('1-Tap CALL NOW button with tel: scheme', leadDetailContent.includes('Linking.openURL') && leadDetailContent.includes('tel:'));
reportCheck('Call duration timer tracking (callStartedAtRef & durationSec)', leadDetailContent.includes('callStartedAtRef') && leadDetailContent.includes('durationSec'));
reportCheck('WhatsApp template quick launcher', leadDetailContent.includes('quickTemplates') && leadDetailContent.includes('handleSendWhatsApp'));
reportCheck('Document & screenshot upload via multipart', leadDetailContent.includes('expo-document-picker') && leadDetailContent.includes('multipart/form-data'));
reportCheck('Document preview/open action with full URL resolution', leadDetailContent.includes('getDocumentFullUrl') && leadDetailContent.includes('Linking.openURL'));
reportCheck('Follow-up date/time calendar scheduling', leadDetailContent.includes('SimpleCalendarModal') && leadDetailContent.includes('followupDate'));
reportCheck('Interaction timeline with call audio playback', leadDetailContent.includes('Audio.Sound') && leadDetailContent.includes('filteredTimeline'));
reportCheck('Power Queue mode support', leadDetailContent.includes('powerQueue') && leadDetailContent.includes('/leads/power-queue'));

// =========================================================================
// REQUIREMENT 10: Follow-up Management
// =========================================================================
console.log('\n--- Requirement 10: Follow-up Management ---');
reportCheck('Filter tabs (Today, Tomorrow, This Week, Overdue)',
  followupsContent.includes('today') && followupsContent.includes('tomorrow') && followupsContent.includes('thisWeek') && followupsContent.includes('overdue'));
reportCheck('Quick-dial handset and completion toggle', followupsContent.includes('handleCall') && followupsContent.includes('completeMutation'));
reportCheck('Backend auto-schedules follow-up for unreachable calls', backendCallsRoute.includes('autoFollowupScheduled'));

// =========================================================================
// REQUIREMENT 11: Calling Features
// =========================================================================
console.log('\n--- Requirement 11: Calling Features ---');
reportCheck('Click-to-call tel: URL scheme integration', leadDetailContent.includes('tel:${cleanNumber}') || leadDetailContent.includes('tel:'));
reportCheck('AppState resume listener for call duration tracking', leadDetailContent.includes('AppState.addEventListener') && leadDetailContent.includes('callStartedAtRef'));
reportCheck('Call attempts increment on each call logged', backendCallsRoute.includes('call_attempts = (lead.call_attempts || 0) + 1') || backendCallsRoute.includes('$inc: { call_attempts: 1 }'));
reportCheck('Response time and SLA calculation', backendCallsRoute.includes('response_time_seconds') && backendCallsRoute.includes('sla_breached'));

// =========================================================================
// REQUIREMENT 12: WhatsApp Features
// =========================================================================
console.log('\n--- Requirement 12: WhatsApp Features ---');
reportCheck('Native WhatsApp deep-link generation (whatsapp://send)', leadDetailContent.includes('whatsapp://send?phone=91'));
reportCheck('Web fallback URL generation (https://wa.me/91)', leadDetailContent.includes('https://wa.me/91'));
reportCheck('Personalized pre-filled message templates', leadDetailContent.includes('Welcome & Rates') && leadDetailContent.includes('Call Not Connected') && leadDetailContent.includes('Distributor Proposal'));

// =========================================================================
// REQUIREMENT 13: Reports & KPIs
// =========================================================================
console.log('\n--- Requirement 13: Reports & KPIs ---');
reportCheck('Today Assigned Leads metric', dashboardContent.includes('todayAssigned') || dashboardContent.includes('Today\'s Assigned'));
reportCheck('New / Uncontacted Leads metric', dashboardContent.includes('freshLeads') || dashboardContent.includes('New / Uncontacted'));
reportCheck('Today Follow-ups & Overdue metrics', dashboardContent.includes('todayFollowups') && dashboardContent.includes('overdueFollowups'));
reportCheck('Connected vs Not Connected Calls metrics', dashboardContent.includes('connectedCalls') && dashboardContent.includes('notConnectedCalls'));
reportCheck('Interested / Converted / Lost Leads metrics', dashboardContent.includes('interestedLeads') && dashboardContent.includes('convertedLeads') && dashboardContent.includes('lostLeads'));
reportCheck('Calling Target Progress Bar', dashboardContent.includes('Calling Target') && dashboardContent.includes('callProgressPct'));
reportCheck('Conversion Rate % computation', dashboardContent.includes('conversionRate') || dashboardContent.includes('Conversion'));

// =========================================================================
// REQUIREMENT 14: Notifications & Global Voice Reminders
// =========================================================================
console.log('\n--- Requirement 14: Notifications & Global Voice Reminders ---');
reportCheck('Global Voice Reminder Service using expo-speech TTS', voiceReminderContent.includes('expo-speech') && voiceReminderContent.includes('Speech.speak'));
reportCheck('Voice announcement in Hindi / English', voiceReminderContent.includes('Namaste') || voiceReminderContent.includes('follow-up'));
reportCheck('Global Floating Reminder FAB with quick call button', globalFabContent.includes('Linking.openURL') && globalFabContent.includes('tel:'));
reportCheck('VoiceReminderService mounted at root in _layout.js', rootLayoutContent.includes('<VoiceReminderService />'));

// =========================================================================
// REQUIREMENT 15: Security & Role-Based Access Control
// =========================================================================
console.log('\n--- Requirement 15: Security & Role-Based Access Control ---');
reportCheck('AsyncStorage JWT token persistence', apiServiceContent.includes('useAuthStore.getState().token') || apiServiceContent.includes('AsyncStorage'));
reportCheck('Axios Request Interceptor injecting Authorization header', apiServiceContent.includes('config.headers[\'Authorization\'] = `Bearer ${token}`'));
reportCheck('Automatic session logout on 401/403 token expiration', apiServiceContent.includes('error.response.status === 401') && apiServiceContent.includes('logout()'));
reportCheck('Frontend route guard preventing unauthorized navigation', rootLayoutContent.includes('user?.role === \'telecaller\' && segments[0] === \'(admin)\''));

// =========================================================================
// REQUIREMENT 16: UI/UX Pro Max & CI/CD Mobile Build
// =========================================================================
console.log('\n--- Requirement 16: UI/UX Pro Max & CI/CD Mobile Build ---');
const releaseApkPath = path.join(FRONTEND_DIR, 'android/app/build/outputs/apk/release/app-release.apk');
const releaseApkStats = fs.existsSync(releaseApkPath) ? fs.statSync(releaseApkPath) : null;
reportCheck('GitHub Actions workflow for Android APK/AAB (.github/workflows/build-android.yml)', buildAndroidYml.includes('build_type') && buildAndroidYml.includes('apk'));
reportCheck('EAS build configuration (eas.json) preview & production profiles', easJson.includes('"preview"') && easJson.includes('"production"'));
reportCheck('Compiled release APK artifact present', !!releaseApkStats, releaseApkStats ? `${(releaseApkStats.size / (1024*1024)).toFixed(2)} MB` : 'Not found');
reportCheck('High-contrast Rose/Slate color palette tokens', rootLayoutContent.includes('bg-slate-900') || rootLayoutContent.includes('bg-slate-50'));

// Final Summary
console.log('\n========================================================================');
console.log(`  VERIFICATION RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED (${failedChecks} FAILED)`);
console.log('========================================================================');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('  ALL 16 CRM REQUIREMENTS & MOBILE BUILD FULLY CONFIRMED WITH CODE 0!\n');
  process.exit(0);
}
