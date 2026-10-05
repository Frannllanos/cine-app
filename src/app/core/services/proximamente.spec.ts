import { TestBed } from '@angular/core/testing';
import { Proximamente } from './proximamente';

describe('Proximamente', () => {
  let service: Proximamente;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Proximamente);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
