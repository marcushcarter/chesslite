const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
if (!gl) { alert("WebGL2 not supported"); }

function loadFromFile(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    if (xhr.status !== 200) throw new Error('Failed to load ' + url);
    return xhr.responseText;
}

class Shader {
    constructor() {}
    create(gl, vertexSrc, fragmentSrc) {
        this.gl = gl;
        this.program = this.#createProgram(gl, vertexSrc, fragmentSrc);
        this.uniformLocations = new Map();
    }
    delete() { this.gl.deleteProgram(this.program); }
    use() { this.gl.useProgram(this.program); }
    getUniformLocation(name) {
        if (!this.uniformLocations.has(name)) {
            const location = this.gl.getUniformLocation(this.program, name);
            this.uniformLocations.set(name, location);
        }
        return this.uniformLocations.get(name);
    }
    
    #compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Shader compilation failed: ' + info);
        }
        return shader;
    }

    #createProgram(gl, vertexSrc, fragmentSrc) {
        const vertexShader = this.#compileShader(gl, vertexSrc, gl.VERTEX_SHADER);
        const fragmentShader = this.#compileShader(gl, fragmentSrc, gl.FRAGMENT_SHADER);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error('Program linking failed: ' + info);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }
}

const htShader = new Shader();
htShader.create(gl, loadFromFile('../assets/shaders/ht.vert'), loadFromFile('../assets/shaders/ht.frag'));

const blitShader = new Shader();
blitShader.create(gl, loadFromFile('../assets/shaders/blit.vert'), loadFromFile('../assets/shaders/blit.frag'));

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const scale = 2;
let fbWidth = 512;
let fbHeight = 512;

const colorTex = gl.createTexture();
const rbo = gl.createRenderbuffer();
const fbo = gl.createFramebuffer();

blitShader.use();
gl.uniform1i(blitShader.getUniformLocation("uTex"), 0);

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    fbWidth = Math.floor(canvas.width / scale);
    fbHeight = Math.floor(canvas.height / scale);
    
    fbWidth = canvas.width;
    fbHeight = canvas.height;
    
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fbWidth, fbHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbWidth, fbHeight);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer not complete");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

window.addEventListener('resize', resize);
resize();

function update(dt) {
    
}

function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, fbWidth, fbHeight);
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    htShader.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    blitShader.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function loop(time) {
    update(time);
    render();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);