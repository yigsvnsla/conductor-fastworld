import { TestBed } from '@angular/core/testing';

import { CompleteStepsGuard } from './complete-steps.guard';

describe('CompleteStepsGuard', () => {
  let guard: CompleteStepsGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(CompleteStepsGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
