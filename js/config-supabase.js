// Credenciales de Supabase para este proyecto.
//
// Esta es la "anon key" (llave anónima/pública) de Supabase — SÍ está
// pensada para viajar hasta el navegador del cliente y quedar visible en
// el código fuente de la página. Lo que de verdad protege los datos es la
// configuración de Row Level Security (RLS) del lado de Supabase: son las
// reglas de RLS las que deciden qué puede leer o escribir cualquiera que
// use esta llave, no el hecho de que la llave esté "escondida".
//
// MUY IMPORTANTE — nunca confundir esta llave con la "service_role key":
// esa es una llave totalmente distinta que se salta el RLS por completo
// (acceso total a la base de datos). Esa sí es secreta de verdad: JAMÁS
// debe escribirse en este archivo, ni en ningún otro que se suba a git o
// se le entregue al cliente sin advertirle expresamente.
export const SUPABASE_URL = 'https://xxlwtlenmhosvmfcpzfp.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_8HlJe-j7GgiaPqwD1fzVPg_vzTOn8Ft';
