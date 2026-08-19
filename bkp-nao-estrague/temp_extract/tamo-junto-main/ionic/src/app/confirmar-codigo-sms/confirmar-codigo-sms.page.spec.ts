import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmarCodigoSmsPage } from './confirmar-codigo-sms.page';

describe('ConfirmarCodigoSmsPage', () => {
  let component: ConfirmarCodigoSmsPage;
  let fixture: ComponentFixture<ConfirmarCodigoSmsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmarCodigoSmsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
