# `subscriptionCount` operator for RxJS
## rxjs-subscription-count
Count subscriptions to observables. Useful for testing `Observable` flattening strategies.

## Installation
Install using NPM CLI
```
npm install --save rxjs-subscription-count
```

or using Yarn CLI
```
yarn add rxjs-subscription-count
```

## Use cases
Test that the subscriptions are switched (`switchMap` or `switchAll`) correctly
to prevent memory leaks and race conditions.

## Usage
```typescript
import { BehaviorSubject, empty } from 'rxjs';
import { subscriptionCount } from 'rxjs-subscription-count';

const counter: BehaviorSubject<number> = new BehaviorSubject(0);
const source: Observable<never> = empty().pipe(
  subscriptionCount(counter),
);
```

## `switchMap` test case
```typescript
import {
  BehaviorSubject,
  interval,
  Observable,
  range,
  Subscription,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { subscriptionCount } from './subscription-count';

describe('switchMap', () => {
  it('keeps a single subscription', () => {
    const threeValues: Observable<number> = range(1, 3);
    const subscriptionCounter: BehaviorSubject<number> = new BehaviorSubject(0);
    const infiniteValues: Observable<number> = interval(0).pipe(
      subscriptionCount(subscriptionCounter),
    );

    const subscription: Subscription = threeValues.pipe(
      switchMap(() => infiniteValues),
    ).subscribe();

    expect(subscriptionCounter.value).toBe(1);
    subscription.unsubscribe();
  });
});
```

## `mergeMap` test case
```typescript
import {
  BehaviorSubject,
  interval,
  Observable,
  range,
  Subscription,
} from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { subscriptionCount } from './subscription-count';

describe('mergeMap', () => {
  it('results in a subscription per emitted value', () => {
    const threeValues: Observable<number> = range(1, 3);
    const subscriptionCounter: BehaviorSubject<number> = new BehaviorSubject(0);
    const infiniteValues: Observable<number> = interval(0).pipe(
      subscriptionCount(subscriptionCounter),
    );

    const subscription: Subscription = threeValues.pipe(
      mergeMap(() => infiniteValues),
    ).subscribe();

    expect(subscriptionCounter.value).toBe(3);
    subscription.unsubscribe();
  });
});

```
