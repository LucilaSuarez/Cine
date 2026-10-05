import { createClient } from "@supabase/supabase-js";
import { environments } from "../../environments/environments";
import { Injectable } from '@angular/core';

console.log('URL:', JSON.stringify(environments.supabaseUrl));
console.log('KEY:', JSON.stringify(environments.supabaseAnonkey?.slice(0, 15)), 'largo:', environments.supabaseAnonkey?.length);
@Injectable({ providedIn: 'root' })
export class SupabaseService {
    readonly client = createClient(environments.supabaseUrl, environments.supabaseAnonkey);
}