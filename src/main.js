const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
if (!gl) { alert("WebGL2 not supported"); }

const htVertexSrc = `#version 300 es
precision highp float;

out vec3 color;

void main() {
    vec2 positions[3];
    positions[0] = vec2( 0.0,  0.5);
    positions[1] = vec2(-0.5, -0.5);
    positions[2] = vec2( 0.5, -0.5);

    gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);

    color = vec3(float(gl_VertexID == 0), float(gl_VertexID == 1), float(gl_VertexID == 2));
}
`;

const htFragmentSrc = `#version 300 es
precision highp float;

in vec3 color;
out vec4 fragColor;

void main() {
    fragColor = vec4(color, 1.0); // interpolated color
}
`;

const blitVertexSrc = `#version 300 es
precision highp float;
out vec2 vUV;
void main() {
    vec2 positions[3] = vec2[3](
        vec2(-1.0, -1.0),
        vec2(3.0, -1.0),
        vec2(-1.0, 3.0)
    );
    gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
    vUV = gl_Position.xy * 0.5 + 0.5;
}
`;

const blitFragmentSrc = `#version 300 es
precision highp float;

in vec2 vUV;
uniform sampler2D uTex;
out vec4 fragColor;

void main() {
    fragColor = texture(uTex, vUV);
}
`;

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
htShader.create(gl, htVertexSrc, htFragmentSrc);

const blitShader = new Shader();
blitShader.create(gl, blitVertexSrc, blitFragmentSrc);

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