#!/usr/bin/env node

/**
 * SQL Column Name Checker
 * 
 * Checks the codebase for potential PostgreSQL column name mismatches
 * in raw SQL queries (quoted camelCase identifiers).
 * 
 * Usage: node scripts/check-sql-column-names.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to detect problematic SQL
const patterns = {
  // Quoted camelCase in raw SQL calls
  quotedInRawSQL: {
    regex: /\.raw\([^)]*["']([A-Z][a-zA-Z]+)["']/g,
    message: 'Quoted camelCase identifier in raw SQL query'
  },
  
  // UPDATE queries with quoted camelCase columns
  quotedInUpdate: {
    regex: /UPDATE\s+\w+\s+SET\s+["']([A-Z][a-zA-Z]+)["']/gi,
    message: 'UPDATE query with quoted camelCase column'
  },
  
  // RETURNING clauses with quoted camelCase columns
  quotedInReturning: {
    regex: /RETURNING\s+["']([A-Z][a-zA-Z]+)["']/gi,
    message: 'RETURNING clause with quoted camelCase column'
  },
  
  // SET clauses with quoted camelCase
  quotedInSet: {
    regex: /SET\s+["']([A-Z][a-zA-Z]+)["']\s*=/gi,
    message: 'SET clause with quoted camelCase column'
  }
};

// Safe patterns (OK to ignore)
const safePatterns = [
  /information_schema/,           // System tables
  /pg_indexes/,                   // PostgreSQL system tables
  /table_name/,                   // Column name detection queries
  /column_name/,                  // Column name detection queries
  /knex\.schema\./,               // Knex schema builder
  /strapi\.db\.query\(/,          // Strapi query builder
  /strapi\.entityService\./,      // Strapi entity service
  /\.json$/,                      // JSON files (schema definitions are OK)
  /node_modules/,                 // Dependencies
];

// Files/directories to exclude
const excludePaths = [
  'node_modules',
  '.cache',
  'build',
  'dist',
  '.tmp',
  'coverage',
  'scripts',
  'database/migrations',  // Migrations detect column names dynamically
  '.eslintrc',
  'package.json',
  'package-lock.json'
];

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return excludePaths.some(excluded => 
    filePath.includes(excluded) || filePath.includes('\\' + excluded) || filePath.includes('/' + excluded)
  );
}

/**
 * Check if match is safe (e.g., in comments or system queries)
 */
function isSafeMatch(filePath, match, context) {
  // Check if it's a comment
  const commentBefore = context.substring(0, context.indexOf(match)).trim();
  if (commentBefore.endsWith('//') || commentBefore.endsWith('/*') || commentBefore.includes('*')) {
    return true;
  }
  
  // Check safe patterns
  return safePatterns.some(pattern => pattern.test(context));
}

/**
 * Scan a file for problematic patterns
 */
function scanFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Only check TypeScript/JavaScript files with raw SQL
    if (!/\.(ts|js)$/.test(filePath) || !content.includes('.raw(') && !content.includes('UPDATE') && !content.includes('RETURNING')) {
      return issues;
    }
    
    Object.entries(patterns).forEach(([name, pattern]) => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const fullMatch = match[0];
        const columnName = match[1] || match[0];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1] || '';
        
        // Get context around the match
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + fullMatch.length + 50);
        const context = content.substring(start, end);
        
        // Check if this is a safe match
        if (isSafeMatch(filePath, fullMatch, context)) {
          continue;
        }
        
        issues.push({
          file: filePath,
          line: lineNumber,
          pattern: name,
          message: pattern.message,
          column: columnName,
          code: lineContent.trim(),
          context: context.replace(/\n/g, ' ').trim()
        });
      }
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
  
  return issues;
}

/**
 * Recursively find all TypeScript/JavaScript files
 */
function findFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (shouldExclude(filePath)) {
        return;
      }
      
      if (file.isDirectory()) {
        findFiles(filePath, fileList);
      } else if (/\.(ts|js)$/.test(file.name)) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
    if (error.code !== 'ENOENT') {
      console.warn(`Warning: Could not read ${dir}: ${error.message}`);
    }
  }
  
  return fileList;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Checking for PostgreSQL column name issues in raw SQL queries...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  console.log(`📁 Scanning ${files.length} TypeScript/JavaScript files...\n`);
  
  const allIssues = [];
  files.forEach(file => {
    const issues = scanFile(file);
    allIssues.push(...issues);
  });
  
  if (allIssues.length === 0) {
    console.log('✅ No issues found! All raw SQL queries use correct column naming.\n');
    process.exit(0);
  }
  
  console.log(`⚠️  Found ${allIssues.length} potential issue(s):\n`);
  
  allIssues.forEach((issue, index) => {
    const relativePath = path.relative(path.join(__dirname, '..'), issue.file);
    console.log(`${index + 1}. ${relativePath}:${issue.line}`);
    console.log(`   ${issue.message}`);
    console.log(`   Column: "${issue.column}"`);
    console.log(`   Code: ${issue.code}`);
    console.log(`   Context: ...${issue.context}...\n`);
  });
  
  console.log('\n💡 Tip: PostgreSQL columns created by Strapi use lowercase/snake_case.');
  console.log('   Use unquoted identifiers (balance, not "Balance") in raw SQL queries.\n');
  
  process.exit(1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { scanFile, patterns };
