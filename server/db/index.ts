import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const url = (process.env.DATABASE_URL || '').replace(/[&?]channel_binding=[^&]*/g, '')
const sql = neon(url)
export const db = drizzle(sql, { schema })
