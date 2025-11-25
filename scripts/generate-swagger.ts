import fs from 'fs';
import path from 'path';
import specs from '../src/config/swagger';

const outputPath = path.join(__dirname, '..', 'swagger.json');

// Write swagger specs to file
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2), 'utf-8');

console.log('✅ Swagger specification generated successfully!');
console.log(`📄 File saved to: ${outputPath}`);
