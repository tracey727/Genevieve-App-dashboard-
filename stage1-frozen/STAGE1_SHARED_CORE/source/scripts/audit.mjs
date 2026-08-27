import fs from 'node:fs';
const required=['package.json','src/core/states.js','src/core/authz.js','src/core/security.js','src/db/schema.sql','src/db/repository.js','src/http/app.js','src/server.js','test/core.test.js','docs/SECURITY_MODEL.md','README.md'];
let failed=false;for(const f of required){if(!fs.existsSync(new URL('../'+f,import.meta.url))){console.error('MISSING',f);failed=true}else console.log('OK',f)}
if(failed)process.exit(1);console.log('Static package audit: GREEN');
