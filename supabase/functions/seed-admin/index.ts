import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bootstrap-secret',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isEmailAlreadyRegistered(error: { message?: string; code?: string } | null): boolean {
  return Boolean(
    error?.message?.includes('already been registered') ||
      error?.code === 'email_exists',
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const bootstrapSecret = Deno.env.get('KREATO_BOOTSTRAP_SECRET')
    const adminEmail = Deno.env.get('KREATO_GLOBAL_ADMIN_EMAIL') ?? 'admin_global@kreato.app'
    const adminPassword = Deno.env.get('KREATO_GLOBAL_ADMIN_PASSWORD')
    const adminUser = Deno.env.get('KREATO_GLOBAL_ADMIN_USERNAME') ?? 'admin_global'

    if (!supabaseUrl || !supabaseServiceKey || !bootstrapSecret || !adminPassword) {
      return jsonResponse(
        { success: false, error: 'Configuracao do bootstrap administrativo incompleta.' },
        500,
      )
    }

    const providedSecret = req.headers.get('x-bootstrap-secret')
    if (providedSecret !== bootstrapSecret) {
      return jsonResponse({ success: false, error: 'Nao autorizado.' }, 401)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('usuario', adminUser)
      .maybeSingle()

    if (profileLookupError) {
      console.error('Error fetching existing admin profile:', profileLookupError)
      return jsonResponse({ success: false, error: 'Falha ao verificar administrador global.' }, 500)
    }

    if (existingProfile) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          nome: 'Administrador Global',
          usuario: adminUser,
        },
      })

      if (updateAuthError) {
        console.error('Error updating admin auth:', updateAuthError)
        return jsonResponse({ success: false, error: 'Falha ao atualizar o administrador global.' }, 400)
      }

      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          nome: 'Administrador Global',
          usuario: adminUser,
          email: adminEmail,
          status: 'Ativo',
          tipo_acesso: 'Global',
        })
        .eq('id', existingProfile.id)

      if (updateProfileError) {
        console.error('Error updating admin profile:', updateProfileError)
        return jsonResponse({ success: false, error: 'Falha ao atualizar o perfil do administrador global.' }, 400)
      }

      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: existingProfile.id, role: 'global_admin' }, { onConflict: 'user_id,role' })

      if (roleError) {
        console.error('Error assigning global_admin role:', roleError)
        return jsonResponse({ success: false, error: 'Falha ao garantir o papel global_admin.' }, 400)
      }

      return jsonResponse({
        success: true,
        message: 'Administrador global atualizado com sucesso.',
        user: { id: existingProfile.id, usuario: adminUser, email: adminEmail },
      })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        nome: 'Administrador Global',
        usuario: adminUser,
      },
    })

    let adminUserId = authData?.user?.id ?? null

    if (authError && isEmailAlreadyRegistered(authError)) {
      const { data: users, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
      if (listUsersError) {
        console.error('Error listing auth users:', listUsersError)
        return jsonResponse({ success: false, error: 'Falha ao recuperar usuario existente.' }, 500)
      }

      const existingAuthUser = users.users.find((user) => user.email?.toLowerCase() === adminEmail.toLowerCase())
      if (!existingAuthUser) {
        return jsonResponse({ success: false, error: 'Usuario auth existente nao encontrado.' }, 400)
      }

      const { error: updateExistingAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          nome: 'Administrador Global',
          usuario: adminUser,
        },
      })

      if (updateExistingAuthError) {
        console.error('Error updating existing admin auth:', updateExistingAuthError)
        return jsonResponse({ success: false, error: 'Falha ao atualizar usuario auth existente.' }, 400)
      }

      adminUserId = existingAuthUser.id
    } else if (authError) {
      console.error('Error creating admin auth user:', authError)
      return jsonResponse({ success: false, error: 'Falha ao criar administrador global.' }, 400)
    }

    if (!adminUserId) {
      return jsonResponse({ success: false, error: 'Nao foi possivel resolver o usuario administrador.' }, 400)
    }

    const { error: upsertProfileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: adminUserId,
        nome: 'Administrador Global',
        usuario: adminUser,
        email: adminEmail,
        status: 'Ativo',
        tipo_acesso: 'Global',
      },
      { onConflict: 'id' },
    )

    if (upsertProfileError) {
      console.error('Error upserting admin profile:', upsertProfileError)
      return jsonResponse({ success: false, error: 'Falha ao persistir perfil do administrador global.' }, 400)
    }

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: adminUserId, role: 'global_admin' }, { onConflict: 'user_id,role' })

    if (roleError) {
      console.error('Error assigning global_admin role:', roleError)
      return jsonResponse({ success: false, error: 'Falha ao atribuir papel global_admin.' }, 400)
    }

    return jsonResponse({
      success: true,
      message: 'Administrador global provisionado com sucesso.',
      user: { id: adminUserId, usuario: adminUser, email: adminEmail },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ success: false, error: errorMessage }, 500)
  }
})
