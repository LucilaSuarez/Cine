import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Resenias } from './resenias';

describe('Resenias', () => {
  let component: Resenias;
  let fixture: ComponentFixture<Resenias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resenias],
    }).compileComponents();

    fixture = TestBed.createComponent(Resenias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
