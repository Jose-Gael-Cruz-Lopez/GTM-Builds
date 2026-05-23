import { supabase } from '@/integrations/supabase/client'

export async function signOut() {
  await supabase.auth.signOut()
  localStorage.removeItem('nexoleal:current-business-id')
  localStorage.removeItem('nexoleal:staff-key')
}
