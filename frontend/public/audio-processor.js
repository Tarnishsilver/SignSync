class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      if (channelData) {
        // Clone the array before posting because the underlying buffer 
        // will be detached or modified by the audio subsystem
        this.port.postMessage(new Float32Array(channelData));
      }
    }
    return true;
  }
}

registerProcessor("recorder-worklet", RecorderProcessor);
