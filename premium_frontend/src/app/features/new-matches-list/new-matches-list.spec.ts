import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMatchesList } from './new-matches-list';

describe('NewMatchesList', () => {
  let component: NewMatchesList;
  let fixture: ComponentFixture<NewMatchesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMatchesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewMatchesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
