import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MinhasComprasPage } from './minhas-compras.page';

describe('MinhasComprasPage', () => {
  let component: MinhasComprasPage;
  let fixture: ComponentFixture<MinhasComprasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MinhasComprasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
