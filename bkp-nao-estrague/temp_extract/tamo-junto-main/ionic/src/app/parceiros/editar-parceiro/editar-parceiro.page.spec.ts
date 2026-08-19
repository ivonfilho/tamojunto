import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarParceiroPage } from './editar-parceiro.page';

describe('EditarParceiroPage', () => {
  let component: EditarParceiroPage;
  let fixture: ComponentFixture<EditarParceiroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarParceiroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
