import { createClient } from "@supabase/supabase-js";
import { environments } from "../../environments/environments";
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    readonly client = createClient(environments.supabaseUrl, environments.supabaseAnonkey);
}