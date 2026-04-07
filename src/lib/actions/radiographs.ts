'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'
import { logAudit } from './audit'

export async function uploadRadiograph(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('file') as File
  const patient_id = formData.get('patient_id') as string
  const clinical_record_idParam = formData.get('clinical_record_id') as string | null
  const clinical_record_id = clinical_record_idParam ? clinical_record_idParam : null
  const type = formData.get('type') as string
  const date = formData.get('date') as string
  const notes = formData.get('notes') as string

  if (!file || !file.name) {
    return { error: 'No file provided' }
  }

  // Generate unique filename to avoid collisions
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${patient_id}/${uuidv4()}.${fileExt}`

  // Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('radiographs')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (storageError) {
    console.error('Storage Error:', storageError)
    return { error: 'Failed to upload image' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('radiographs')
    .getPublicUrl(fileName)

  // Save to DB
  const { data: newEntry, error: dbError } = await supabase
    .from('radiographs')
    .insert({
      patient_id,
      clinical_record_id,
      image_url: publicUrl,
      type,
      date,
      notes
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB Error:', dbError)
    // Optional: Delete from storage if DB fails
    await supabase.storage.from('radiographs').remove([fileName])
    return { error: 'Failed to save radiograph record' }
  }

  await logAudit({
    action: 'CREATE',
    table_name: 'radiographs',
    record_id: newEntry.id,
    new_data: newEntry
  })

  revalidatePath(`/patients/${patient_id}`)
  return { success: true }
}

export async function getPatientRadiographs(patientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('radiographs')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
  
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function deleteRadiograph(radiographId: string, imageUrl: string, patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Extract path from public URL
  // "https://.../storage/v1/object/public/radiographs/user_id/patient_id/uuid.jpg"
  const storagePathMatch = imageUrl.match(/radiographs\/(.*)$/)
  if (storagePathMatch && storagePathMatch[1]) {
    const path = storagePathMatch[1]
    const { error: removeError } = await supabase.storage.from('radiographs').remove([path])
    if (removeError) {
      console.error('Failed to remove from storage', removeError)
    }
  }

  const { data: oldData } = await supabase.from('radiographs').select('*').eq('id', radiographId).single()
  const { error } = await supabase
    .from('radiographs')
    .delete()
    .eq('id', radiographId)

  if (error) {
    console.error(error)
    return { error: 'Failed to delete radiograph record' }
  }

  await logAudit({
    action: 'DELETE',
    table_name: 'radiographs',
    record_id: radiographId,
    old_data: oldData
  })

  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}
