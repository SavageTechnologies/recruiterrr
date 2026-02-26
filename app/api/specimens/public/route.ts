import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase.server'

export async function GET(req: NextRequest) {
  // Public endpoint — no auth required, but only return confirmed specimens
  // and strip any personally identifying recruiter data
  const { data, error } = await supabase
    .from('anathema_specimens')
    .select('id, agent_name, city, state, confirmed_tree, confirmed_tree_other, confirmed_sub_imo, predicted_confidence, created_at')
    .not('confirmed_tree', 'is', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ specimens: data || [] })
}
