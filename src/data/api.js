// Single surface for every query + RPC. RLS scopes all reads/writes to the caller;
// status transitions and inventory publish go through the SECURITY DEFINER RPCs.
import { supabase } from '../lib/supabaseClient'

// ---- Projects -----------------------------------------------------------------
export async function listProjects() {
  // RLS scopes rows: managers see their own, esg_admin sees all.
  const { data, error } = await supabase
    .from('dr_projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getProject(id) {
  const { data, error } = await supabase.from('dr_projects').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createProject(payload) {
  // status defaults to 'evaluation'; project_code + submitted_by set by trigger/default.
  const { data, error } = await supabase.from('dr_projects').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateProject(id, patch) {
  // Owner may revise fields only while status = 'restudy' (RLS); never status itself.
  const { data, error } = await supabase.from('dr_projects').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ---- Comments -----------------------------------------------------------------
export async function listComments(projectId) {
  const { data, error } = await supabase
    .from('dr_comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

// ---- Plants -------------------------------------------------------------------
export async function listPlants() {
  const { data, error } = await supabase.from('tc_plants').select('plant_id, plant_name').order('plant_id')
  if (error) throw error
  return data ?? []
}

// ---- Workflow RPCs (status set only here) -------------------------------------
export async function advanceProject(id) {
  const { error } = await supabase.rpc('dr_advance_project', { p_project_id: id })
  if (error) throw error
}
export async function approveProject(id) {
  const { error } = await supabase.rpc('dr_approve_project', { p_project_id: id })
  if (error) throw error
}
export async function returnProject(id, comment) {
  const { error } = await supabase.rpc('dr_return_project', { p_project_id: id, p_comment: comment })
  if (error) throw error
}
export async function resubmitProject(id) {
  const { error } = await supabase.rpc('dr_resubmit_project', { p_project_id: id })
  if (error) throw error
}

// ---- Annual inventory ---------------------------------------------------------
export async function listInventory() {
  const { data, error } = await supabase
    .from('dr_annual_inventory')
    .select('*')
    .order('year', { ascending: true })
  if (error) throw error
  return data ?? []
}
export async function previewInventory(year) {
  const { data, error } = await supabase.rpc('dr_preview_inventory', { p_year: year })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return row ?? { scope1_tco2e: 0, scope2_tco2e: 0 }
}
export async function publishInventory(year, scope3) {
  const { data, error } = await supabase.rpc('dr_publish_inventory', {
    p_year: year,
    p_scope3_tco2e: scope3,
  })
  if (error) throw error
  return data
}
export async function plantScopeTotals(year) {
  const { data, error } = await supabase.rpc('dr_plant_scope_totals', { p_year: year })
  if (error) throw error
  return data ?? []
}
