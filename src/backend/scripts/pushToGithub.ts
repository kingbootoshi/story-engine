import gitService from '../services/git.service';
import fs from 'fs/promises';
import path from 'path';

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'logs') {
        files.push(...await getAllFiles(fullPath));
      }
    } else {
      if (!item.startsWith('.') && !item.endsWith('.log')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

async function pushAllFiles() {
  try {
    console.log('🔍 Finding all project files...');
    const files = await getAllFiles('.');
    
    console.log(`📦 Found ${files.length} files to push`);
    
    const fileContents = await Promise.all(
      files.map(async (file) => ({
        path: file,
        content: await fs.readFile(file, 'utf-8')
      }))
    );
    
    console.log('🚀 Pushing files to GitHub...');
    await gitService.commitAndPush(fileContents, 'Initial project setup');
    
    console.log('✅ Successfully pushed all files to GitHub');
  } catch (error) {
    console.error('❌ Failed to push files:', error);
    process.exit(1);
  }
}

pushAllFiles();