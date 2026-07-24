import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MensagensPage } from './mensagens.page';

describe('MensagensPage', () => {
  let component: MensagensPage;
  let fixture: ComponentFixture<MensagensPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MensagensPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
