const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

gl.clearColor(1.0, 0.0, 0.0, 1.0);

function init() {}

function update(dt) {}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function loop(time) {
    update(time);
    render();
    requestAnimationFrame(loop);
}

init();
requestAnimationFrame(loop);
