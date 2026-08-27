import pg from 'pg';
import { hashPassword } from '../src/core/security.js';
const {Pool}=pg;
const [,,agencyCode,email,displayName,role,password]=process.argv;
if(!agencyCode||!email||!displayName||!role||!password){console.error('Usage: node scripts/create-user.mjs <agencyCode> <email> <displayName> <role> <password>');process.exit(1)}
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='disable'?false:{rejectUnauthorized:false}});
try{const a=await pool.query(`SELECT id FROM agencies WHERE code=$1`,[agencyCode]);if(!a.rows[0])throw new Error(`Unknown agency ${agencyCode}`);const q=await pool.query(`INSERT INTO users(agency_id,email,display_name,role,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING id,email,role`,[a.rows[0].id,email,displayName,role,hashPassword(password)]);console.log(q.rows[0]);}finally{await pool.end();}
