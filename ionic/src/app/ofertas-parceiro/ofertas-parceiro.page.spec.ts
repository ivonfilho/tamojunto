import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfertasParceiroPage } from './ofertas-parceiro.page';

describe('OfertasParceiroPage', () => {
  let component: OfertasParceiroPage;
  let fixture: ComponentFixture<OfertasParceiroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OfertasParceiroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
