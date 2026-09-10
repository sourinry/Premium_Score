import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainWhitelisting } from './domain-whitelisting';

describe('DomainWhitelisting', () => {
  let component: DomainWhitelisting;
  let fixture: ComponentFixture<DomainWhitelisting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainWhitelisting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DomainWhitelisting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
