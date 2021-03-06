var test = require('tape');
var mobx = require('../');

test('action should wrap in transaction', t => {
	var values = [];

	var observable = mobx.observable(0);
	var d = mobx.autorun(() => values.push(observable.get()));

	var increment = mobx.action("increment", (amount) => {
		observable.set(observable.get() + amount * 2);
		observable.set(observable.get() - amount); // oops
	});

	increment(7);

	t.deepEqual(values, [0, 7]);

	t.end();
});


test('action modifications should be picked up 1', t => {
	var a = mobx.observable(1);
	var i = 3;
	var b = 0;

	mobx.autorun(() => {
		b = a.get() * 2;
	});

	t.equal(b, 2);

	var action = mobx.action(() => {
		a.set(++i);
	});

	action();
	t.equal(b, 8);

	action();
	t.equal(b, 10);

	t.end();
});

test('action modifications should be picked up 1', t => {
	var a = mobx.observable(1);
	var b = 0;

	mobx.autorun(() => {
		b = a.get() * 2;
	});

	t.equal(b, 2);

	var action = mobx.action(() => {
		a.set(a.get() + 1); // ha, no loop!
	});

	action();
	t.equal(b, 4);

	action();
	t.equal(b, 6);

	t.end();
});

test('action modifications should be picked up 3', t => {
	var a = mobx.observable(1);
	var b = 0;

	var doubler = mobx.computed(() => a.get() * 2);

	doubler.observe(() => {
		b = doubler.get();
	}, true);

	t.equal(b, 2);

	var action = mobx.action(() => {
		a.set(a.get() + 1); // ha, no loop!
	});

	action();
	t.equal(b, 4);

	action();
	t.equal(b, 6);

	t.end();
});


test('test action should be untracked', t => {
	var a = mobx.observable(3);
	var b = mobx.observable(4);
	var latest = 0;
	var runs = 0;

	var action = mobx.action((baseValue) => {
		b.set(baseValue * 2);
		latest = b.get(); // without action this would trigger loop
	});

	var d = mobx.autorun(() => {
		runs++;
		var current = a.get();
		action(current);
	});

	t.equal(b.get(), 6);
	t.equal(latest, 6);

	a.set(7);
	t.equal(b.get(), 14);
	t.equal(latest, 14);

	a.set(8);
	t.equal(b.get(), 16);
	t.equal(latest, 16);

	b.set(7); // should have no effect
	t.equal(a.get(), 8)
	t.equal(b.get(), 7);
	t.equal(latest, 16); // effect not triggered

	a.set(3);
	t.equal(b.get(), 6);
	t.equal(latest, 6);

	t.equal(runs, 4);

	d();
	t.end();
});

test('should be possible to create autorun in ation', t => {
	var a = mobx.observable(1);
	var values = [];
	
	var adder = mobx.action(inc => {
		return mobx.autorun(() => {
			values.push(a.get() + inc);
		})
	});
	
	var d1 = adder(2);
	a.set(3);
	var d2 = adder(17);
	a.set(24);
	d1();
	a.set(11);
	d2();
	a.set(100);

	t.deepEqual(values, [
		3,
		5,
		20,
		26,
		41,
		28
	]);
	t.end();
})

test('should not be possible to invoke action in a computed block', t => {
	var a = mobx.observable(2);

	var noopAction = mobx.action(() => {});

	var c = mobx.computed(() => {
		debugger;
		noopAction();
		return a.get();
	});

	t.throws(() => {
		mobx.autorun(() => c.get());
	}, /Computed values or transformers should not invoke actions or trigger other side effects/, 'expected throw');
	t.end();
});

test('action in autorun should be untracked', t => {
	var a = mobx.observable(2);
	var b = mobx.observable(3);
	
	var data = [];
	var multiplier = mobx.action(val => val * b.get());
	
	var d = mobx.autorun(() => {
		data.push(multiplier(a.get()));
	});
	
	a.set(3);
	b.set(4);
	a.set(5);
	
	d();
	
	a.set(6);
	
	t.deepEqual(data, [
		6, 9, 20
	]);
	
	t.end();
})