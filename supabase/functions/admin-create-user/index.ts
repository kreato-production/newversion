import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type CreateUserPayload = {
  codigoExterno?: string | null
  nome: string
  email: string
  usuario: string
  senha: string
  foto?: string | null
  perfilId?: string | null
  descricao?: string | null
  status?: 'Ativo' | 'Inativo' | string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await supabaseUserClient.auth.getUser()
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sessão inválida.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = userData.user.id

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Authorize: only admins can create users
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError) {
      console.error('Error checking admin role:', roleError)
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao validar permissão.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!adminRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sem permissão para criar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let payload: CreateUserPayload
    try {
      payload = (await req.json()) as CreateUserPayload
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Body inválido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!payload?.nome || !payload?.email || !payload?.usuario || !payload?.senha) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios ausentes.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (payload.senha.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1) Create auth user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.senha,
      email_confirm: true,
      user_metadata: {
        nome: payload.nome,
        usuario: payload.usuario,
      },
    })

    if (createError || !authData?.user) {
      const msg = createError?.message || 'Falha ao criar usuário.'
      console.error('Error creating auth user:', createError)
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = authData.user.id

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
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      // Rollback auth user if profile failed
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao criar perfil do usuário.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3) Ensure base role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: newUserId, role: 'user' }, { onConflict: 'user_id,role' })

    if (roleInsertError) {
      console.error('Error assigning user role:', roleInsertError)
      // Non-fatal
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
