import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagamentosPage } from './pagamentos.page';

describe('PagamentosPage', () => {
  let component: PagamentosPage;
  let fixture: ComponentFixture<PagamentosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PagamentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
