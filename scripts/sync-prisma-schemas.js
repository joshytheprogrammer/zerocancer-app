#!/usr/bin/env node

/**
 * Schema Duplication Script for Edge/Compute Architecture
 * 
 * This script  // Ensure compute service prisma directory exists
  ensureDirectory(COMPUTE_PRISMA_DIR);

  // Get file stats for comparison
  const backendStats = getFileStats(BACKEND_SCHEMA);
  const computeStats = getFileStats(COMPUTE_SCHEMA);

  log(`📁 Backend schema: ${BACKEND_SCHEMA}`, colors.cyan);
  log(`📁 Compute service schema: ${COMPUTE_SCHEMA}`, colors.blue);

  // Check if files are already in sync
  if (fs.existsSync(COMPUTE_SCHEMA) && filesAreIdentical(BACKEND_SCHEMA, COMPUTE_SCHEMA)) {
    log('✅ Schemas are already identical!', colors.green);
    
    if (backendStats && computeStats) {
      log(`📅 Backend modified: ${backendStats.mtime.toISOString()}`, colors.cyan);
      log(`📅 Compute service modified: ${computeStats.mtime.toISOString()}`, colors.blue);
    }/backend and apps/compute-service have identical
 * Prisma schema files for consistent database types across deployments.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_SCHEMA = path.join(ROOT_DIR, "apps/backend/prisma/schema.prisma");
const COMPUTE_SCHEMA = path.join(
  ROOT_DIR,
  "apps/compute-service/prisma/schema.prisma"
);
const COMPUTE_PRISMA_DIR = path.join(ROOT_DIR, "apps/compute-service/prisma");

/**
 * Colors for console output
 */
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, colors.green);
  }
}

/**
 * Read file content with error handling
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    log(`Error reading file ${filePath}: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Write file content with error handling
 */
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  } catch (error) {
    log(`Error writing file ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Compare two files to check if they're identical
 */
function filesAreIdentical(file1Path, file2Path) {
  const content1 = readFile(file1Path);
  const content2 = readFile(file2Path);

  if (!content1 || !content2) return false;
  return content1 === content2;
}

/**
 * Get file modification time
 */
function getFileStats(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * Main synchronization function
 */
function syncSchemas() {
  log("🔄 Starting Prisma schema synchronization...", colors.cyan);

  // Check if backend schema exists
  if (!fs.existsSync(BACKEND_SCHEMA)) {
    log(`❌ Backend schema not found: ${BACKEND_SCHEMA}`, colors.red);
    log(
      "Please ensure the backend Prisma schema exists before running this script.",
      colors.yellow
    );
    process.exit(1);
  }

  // Ensure worker prisma directory exists
  ensureDirectory(WORKER_PRISMA_DIR);

  // Get file stats for comparison
  const backendStats = getFileStats(BACKEND_SCHEMA);
  const computeStats = getFileStats(COMPUTE_SCHEMA);

  log(`📁 Backend schema: ${BACKEND_SCHEMA}`, colors.cyan);
  log(`📁 Compute service schema: ${COMPUTE_SCHEMA}`, colors.blue);

  // Check if schemas are already identical
  if (
    fs.existsSync(COMPUTE_SCHEMA) &&
    filesAreIdentical(BACKEND_SCHEMA, COMPUTE_SCHEMA)
  ) {
    log("✅ Schemas are already synchronized!", colors.green);

    if (backendStats && computeStats) {
      log(
        `📅 Backend modified: ${backendStats.mtime.toISOString()}`,
        colors.cyan
      );
      log(
        `📅 Compute service modified: ${computeStats.mtime.toISOString()}`,
        colors.blue
      );
    }

    return;
  }

  // Read backend schema
  const backendSchema = readFile(BACKEND_SCHEMA);
  if (!backendSchema) {
    log("❌ Failed to read backend schema", colors.red);
    process.exit(1);
  }

  // Add header comment to identify copied schema
  const timestamp = new Date().toISOString();
  const schemaWithHeader = `// This file is automatically synchronized from apps/backend/prisma/schema.prisma
// Last synced: ${timestamp}
// DO NOT MODIFY DIRECTLY - Use the sync-prisma-schemas.js script

${backendSchema}`;

  // Write to compute service schema
  if (writeFile(COMPUTE_SCHEMA, schemaWithHeader)) {
    log("✅ Successfully synchronized schemas!", colors.green);
    log(`📝 Copied from: ${BACKEND_SCHEMA}`, colors.cyan);
    log(`📝 Copied to: ${COMPUTE_SCHEMA}`, colors.blue);
    log(`⏰ Timestamp: ${timestamp}`, colors.yellow);
  } else {
    log("❌ Failed to write compute service schema", colors.red);
    process.exit(1);
  }

  // Provide next steps
  log("\n📋 Next steps:", colors.cyan);
  log(
    "1. Run `pnpm prisma generate` in apps/compute-service to generate client",
    colors.yellow
  );
  log("2. Commit the synchronized schema to version control", colors.yellow);
  log("3. Deploy both applications with identical schemas", colors.yellow);
}

/**
 * Validate environment
 */
function validateEnvironment() {
  // Check if we're in the right directory
  const packageJsonPath = path.join(ROOT_DIR, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    log("❌ This script must be run from the project root", colors.red);
    process.exit(1);
  }

  // Check if backend app exists
  const backendDir = path.join(ROOT_DIR, "apps/backend");
  if (!fs.existsSync(backendDir)) {
    log("❌ Backend app directory not found", colors.red);
    process.exit(1);
  }

  log("✅ Environment validation passed", colors.green);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    log("📚 Prisma Schema Synchronization Script", colors.cyan);
    log("");
    log("Usage: node scripts/sync-prisma-schemas.js [options]", colors.blue);
    log("");
    log("Options:", colors.blue);
    log("  --help, -h     Show this help message", colors.yellow);
    log(
      "  --force, -f    Force synchronization even if files are identical",
      colors.yellow
    );
    log("");
    log("Description:", colors.blue);
    log(
      "This script copies the Prisma schema from apps/backend to apps/worker"
    );
    log("to ensure both applications have identical database types.");
    return;
  }

  validateEnvironment();
  syncSchemas();
}

// Run the script
main();

export { syncSchemas, validateEnvironment };
