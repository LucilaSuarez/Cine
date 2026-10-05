const fs = require('fs');

const dir = 'src/environments';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Faltan las variables SUPABASE_URL o SUPABASE_ANON_KEY');
    process.exit(1);
}

const contenido = (prod) => `export const environments = {
    production: ${prod},
    supabaseUrl: '${url}',
    supabaseAnonkey: '${key}'
};
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/environments.ts`, contenido(false));
fs.writeFileSync(`${dir}/environments.prod.ts`, contenido(true));