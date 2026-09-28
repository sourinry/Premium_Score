import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fancylist } from './fancylist';

describe('Fancylist', () => {
  let component: Fancylist;
  let fixture: ComponentFixture<Fancylist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fancylist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fancylist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
