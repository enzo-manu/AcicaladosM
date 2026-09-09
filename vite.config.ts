import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

/**
 * Route Handler middleware para procesar el intercambio de código OAuth de Supabase
 * utilizando @supabase/ssr y persistir la sesión segura en cookies HTTP.
 */
function supabaseAuthCallbackPlugin(env: Record<string, string>) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return {
    name: 'supabase-auth-callback-handler',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/auth/callback')) {
          try {
            const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
            const code = url.searchParams.get('code');
            const nextParam = url.searchParams.get('next');

            if (code) {
              if (!supabaseUrl || !supabaseAnonKey) {
                console.warn('[Vite Auth Handler] Variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas.');
                next();
                return;
              }

              const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                  getAll() {
                    return parseCookieHeader(req.headers.cookie ?? '');
                  },
                  setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                      res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, options));
                    });
                  },
                },
              });

              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (!error && data?.user) {
                // Consultar rol en la tabla profiles de Supabase
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', data.user.id)
                  .single();

                const role = profile?.role || 'cliente';
                const redirectTarget =
                  role === 'admin' || role === 'recepcionista' ? '/dashboard' : nextParam || '/mi-cuenta';

                res.statusCode = 302;
                res.setHeader('Location', redirectTarget);
                res.end();
                return;
              }
            }
          } catch (err) {
            console.error('Error en Route Handler /auth/callback:', err);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), supabaseAuthCallbackPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              usePolling: true,
              interval: 1000,
            },
    },
  };
});
