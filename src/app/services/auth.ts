import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { DatosRegistro, Perfil, RolUsuario } from '../task/task-model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private client = inject(SupabaseService).client;
    private router = inject(Router);

    readonly session = signal<Session | null>(null);
    readonly perfil = signal<Perfil | null>(null);
    readonly cargando = signal(true);   // true hasta saber si hay sesión guardada

    readonly estaLogueado = computed(() => !!this.session());
    readonly rol = computed<RolUsuario | null>(() => this.perfil()?.rol ?? null);

    private resolverLista!: () => void;
    readonly lista = new Promise<void>(resolve => (this.resolverLista = resolve));

    constructor() {
        // Se dispara al iniciar (restaura la sesión guardada), al loguearse y al desloguearse
        this.client.auth.onAuthStateChange((_evento, session) => {
            this.session.set(session);

            // Importante: no usar await de Supabase directo dentro de este callback,
            // puede quedar trabado. Lo mandamos al siguiente ciclo.
            setTimeout(async () => {
                await this.cargarPerfil(session?.user.id);
                this.cargando.set(false);
                this.resolverLista();
            });
        });
    }

    private async cargarPerfil(id?: string) {
        if (!id) {
            this.perfil.set(null);
            return;
        }
        const { data } = await this.client
            .from('perfiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        this.perfil.set(data as Perfil | null);
    }

    async login(email: string, password: string) {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) throw new Error(this.traducirError(error.message));

        // Cargamos el perfil para que un guard de rol se ejecute correctamente
        this.session.set(data.session);
        await this.cargarPerfil(data.user.id);
    }

    // Devuelve true si quedó con la sesión iniciada, false si hay que confirmar el email
    async registrar(datos: DatosRegistro): Promise<boolean> {
        const { data, error } = await this.client.auth.signUp({
            email: datos.email,
            password: datos.password,
            options: {
                // El trigger handle_new_user() lee estos datos y crea el perfil
                data: {
                    nombre: datos.nombre,
                    apellido: datos.apellido,
                    fecha_nacimiento: datos.fecha_nacimiento,
                    tipo_sangre: datos.tipo_sangre,
                    color_ojos: datos.color_ojos,
                    dias_vacaciones: datos.dias_vacaciones
                }
            }
        });
        if (error) throw new Error(this.traducirError(error.message));

        // Con "Confirm email" activo, un email repetido no da error: devuelve un usuario sin identidades
        if (data.user && data.user.identities?.length === 0) {
            throw new Error('Ya existe una cuenta con ese email.');
        }
        return !!data.session;
    }

    async cerrarSesion() {
        await this.client.auth.signOut();
        this.router.navigateByUrl('/');
    }

    private traducirError(mensaje: string): string {
        const m = mensaje.toLowerCase();
        if (m.includes('invalid login credentials')) return 'El email o la contraseña son incorrectos.';
        if (m.includes('email not confirmed')) return 'Tenés que confirmar tu email antes de ingresar.';
        if (m.includes('already registered')) return 'Ya existe una cuenta con ese email.';
        if (m.includes('password')) return 'La contraseña no cumple los requisitos (mínimo 6 caracteres).';
        if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Esperá un momento y probá de nuevo.';
        return 'No se pudo completar la operación. Intentá de nuevo.';
    }
}