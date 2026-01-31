import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgumehtawdeogxjftaym.supabase.co';
const supabaseAnonKey = 'sb_publishable_l3qBCoDNHS399RZMgSo7oA_gGEG5Vjy'; // User provided key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
