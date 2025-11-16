import { supabase } from '../lib/supabaseClient';

// All helpers are best-effort. If tables don't exist, calls resolve gracefully.

export async function createGroup(name) {
	try {
		const code = Math.random().toString(36).slice(2, 7).toUpperCase();
		const { data, error } = await supabase
			.from('groups')
			.insert({ name: name || 'Study Group', code })
			.select()
			.single();
		if (error) throw error;
		return data; // { id, name, code, ... }
	} catch {
		// Fallback: ephemeral group via code only
		return { id: null, name: name || 'Study Group', code: Math.random().toString(36).slice(2, 7).toUpperCase() };
	}
}

export async function joinGroupByCode(code, userId) {
	try {
		const { data: grp, error: gErr } = await supabase.from('groups').select('*').eq('code', code).maybeSingle();
		if (gErr) throw gErr;
		if (!grp) return { group: null, member: null };
		const { data: member, error: mErr } = await supabase
			.from('group_members')
			.upsert({ group_id: grp.id, user_id: userId }, { onConflict: 'group_id,user_id' })
			.select()
			.single();
		if (mErr) throw mErr;
		return { group: grp, member };
	} catch {
		return { group: null, member: null };
	}
}

export async function leaveGroup(groupId, userId) {
	try {
		if (!groupId || !userId) return;
		await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
	} catch {
		// ignore
	}
}

export async function listGroupMembers(groupId) {
	try {
		if (!groupId) return [];
		const { data, error } = await supabase
			.from('group_members_view') // preferred view joining profiles
			.select('*')
			.eq('group_id', groupId);
		if (error) throw error;
		return data || [];
	} catch {
		return [];
	}
}

export const groupSchemaSql = `
-- Optional schema for persistent groups (run in Supabase SQL editor)
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamp with time zone default now(),
  primary key (group_id, user_id)
);

-- Optional helper view if you have a profiles table
create or replace view public.group_members_view as
  select gm.group_id, gm.user_id, gm.joined_at
  from public.group_members gm;
`;


