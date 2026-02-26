import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('anathema_specimens')
    .select('id, agent_name, city, state, predicted_tree, predicted_confidence, confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes, agent_website, agent_address, created_at')
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ specimens: data || [] })
}
