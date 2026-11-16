import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://ykllbcbfduvysyomaycz.supabase.co'
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable__zuRPAkyUJLRtuKyrvqYvg_YybPx916').trim()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
