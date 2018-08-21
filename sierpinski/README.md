# CircularJS Perf Demo

Sierpinski triangle: 1821 elements (60fps)

If you google for "sierpinski react" you'll find all kinds of links about "React Fiber vs Stack Demo", a test that was demonstrating the "old" version of react.js and the "new Fiber" renderer.

The test is about a component that contains deep Sierpinski triangle(s) build from components again.
This outer component changes the model's scale property on every ```requestAnimationFrame``` tick (every ~16ms) which triggers a re-rendering of this outer container.
Every second, all triangle's text nodes are updated. In this example there are 1821 nodes where 729 do have a text node.

The test with the old version of react.js re-rendered the whole component, including it's containing component with it's triangles instead of updating the views. This was the reason for a bad performance.

With their new rendering engine "Fiber" this problem was solved, but... it looks like cheating though.
It seemed as if this test was also about updating a deeply nested DOM structure and it's performance but with "Fiber" the Sierpinski triangl tree is all of a sudden flat.

This demo shows one way of how this Sierpinski triangle experiment can be done with CircularJS.
CircularJS only updates necessary DOM nodes and not the whole tree.

Enjoy