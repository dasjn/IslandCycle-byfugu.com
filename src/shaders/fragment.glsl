uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform float uProgress;
uniform float uTime;
varying vec2 vUv;

const float MAX_WAVE_AMPLITUDE_SUM = 0.02 + 0.04 + 0.02 + 0.03;
const float MAX_BASE_TRANSITION_WIDTH = 0.3;
const float MAX_ADAPTIVE_WIDTH_ADDITION = MAX_WAVE_AMPLITUDE_SUM * 0.5;
const float MAX_TOTAL_ADAPTIVE_WIDTH = MAX_BASE_TRANSITION_WIDTH + MAX_ADAPTIVE_WIDTH_ADDITION;

void main() {
  float smoothedProgress = smoothstep(0.0, 1.0, uProgress);
  smoothedProgress = smoothedProgress * smoothedProgress * (3.0 - 2.0 * smoothedProgress);

  float progressStartOffset = -MAX_WAVE_AMPLITUDE_SUM;
  float progressEndTarget = 1.0 + MAX_WAVE_AMPLITUDE_SUM + MAX_TOTAL_ADAPTIVE_WIDTH;
  float actualProgress = mix(progressStartOffset, progressEndTarget, smoothedProgress);

  float time = uTime * 1.2;
  float waveFactor = 1.0 - abs(vUv.x - 0.5) * 2.0;
  waveFactor = clamp(waveFactor, 0.0, 1.0);

  float mainWave = sin(vUv.y * 4.0 + time * 1.5) * 0.02 * waveFactor;
  float secondaryWave = sin(vUv.y * 7.0 + time * 2.0) * 0.04 * waveFactor;
  float detailWave = sin(vUv.y * 12.0 + time * 2.5) * 0.02 * waveFactor;
  float counterWave = cos(vUv.y * 5.5 - time * 1.8) * 0.03 * waveFactor;

  float waveShape = mainWave + secondaryWave + detailWave + counterWave;
  float transitionLine = actualProgress + waveShape;

  float distFromCenterX = abs(vUv.x - 0.5) * 0.2;
  float falloffSharpness = 10.0;
  float widthFalloff = 1.0 - pow(distFromCenterX, falloffSharpness);
  widthFalloff = clamp(widthFalloff, 0.0, 1.0);

  float baseTransitionWidthValue = MAX_BASE_TRANSITION_WIDTH * widthFalloff;
  float adaptiveWidth = baseTransitionWidthValue + abs(waveShape) * 0.5;
  float distanceToWave = vUv.x - transitionLine;
  float edgeSoft = smoothstep(-adaptiveWidth, 0.0, distanceToWave);

  vec4 color1 = texture2D(uTexture1, vUv);
  vec4 color2 = texture2D(uTexture2, vUv);
  vec4 finalColor = mix(color1, color2, edgeSoft);

  float glowValue = 0.0;
  if (adaptiveWidth > 0.0001) {
    glowValue = (1.0 - abs(distanceToWave) / adaptiveWidth);
  }
  glowValue = clamp(glowValue, 0.0, 1.0);

  float animatedGlowStrength = (sin(time * 5.0) * 0.3 + 0.7) * waveFactor;
  finalColor.rgb += glowValue * 0.1 * animatedGlowStrength;

  gl_FragColor = finalColor;
}
