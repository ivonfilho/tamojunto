import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecuperarSenhaSmsPage } from './recuperar-senha-sms.page';

describe('RecuperarSenhaSmsPage', () => {
  let component: RecuperarSenhaSmsPage;
  let fixture: ComponentFixture<RecuperarSenhaSmsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecuperarSenhaSmsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
