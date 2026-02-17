#version 300 es
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
