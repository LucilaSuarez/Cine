import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccesoPersonal } from './acceso-personal';

describe('AccesoPersonal', () => {
  let component: AccesoPersonal;
  let fixture: ComponentFixture<AccesoPersonal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccesoPersonal],
    }).compileComponents();

    fixture = TestBed.createComponent(AccesoPersonal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
