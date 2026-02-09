
import { createClient } from '@supabase/supabase-js';

// Define que esta função deve rodar no Edge Runtime (mais rápido e suporta Request/Response nativos)
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // 1. Verificação de Segurança (CRON_SECRET)
  // O Vercel Cron injeta o header 'Authorization' automaticamente se configurado no dashboard
  const authHeader = request.headers.get('authorization');
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Inicializar Supabase com Service Role (Permissão Admin para ignorar RLS e deletar dados)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase Environment Variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cria cliente admin sem persistência de sessão (ideal para serverless)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // 3. Chamar a Procedure SQL (RPC) criada no banco de dados
    const { data, error } = await supabase.rpc('reset_demo_environments');

    if (error) {
      console.error('Erro ao executar reset:', error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true, message: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
