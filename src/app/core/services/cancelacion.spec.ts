import { TestBed } from '@angular/core/testing';
import { Cancelacion } from './cancelacion';

describe('Cancelacion', () => {
  let service: Cancelacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cancelacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
