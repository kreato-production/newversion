import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if admin user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('usuario', 'admin_global')
      .maybeSingle()

    if (existingProfile) {
      // Update auth email and password to match expected values
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      })
      if (updateError) {
        console.error('Error updating admin auth:', updateError)
      }

      // Ensure profile email matches
      await supabaseAdmin.from('profiles').update({ email: adminEmail }).eq('id', existingProfile.id)

      // Ensure role is global_admin
      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: existingProfile.id, role: 'global_admin' }, { onConflict: 'user_id,role' })

      return new Response(
        JSON.stringify({ success: true, message: 'Global Admin user updated and ensured role.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin user with Supabase Auth
    const adminEmail = 'admin_global@kreato.app'
    const adminPassword = 'kreato_global'
    const adminUser = 'admin_global'

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nome: 'Administrador Global',
        usuario: adminUser
      }
    })

    // If email exists but user doesn't match above check (edge case), handle error or find user
    if (authError && authError.message.includes('already been registered')) {
        // Find auth user
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingAuth = users.users.find(u => u.email === adminEmail)
        
        if (existingAuth) {
             // Create profile for admin if missing
            const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: existingAuth.id,
                nome: 'Administrador Global',
                usuario: adminUser,
                email: adminEmail,
                status: 'Ativo',
                tipo_acesso: 'Global',
            })

            // Assign role
            await supabaseAdmin
            .from('user_roles')
            .upsert({ user_id: existingAuth.id, role: 'global_admin' }, { onConflict: 'user_id,role' })

            return new Response(
                JSON.stringify({ success: true, message: 'Recovered existing auth user for global admin.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
    }

    if (authError) {
      console.error('Error creating admin auth user:', authError)
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create admin user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create profile for admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        nome: 'Administrador Global',
        usuario: adminUser,
        email: adminEmail,
        status: 'Ativo',
        tipo_acesso: 'Global',
      })

    if (profileError) {
      console.error('Error creating admin profile:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make sure the user has global_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: 'global_admin'
      }, { onConflict: 'user_id,role' })

    if (roleError) {
      console.error('Error assigning admin role:', roleError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Global Admin user created successfully',
        credentials: {
          usuario: adminUser,
          senha: adminPassword
        }
      }),
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
