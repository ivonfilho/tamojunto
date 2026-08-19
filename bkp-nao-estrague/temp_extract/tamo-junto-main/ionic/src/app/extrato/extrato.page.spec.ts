import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExtratoPage } from './extrato.page';

describe('ExtratoPage', () => {
  let component: ExtratoPage;
  let fixture: ComponentFixture<ExtratoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtratoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
