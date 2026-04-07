'use server'

import { createClient } from '@/lib/supabase/server'

export async function logAudit({
  action,
  table_name,
  record_id,
  old_data,
  new_data
}: {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL',
  table_name: string,
  record_id: string,
  old_data?: any,
  new_data?: any
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return // No log if no user (should not happen in protected routes)

  const { error } = await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    table_name,
    record_id,
    old_data: old_data || null,
    new_data: new_data || null
  })

  if (error) {
    console.error('Audit Log Error:', error)
  }
}
