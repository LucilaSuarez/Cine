import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenCompra } from './resumen-compra';

describe('ResumenCompra', () => {
  let component: ResumenCompra;
  let fixture: ComponentFixture<ResumenCompra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenCompra],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenCompra);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
