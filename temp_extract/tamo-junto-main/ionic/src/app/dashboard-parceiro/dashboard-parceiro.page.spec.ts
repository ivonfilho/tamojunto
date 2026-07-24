import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardParceiroPage } from './dashboard-parceiro.page';

describe('DashboardParceiroPage', () => {
  let component: DashboardParceiroPage;
  let fixture: ComponentFixture<DashboardParceiroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardParceiroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
