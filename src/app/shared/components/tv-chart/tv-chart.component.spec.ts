import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TvChartComponent } from './tv-chart.component';

describe('TvChartComponent', () => {
  let component: TvChartComponent;
  let fixture: ComponentFixture<TvChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TvChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TvChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
