import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ykllbcbfduvysyomaycz.supabase.co'
const supabaseAnonKey = 'sb_publishable__zuRPAkyUJLRtuKyrvqYvg_YybPx916/*  */'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)