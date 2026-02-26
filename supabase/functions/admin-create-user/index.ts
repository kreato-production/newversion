import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

type CreateUserPayload = {
  codigoExterno?: string | null
  nome: string
  email: string
  usuario: string
  senha?: string | null
  foto?: string | null
  perfilId?: string | null
  descricao?: string | null
  status?: 'Ativo' | 'Inativo' | string | null
  tipoAcesso?: string | null
  recursoHumanoId?: string | null
  tenantId?: string | null
  // For update-only mode (existing user password change)
  userId?: string | null
  updateOnly?: boolean
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse({ success: false, error: 'Configuração do servidor incompleta.' }, 500)
    }

    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Não autenticado.' }, 401)
    }

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await supabaseUserClient.auth.getUser()
    if (userError || !userData?.user) {
      return jsonResponse({ success: false, error: 'Sessão inválida.' }, 401)
    }

    const callerId = userData.user.id

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Authorize: only admins or global_admins can create/update users
    const { data: adminRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .in('role', ['admin', 'global_admin'])

    if (roleError) {
      console.error('Error checking admin role:', roleError)
      return jsonResponse({ success: false, error: 'Falha ao validar permissão.' }, 500)
    }

    if (!adminRoles || adminRoles.length === 0) {
      return jsonResponse({ success: false, error: 'Sem permissão para criar usuários.' }, 403)
    }

    const isCallerGlobalAdmin = adminRoles.some((r: any) => r.role === 'global_admin')

    // Fetch caller's tenant_id to inherit for new users
    let callerTenantId: string | null = null
    if (!isCallerGlobalAdmin) {
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id')
        .eq('id', callerId)
        .maybeSingle()
      callerTenantId = callerProfile?.tenant_id ?? null
    }

    let payload: CreateUserPayload
    try {
      payload = (await req.json()) as CreateUserPayload
    } catch {
      return jsonResponse({ success: false, error: 'Body inválido.' }, 400)
    }

    // ──────────────────────────────────────────────
    // UPDATE-ONLY MODE: update auth password for existing user
    // ──────────────────────────────────────────────
    if (payload.updateOnly && payload.userId) {
      const updateAuthData: Record<string, unknown> = {}

      // Update password if provided
      if (payload.senha && payload.senha.length > 0) {
        if (payload.senha.length < 6) {
          return jsonResponse({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }, 400)
        }
        updateAuthData.password = payload.senha
      }

      // Update auth email if username changed
      if (payload.usuario) {
        const newAuthEmail = `${payload.usuario.toLowerCase()}@kreato.app`
        updateAuthData.email = newAuthEmail
        updateAuthData.user_metadata = {
          usuario: payload.usuario,
          nome: payload.nome || undefined,
        }
      }

      if (Object.keys(updateAuthData).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(payload.userId, updateAuthData)
        if (updateAuthError) {
          console.error('Error updating auth user:', updateAuthError)
          return jsonResponse({ success: false, error: 'Falha ao atualizar dados de autenticação.' }, 400)
        }
      }

      return jsonResponse({ success: true, userId: payload.userId })
    }

    // ──────────────────────────────────────────────
    // CREATE MODE
    // ──────────────────────────────────────────────
    if (!payload?.nome || !payload?.email || !payload?.usuario || !payload?.senha) {
      return jsonResponse({ success: false, error: 'Campos obrigatórios ausentes.' }, 400)
    }

    if (payload.senha.length < 6) {
      return jsonResponse({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }, 400)
    }

    // 1) Try to create auth user
    const authEmail = `${payload.usuario.toLowerCase()}@kreato.app`
    let newUserId: string

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: payload.senha,
      email_confirm: true,
      user_metadata: {
        nome: payload.nome,
        usuario: payload.usuario,
      },
    })

    if (createError) {
      if (createError.message?.includes('already been registered') || (createError as any).code === 'email_exists') {
        console.log('User already exists in auth, attempting to find and reuse...')
        
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error('Error listing users:', listError)
          return jsonResponse({ success: false, error: 'Falha ao buscar usuário existente.' }, 500)
        }

        const existingUser = listData.users.find(u => u.email?.toLowerCase() === authEmail.toLowerCase())
        
        if (!existingUser) {
          return jsonResponse({ success: false, error: 'Email já registrado mas usuário não encontrado.' }, 400)
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: payload.senha,
          email_confirm: true,
          user_metadata: {
            nome: payload.nome,
            usuario: payload.usuario,
          },
        })

        if (updateError) {
          console.error('Error updating existing auth user:', updateError)
          return jsonResponse({ success: false, error: 'Falha ao atualizar usuário existente.' }, 400)
        }

        newUserId = existingUser.id
        console.log('Reusing existing auth user:', newUserId)
      } else {
        console.error('Error creating auth user:', createError)
        return jsonResponse({ success: false, error: createError.message || 'Falha ao criar usuário.' }, 400)
      }
    } else if (!authData?.user) {
      return jsonResponse({ success: false, error: 'Falha ao criar usuário.' }, 400)
    } else {
      newUserId = authData.user.id
    }

    // 2) Create/Update profile
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: newUserId,
        codigo_externo: payload.codigoExterno ?? null,
        nome: payload.nome,
        email: payload.email,
        usuario: payload.usuario,
        foto_url: payload.foto ?? null,
        perfil_id: payload.perfilId ?? null,
        descricao: payload.descricao ?? null,
        status: payload.status ?? 'Ativo',
        tipo_acesso: payload.tipoAcesso ?? 'Operacional',
        recurso_humano_id: (payload.recursoHumanoId && payload.recursoHumanoId !== 'none') ? payload.recursoHumanoId : null,
        tenant_id: payload.tenantId ?? callerTenantId ?? null,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return jsonResponse({ success: false, error: 'Falha ao criar perfil do usuário.' }, 400)
    }

    // 3) Ensure base role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: newUserId, role: 'user' }, { onConflict: 'user_id,role' })

    if (roleInsertError) {
      console.error('Error assigning user role:', roleInsertError)
    }

    return jsonResponse({ success: true, userId: newUserId })
  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ success: false, error: errorMessage }, 500)
  }
})
