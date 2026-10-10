import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { PerfilService } from '../../services/perfil';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  readonly auth = inject(AuthService);
  readonly perfilService = inject(PerfilService);

  async ngOnInit() {
    const usuario = this.auth.perfil();

    if (!usuario) {
      return;
    }
    await this.perfilService.cargarPeliculasAsistidas(usuario.id);
  }
}
