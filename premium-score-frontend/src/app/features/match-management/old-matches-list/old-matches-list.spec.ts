import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OldMatchesList } from './old-matches-list';

describe('OldMatchesList', () => {
  let component: OldMatchesList;
  let fixture: ComponentFixture<OldMatchesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OldMatchesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OldMatchesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
