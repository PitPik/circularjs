window.treeModel = [{
	id: '0',
	name: 'my-name 0',
	text: 'Root item 0',
	isOpen: true,
	childNodes: [{
		id: '0-0',
		name: 'my-name 0-0',
		text: 'Some item 0-0',
	}, {
		id: '0-1',
		name: 'my-name 0-1',
		text: 'Some item 0-1',
		isOpen: true,
		childNodes: [{
			id: '0-1-0',
			name: 'my-name 0-1-0',
			text: 'Some item 0-1-0',
		}, {
			id: '0-1-1',
			name: 'my-name 0-1-1',
			text: 'Some item 0-1-1',
			isOpen: true,
			childNodes: [{
				id: '0-1-1-0',
				name: 'my-name 0-1-1-0',
				text: 'Some item 0-1-1-0',
			}, {
				id: '0-1-1-1',
				name: 'my-name 0-1-1-1',
				text: 'Some item 0-1-1-1',
			}, {
				id: '0-1-1-2',
				name: 'my-name 0-1-1-2',
				text: 'Some item 0-1-1-2 more',
			}]
		}, {
			id: '0-1-2',
			name: 'my-name 0-1-2',
			text: 'Some item 0-1-2',
		}]
	}, {
		id: '0-2',
		name: 'my-name 0-2',
		text: 'Some item 0-2',
		isOpen: false,
		childNodes: [{
			id: '0-2-0',
			name: 'my-name 0-2-0',
			text: 'Some item 0-2-0',
		}, {
			id: '0-2-1',
			name: 'my-name 0-2-1',
			text: 'Some item 0-2-1',
		}, {
			id: '0-2-2',
			name: 'my-name 0-2-2',
			text: 'Some item 0-2-2',
		}]
	}, {
		id: '0-3',
		name: 'my-name 0-3',
		text: 'Some item 0-3',
		isOpen: false,
	}]
}, {
	id: '1',
	name: 'my-name 1',
	text: 'Root item 1',
	isOpen: false,
	childNodes: [{
		id: '1-0',
		name: 'my-name 1-0',
		text: 'Some item 1-0',
	}, {
		id: '1-1',
		name: 'my-name 1-1',
		text: 'Some item 1-1',
		isOpen: false,
		childNodes: [{
			id: '1-1-0',
			name: 'my-name 1-1-0',
			text: 'Some item 1-1-0',
		}, {
			id: '1-1-1',
			name: 'my-name 1-1-1',
			text: 'Some item 1-1-1',
		}, {
			id: '1-1-2',
			name: 'my-name 1-1-2',
			text: 'Some item 1-1-2',
		}]
	}]
}, {
	id: '2',
	name: 'my-name 2',
	text: 'Root item 2',
	isOpen: false,
	isLast: true,
	childNodes: [{
		id: '2-0',
		name: 'my-name 2-0',
		text: 'Some item 2-0',
	}, {
		id: '2-1',
		name: 'my-name 2-1',
		text: 'Some item 2-1',
		isOpen: false,
		childNodes: [{
			id: '2-1-0',
			name: 'my-name 2-1-0',
			text: 'Some item 2-1-0',
		}, {
			id: '2-1-1',
			name: 'my-name 2-1-1',
			text: 'Some item 2-1-1',
		}, {
			id: '2-1-2',
			name: 'my-name 2-1-2',
			text: 'Some item 2-1-2',
		}]
	}, {
		id: '3-0',
		name: 'my-name 3-0',
		text: 'Some item 3-0',
	}]
}];

window.treeModelExt = [{
	name: 'my-name 2',
	text: 'Root item 2',
	isOpen: true,
	childNodes: [{
		name: 'my-name 2-0',
		text: 'Some item 2-0',
	}, {
		name: 'my-name 2-1',
		text: 'Some item 2-1',
		isOpen: true,
		childNodes: [{
			name: 'my-name 2-1-0',
			text: 'Some item 2-1-0',
		}, {
			name: 'my-name 2-1-1',
			text: 'Some item 2-1-1',
		}, {
			name: 'my-name 2-1-2',
			text: 'Some item 2-1-2',
		}]
	}, {
		name: 'my-name 3-0',
		text: 'Some item 3-0',
	}]
}];