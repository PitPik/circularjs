var input = document.querySelector('.new-todo');
var keypressEvent = document.createEvent('Event');

for (var n = 0; n < 100; n++) {
	input.value = 'Something to do #' + n;
    keypressEvent.initEvent('keypress', true, true);
    keypressEvent.which = 13;
    input.dispatchEvent(keypressEvent);
}