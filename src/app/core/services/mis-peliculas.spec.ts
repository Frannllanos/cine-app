import { TestBed } from '@angular/core/testing';
import { MisPeliculas } from './mis-peliculas';

describe('MisPeliculas', () => {
  let service: MisPeliculas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MisPeliculas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
