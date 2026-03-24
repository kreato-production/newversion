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
  userId?: string | null
  updateOnly?: boolean
}

type UserRole = {
  role: string
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
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse({ success: false, error: 'Configuracao do servidor incompleta.' }, 500)
    }

    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Nao autenticado.' }, 401)
    }

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await supabaseUserClient.auth.getUser()
    if (userError || !userData?.user) {
      return jsonResponse({ success: false, error: 'Sessao invalida.' }, 401)
    }

    const callerId = userData.user.id

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: adminRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .in('role', ['admin', 'global_admin'])

    if (roleError) {
      console.error('Error checking admin role:', roleError)
      return jsonResponse({ success: false, error: 'Falha ao validar permissao.' }, 500)
    }

    if (!adminRoles || adminRoles.length === 0) {
      return jsonResponse({ success: false, error: 'Sem permissao para criar usuarios.' }, 403)
    }

    const isCallerGlobalAdmin = adminRoles.some((role: UserRole) => role.role === 'global_admin')

    let callerTenantId: string | null = null
    if (!isCallerGlobalAdmin) {
      const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id')
        .eq('id', callerId)
        .maybeSingle()

      if (callerProfileError) {
        console.error('Error fetching caller profile:', callerProfileError)
        return jsonResponse({ success: false, error: 'Falha ao resolver tenant do administrador.' }, 500)
      }

      callerTenantId = callerProfile?.tenant_id ?? null
      if (!callerTenantId) {
        return jsonResponse({ success: false, error: 'Administrador sem tenant associado.' }, 403)
      }
    }

    let payload: CreateUserPayload
    try {
      payload = (await req.json()) as CreateUserPayload
    } catch {
      return jsonResponse({ success: false, error: 'Body invalido.' }, 400)
    }

    if (!isCallerGlobalAdmin) {
      if (payload.tenantId && payload.tenantId !== callerTenantId) {
        return jsonResponse({ success: false, error: 'Sem permissao para operar em outro tenant.' }, 403)
      }
      payload.tenantId = callerTenantId
    }

    if (payload.updateOnly && payload.userId) {
      if (!isCallerGlobalAdmin) {
        const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
          .from('profiles')
          .select('tenant_id')
          .eq('id', payload.userId)
          .maybeSingle()

        if (targetProfileError) {
          console.error('Error checking target profile tenant:', targetProfileError)
          return jsonResponse({ success: false, error: 'Falha ao validar usuario alvo.' }, 500)
        }

        if (!targetProfile || targetProfile.tenant_id !== callerTenantId) {
          return jsonResponse({ success: false, error: 'Sem permissao para alterar este usuario.' }, 403)
        }
      }

      const updateAuthData: Record<string, unknown> = {}

      if (payload.senha && payload.senha.length > 0) {
        if (payload.senha.length < 6) {
          return jsonResponse({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }, 400)
        }
        updateAuthData.password = payload.senha
      }

      if (payload.usuario) {
        updateAuthData.email = `${payload.usuario.toLowerCase()}@kreato.app`
        updateAuthData.user_metadata = {
          usuario: payload.usuario,
          nome: payload.nome || undefined,
        }
      }

      if (Object.keys(updateAuthData).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(payload.userId, updateAuthData)
        if (updateAuthError) {
          console.error('Error updating auth user:', updateAuthError)
          return jsonResponse({ success: false, error: 'Falha ao atualizar dados de autenticacao.' }, 400)
        }
      }

      return jsonResponse({ success: true, userId: payload.userId })
    }

    if (!payload?.nome || !payload?.email || !payload?.usuario || !payload?.senha) {
      return jsonResponse({ success: false, error: 'Campos obrigatorios ausentes.' }, 400)
    }

    if (payload.senha.length < 6) {
      return jsonResponse({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }, 400)
    }

    const authEmail = `${payload.usuario.toLowerCase()}@kreato.app`
    let newUserId: string
    let createdAuthUser = false

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
      if (isEmailAlreadyRegistered(createError)) {
        console.log('User already exists in auth, attempting to find and reuse...')

        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (listError) {
          console.error('Error listing users:', listError)
          return jsonResponse({ success: false, error: 'Falha ao buscar usuario existente.' }, 500)
        }

        const existingUser = listData.users.find((user) => user.email?.toLowerCase() === authEmail.toLowerCase())
        if (!existingUser) {
          return jsonResponse({ success: false, error: 'Email ja registrado mas usuario nao encontrado.' }, 400)
        }

        const { error: updateExistingUserError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: payload.senha,
          email_confirm: true,
          user_metadata: {
            nome: payload.nome,
            usuario: payload.usuario,
          },
        })

        if (updateExistingUserError) {
          console.error('Error updating existing auth user:', updateExistingUserError)
          return jsonResponse({ success: false, error: 'Falha ao atualizar usuario existente.' }, 400)
        }

        newUserId = existingUser.id
      } else {
        console.error('Error creating auth user:', createError)
        return jsonResponse({ success: false, error: createError.message || 'Falha ao criar usuario.' }, 400)
      }
    } else if (!authData?.user) {
      return jsonResponse({ success: false, error: 'Falha ao criar usuario.' }, 400)
    } else {
      newUserId = authData.user.id
      createdAuthUser = true
    }

    const tenantId = isCallerGlobalAdmin ? payload.tenantId ?? null : callerTenantId

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
        recurso_humano_id:
          payload.recursoHumanoId && payload.recursoHumanoId !== 'none' ? payload.recursoHumanoId : null,
        tenant_id: tenantId,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      if (createdAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
      }
      return jsonResponse({ success: false, error: 'Falha ao criar perfil do usuario.' }, 400)
    }

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
