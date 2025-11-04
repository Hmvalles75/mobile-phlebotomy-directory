/**
 * Auto-deploy script - commits provider changes and pushes to trigger deployment
 * This runs after a provider is approved in the admin dashboard
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} complete`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting auto-deployment process...\n');

  // Check if there are changes to commit
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!status.trim()) {
      console.log('✅ No changes to commit. Exiting.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Failed to check git status:', error.message);
    process.exit(1);
  }

  // Stage provider files
  if (!run('git add cleaned_providers.csv data/providers.json public/data/providers.json', 'Staging provider files')) {
    process.exit(1);
  }

  // Create commit with timestamp
  const timestamp = new Date().toISOString();
  const commitMessage = `Auto-deploy: Add approved provider(s)

Provider(s) approved via admin dashboard.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

  if (!run(`git commit -m "${commitMessage}"`, 'Creating commit')) {
    console.log('⚠️  No changes to commit or commit failed');
  }

  // Push to remote
  if (!run('git push', 'Pushing to remote')) {
    console.error('❌ Failed to push to remote. You may need to push manually.');
    process.exit(1);
  }

  console.log('\n✅ Auto-deployment complete! Your changes will be live shortly.');
}

main();
