import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeuPerfilPage } from './meu-perfil.page';

describe('MeuPerfilPage', () => {
  let component: MeuPerfilPage;
  let fixture: ComponentFixture<MeuPerfilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MeuPerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
