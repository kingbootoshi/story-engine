#!/usr/bin/env ts-node
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

console.log('🔍 Checking log compliance...');

const srcDir = join(process.cwd(), 'src');
let hasErrors = false;

// Patterns to check for proper logging
const logPatterns = {
  correlationId: /correlation[_\s]*[iI]d/,
  moduleContext: /createLogger\(['"`][^'"`]+['"`]\)/,
  errorLogging: /logger\.error\([^,]+,\s*[^,]+/,
};

function checkFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const fileName = filePath.replace(process.cwd() + '/', '');
  
  // Skip test files and type definitions
  if (fileName.includes('.spec.') || fileName.includes('.test.') || fileName.endsWith('.d.ts')) {
    return;
  }
  
  // Check if file has logging
  if (content.includes('createLogger')) {
    // Verify module name is provided
    if (!logPatterns.moduleContext.test(content)) {
      console.error(`❌ ${fileName}: createLogger missing module name`);
      hasErrors = true;
    }
    
    // Check error logging includes error object
    if (content.includes('.error(') && !content.includes('logger.error(')) {
      const errorCalls = content.match(/\.error\([^)]+\)/g) || [];
      errorCalls.forEach(call => {
        if (!call.includes(',')) {
          console.error(`❌ ${fileName}: error() call missing error object parameter`);
          hasErrors = true;
        }
      });
    }
  }
}

function walkDir(dir: string): void {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (stat.isFile() && ['.ts', '.js'].includes(extname(file))) {
      checkFile(filePath);
    }
  });
}

walkDir(srcDir);

if (hasErrors) {
  console.error('❌ Log compliance check failed');
  process.exit(1);
} else {
  console.log('✅ Log compliance check passed');
  process.exit(0);
}