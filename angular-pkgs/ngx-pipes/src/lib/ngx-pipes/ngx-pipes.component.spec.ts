import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxPipesComponent } from './ngx-pipes.component';

describe('NgxPipesComponent', () => {
  let component: NgxPipesComponent;
  let fixture: ComponentFixture<NgxPipesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxPipesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxPipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
