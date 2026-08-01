import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth, generateRandomPin, hashPin } from '@/lib/server-auth';
import { RoleType } from '@/types';

const ALLOWED_ROLES: RoleType[] = ['penjual', 'pos', 'mc', 'verifikator', 'admin'];

function serviceRoleGuard(): NextResponse | null {
  if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
      { status: 500 }
    );
  }
  return null;
}

function publicUser(u: Record<string, unknown>) {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    active: u.active,
    created_at: u.created_at,
  };
}

// Admin only. Mengelola petugas (user) + PIN unik.
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const guard = serviceRoleGuard();
    if (guard) return guard;

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ success: true, users: [] });
    }

    const { data, error } = await serverSupabase
      .from('users')
      .select('id, name, role, active, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, users: (data || []).map(publicUser) });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /users GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/users — buat petugas baru. PIN acak di-generate server dan
// hanya dikembalikan SEKALI di response ini.
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const guard = serviceRoleGuard();
    if (guard) return guard;

    const body = await request.json();
    const name = String(body.name || '').trim();
    const role = body.role as RoleType;

    if (!name) {
      return NextResponse.json({ error: 'Nama petugas wajib diisi' }, { status: 400 });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase belum dikonfigurasi' }, { status: 500 });
    }

    const pin = generateRandomPin();
    const { salt, hash } = hashPin(pin);
    const user = {
      id: 'usr_' + randomUUID(),
      name,
      role,
      pin_salt: salt,
      pin_hash: hash,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await serverSupabase.from('users').insert([user]);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      user: publicUser(user),
      pin, // Ditampilkan sekali untuk diserahkan ke petugas.
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /users POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/users — ubah nama/role/aktif, atau reset PIN baru.
export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const guard = serviceRoleGuard();
    if (guard) return guard;

    const body = await request.json();
    const id = String(body.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'ID user wajib diisi' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase belum dikonfigurasi' }, { status: 500 });
    }

    const { data: existing, error: findErr } = await serverSupabase
      .from('users')
      .select('id, name, role, active, created_at')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let newPin: string | undefined;

    if (typeof body.name === 'string' && body.name.trim()) {
      update.name = body.name.trim();
    }
    if (ALLOWED_ROLES.includes(body.role)) {
      update.role = body.role;
    }
    if (typeof body.active === 'boolean') {
      update.active = body.active;
    }
    if (body.resetPin === true) {
      newPin = generateRandomPin();
      const { salt, hash } = hashPin(newPin);
      update.pin_salt = salt;
      update.pin_hash = hash;
    }

    const { data: updated, error: updErr } = await serverSupabase
      .from('users')
      .update(update)
      .eq('id', id)
      .select('id, name, role, active, created_at')
      .single();

    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      user: publicUser(updated),
      ...(newPin ? { pin: newPin } : {}),
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /users PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/users?id=... — hapus petugas dari sistem.
export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const guard = serviceRoleGuard();
    if (guard) return guard;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID user wajib diisi' }, { status: 400 });
    }

    if (isServerSupabaseConfigured()) {
      const { error } = await serverSupabase.from('users').delete().eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /users DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
