import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { AppModule } from '../src/app.module';
import { swaggerConfig } from '../src/config/swagger.config';

// Ensure docs directory exists
const docsDir = path.join(process.cwd(), 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

async function generateSwaggerMarkdown() {
  console.log('--- Generating Swagger Markdown ---');
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  
  const swaggerJsonPath = 'swagger-spec.json';
  fs.writeFileSync(swaggerJsonPath, JSON.stringify(document, null, 2));
  
  const outputPath = 'docs/api-contracts.md';
  
  try {
    // Using widdershins to convert swagger to markdown
    execSync(`npx widdershins ${swaggerJsonPath} -o ${outputPath} --search false --language_tabs []`, { stdio: 'inherit' });
    console.log(`✅ API Contracts successfully exported to ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate API Contracts Markdown:', error);
  }

  await app.close();
}

async function generatePrismaDocs() {
  console.log('\n--- Generating Prisma Docs ---');
  try {
    // We run prisma generate which triggers all generators in schema.prisma
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma Docs generated successfully');
  } catch (error) {
    console.warn('⚠️ Prisma Docs generation had issues. If using prisma-docs-generator, it might need a specific environment setup.');
    console.error('Error details:', error.message);
  }
}

function generateDirectoryTree() {
  console.log('\n--- Generating Directory Structure ---');
  const outputPath = 'docs/directory-structure.md';
  try {
    let treeOutput = '';
    if (process.platform === 'win32') {
        // Use tree command and skip first few lines (volume info)
        const rawOutput = execSync('tree src /f /a').toString();
        const lines = rawOutput.split('\n');
        // Find where the actual tree starts
        const startIndex = lines.findIndex(line => line.includes('|') || line.includes('+') || line.includes('\\') || line.trim().startsWith('Folder'));
        // If it starts with "Folder PATH", skip it
        let cleanLines = lines.slice(startIndex >= 0 ? startIndex : 0);
        if (cleanLines[0] && cleanLines[0].includes('Folder PATH')) {
            cleanLines = cleanLines.slice(3); // Skip the path and volume info lines
        }
        treeOutput = cleanLines.join('\n').trim();
    } else {
        try {
            treeOutput = execSync('tree src').toString();
        } catch (e) {
            // Fallback if tree is not installed
            treeOutput = execSync('find src -maxdepth 3 -not -path "*/.*"').toString();
        }
    }
    
    const content = `# Backend Directory Structure\n\nGenerated on: ${new Date().toLocaleString()}\n\n\`\`\`text\n${treeOutput}\n\`\`\`\n`;
    fs.writeFileSync(outputPath, content);
    console.log(`✅ Directory structure exported to ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate Directory Structure:', error);
  }
}

async function run() {
  await generateSwaggerMarkdown();
  await generatePrismaDocs();
  generateDirectoryTree();
  console.log('\n✨ All documentation updated successfully!');
}

run().catch(err => {
  console.error('Documentation generation failed:', err);
  process.exit(1);
});
