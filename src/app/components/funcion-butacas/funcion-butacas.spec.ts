import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FuncionButacas } from './funcion-butacas';

describe('FuncionButacas', () => {
  let component: FuncionButacas;
  let fixture: ComponentFixture<FuncionButacas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuncionButacas],
    }).compileComponents();

    fixture = TestBed.createComponent(FuncionButacas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
