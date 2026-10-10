import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { jsPDF } from 'jspdf';
import { CompraService } from '../../services/compra';
import { Comprobante as DatosComprobante } from '../../task/task-model';
import { PrecioPipe } from '../../pipes/precio-pipe';

const ZONA = 'America/Argentina/Buenos_Aires';

@Component({
  selector: 'app-comprobante',
  imports: [RouterLink, PrecioPipe],
  templateUrl: './comprobante.html',
  styleUrl: './comprobante.css',
})
export class Comprobante implements OnInit {
  private compra = inject(CompraService);
  private route = inject(ActivatedRoute);

  datos = signal<DatosComprobante | null>(null);
  qrImagen = signal<string | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  private formatoCuando = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ZONA,
  });

  cuando = computed(() => {
    const d = this.datos();
    return d ? this.formatoCuando.format(new Date(d.inicio)) : '';
  });

  async ngOnInit() {
    const qr = this.route.snapshot.paramMap.get('qr');
    if (!qr) {
      this.cargando.set(false);
      return;
    }
    try {
      const datos = await this.compra.obtenerComprobante(qr);
      this.datos.set(datos);
      if (datos) {
        // El QR contiene el UUID de la compra: es lo que escanea el empleado
        this.qrImagen.set(await toDataURL(datos.qr_codigo, { width: 300, margin: 1 }));
      }
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.cargando.set(false);
    }
  }

  descargarPdf() {
    const d = this.datos();
    const qr = this.qrImagen();
    if (!d || !qr) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a5' });
    let y = 18;

    doc.setFontSize(18);
    doc.text('CINEFRA - Entrada', 12, y);
    y += 10;

    doc.setFontSize(14);
    doc.text(d.pelicula, 12, y);
    y += 8;

    doc.setFontSize(11);
    const lineas = [
      `Funcion: ${this.cuando()}`,
      `Sala: ${d.sala}`,
      `Formato: ${d.formato} - ${d.idioma}`,
      `Butacas: ${d.butacas.join(', ')}`,
    ];
    for (const l of lineas) {
      doc.text(l, 12, y);
      y += 6;
    }

    if (d.items.length > 0) {
      y += 2;
      doc.text('Candy Bar:', 12, y);
      y += 6;
      for (const i of d.items) {
        doc.text(`  ${i.cantidad} x ${i.nombre}`, 12, y);
        y += 6;
      }
    }

    y += 2;
    doc.setFontSize(12);
    doc.text(`Total: $${d.total.toLocaleString('es-AR')}`, 12, y);
    y += 8;

    // RF-01.9: leyenda obligatoria en comprobantes con restricción de edad
    if (d.leyenda) {
      doc.setFontSize(9);
      const texto = doc.splitTextToSize(d.leyenda, 124);
      doc.text(texto, 12, y);
      y += texto.length * 4.5 + 4;
    }

    doc.addImage(qr, 'PNG', 12, y, 50, 50);
    doc.setFontSize(10);
    doc.text(`Codigo manual: ${d.codigo_manual}`, 70, y + 26);
    doc.text('Presenta este QR en la entrada', 70, y + 32);

    doc.save(`entrada-${d.codigo_manual}.pdf`);
  }

  imprimir() {
    window.print();
  }
}
