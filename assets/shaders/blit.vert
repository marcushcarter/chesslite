#version 300 es
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
