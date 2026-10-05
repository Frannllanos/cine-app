import { TestBed } from '@angular/core/testing';
import { Resena } from './resena';

describe('Resena', () => {
  let service: Resena;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Resena);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
