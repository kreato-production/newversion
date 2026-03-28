function createDisabledSupabaseClient() {
  const fail = () => {
    throw new Error('O cliente legado do Supabase foi desativado. Use a API local do projeto.');
  };

  return new Proxy(
    {},
    {
      get() {
        return fail;
      },
      apply() {
        return fail();
      },
    },
  );
}

export const supabase = createDisabledSupabaseClient();
